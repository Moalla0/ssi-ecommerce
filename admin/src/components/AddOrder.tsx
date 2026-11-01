"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, query, where, getDocs, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { getCurrentPrice, isDiscountValid, Product, formatPrice } from "@/lib/products";
import { X } from "lucide-react";

const orderItemSchema = z.object({
  productReference: z.union([z.string().min(1, { message: "Reference cannot be empty" }), z.number().int().positive({ message: "Reference must be positive!" })]),
  quantity: z.number().int().min(1, { message: "Quantity must be at least 1!" }),
});

const formSchema = z.object({
  items: z.array(orderItemSchema).min(1, { message: "Add at least one product" }),
  userEmail: z.string().email({ message: "Valid email is required!" }),
  status: z.enum(["pending", "processing", "success", "failed"]),
});

const AddOrder = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ productReference: "", quantity: 1 }],
      userEmail: "",
      status: "pending",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // 1) Lookup all products by reference and build items
      const productsRef = collection(db, "products");
      const items: Array<{ id: string; name: string; price: number; quantity: number; images: string[] } > = [];
      let total = 0;

      for (const item of values.items) {
        const qRef = query(productsRef, where("reference", "==", item.productReference));
        const snap = await getDocs(qRef);
        if (snap.empty) {
          toast.error(`No product found with reference ${item.productReference}`);
          return;
        }
        const productDoc = snap.docs[0];
        const productData = { id: productDoc.id, ...(productDoc.data() as any) } as Product & { id: string };
        const unitPrice = getCurrentPrice(productData);
        items.push({
          id: productData.id!,
          name: productData.name,
          price: unitPrice,
          quantity: item.quantity,
          images: (productData.images as any) || [],
        });
        total += unitPrice * item.quantity;
      }

      // 3) Get next order number (counters/orders)
      const counterRef = doc(collection(db, "counters"), "orders");
      const counterSnap = await getDoc(counterRef);
      let orderNumber = 1;
      if (counterSnap.exists()) {
        orderNumber = (counterSnap.data().current || 0) + 1;
        await updateDoc(counterRef, { current: increment(1), updatedAt: serverTimestamp() });
      } else {
        await setDoc(counterRef, { current: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        orderNumber = 1;
      }

      // 4) Build order item and order payload
      const orderPayload = {
        orderNumber,
        userEmail: values.userEmail,
        items,
        shippingInfo: { email: values.userEmail },
        total,
        status: values.status,
        createdAt: serverTimestamp(),
      };

      // 5) Create order
      await addDoc(collection(db, "orders"), orderPayload);

      toast.success(`Order #${orderNumber} created`);
      form.reset({ items: [{ productReference: "", quantity: 1 }], userEmail: "", status: "pending" });
    } catch (e: any) {
      console.error("Failed to create order:", e);
      toast.error(e?.message || "Failed to create order");
    }
  };
  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Order</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <h3 className="text-md font-semibold">Order Items</h3>
                {fields.map((f, index) => (
                  <div key={f.id} className="grid grid-cols-6 gap-3 items-end">
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`items.${index}.productReference` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Reference</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value.trim();
                                  if (value === "") {
                                    field.onChange("");
                                  } else {
                                    // Try to parse as number first, otherwise keep as string
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue) && numValue > 0) {
                                      field.onChange(numValue);
                                    } else {
                                      field.onChange(value);
                                    }
                                  }
                                }}
                                placeholder="Enter product reference (e.g., F552-5MP, 12345)"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                placeholder="1"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => append({ productReference: "", quantity: 1 })}
                >
                  Add Product
                </Button>
              </div>
              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Enter the user email for this order.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Enter the status of the order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddOrder;
