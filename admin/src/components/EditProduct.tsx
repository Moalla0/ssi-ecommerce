"use client";

import { useState, useEffect } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
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
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { updateProduct } from "@/lib/products";
import { Product } from "@shared/types";
import {
  getCategories,
  getSubcategoriesByCategoryId,
  Category,
  Subcategory,
} from "@/lib/categories";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Plus,
  X,
  Globe,
  Search,
} from "lucide-react";
import { toast } from "sonner";

const formSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Product name is required!" })
      .max(100, { message: "Name must be less than 100 characters" }),
    description: z.string().optional(),
    price: z.number().min(0.01, { message: "Price must be greater than 0" }),
    category: z.string().optional(),
    subcategory: z.string().min(1, { message: "Subcategory is required" }),
    brand: z.string().optional(),
    unlimited: z.boolean().optional(),
    stock: z
      .number()
      .min(0, { message: "Stock cannot be negative" })
      .optional(),
    stockStatus: z
      .enum(["in-stock", "sur-commande", "out-of-stock"])
      .optional(),
    images: z.array(z.string()).optional(),
    specs: z.record(z.any()).optional(),
    reference: z
      .union([
        z.string().min(1, { message: "Reference cannot be empty" }),
        z.number().int().positive(),
      ])
      .optional(),
    hasDiscount: z.boolean().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    discountEndDate: z.date().nullable().optional(),
    discountedPrice: z.number().optional(),
    // Video URL for surveillance cameras
    videoUrl: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true; // Empty is valid since it's optional
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: "Please enter a valid URL" },
      ),
  })
  .refine(
    (data) => {
      if (data.hasDiscount) {
        return (
          data.discountPercentage !== undefined &&
          data.discountPercentage > 0 &&
          data.discountPercentage <= 100
        );
      }
      return true;
    },
    {
      message: "Discount percentage is required when discount is enabled",
      path: ["discountPercentage"],
    },
  );

type FormData = z.infer<typeof formSchema>;

interface EditProductProps {
  product: Product;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EditProduct = ({ product, onSuccess, onCancel }: EditProductProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(
    Array.isArray(product.images)
      ? product.images
      : Object.values(product.images || {}),
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [specs, setSpecs] = useState<Record<string, any>>(product.specs || {});
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rivalUrl, setRivalUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [formattedPrice, setFormattedPrice] = useState<string>("");
  const [hasDiscount, setHasDiscount] = useState(product.hasDiscount || false);
  const [discountPercentage, setDiscountPercentage] = useState<number>(
    product.discountPercentage || 0,
  );
  const [discountEndDate, setDiscountEndDate] = useState<Date | undefined>(
    product.discountEndDate ? new Date(product.discountEndDate) : undefined,
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category || "",
      subcategory: product.subcategory || "",
      brand: product.brand || "",
      unlimited: Boolean((product as any).unlimited),
      stock: (product as any).unlimited ? 0 : product.stock || 0,
      stockStatus: product.stockStatus || "in-stock",
      images: Array.isArray(product.images)
        ? product.images
        : Object.values(product.images || {}),
      specs: product.specs || {},
      reference: product.reference,
      hasDiscount: product.hasDiscount || false,
      discountPercentage: product.discountPercentage || 0,
      discountEndDate: product.discountEndDate
        ? new Date(product.discountEndDate)
        : undefined,
      discountedPrice: product.discountedPrice,
      videoUrl: product.videoUrl || "",
    },
  });

  // Initialize formatted price
  useEffect(() => {
    if (product.price > 0) {
      const formatted = new Intl.NumberFormat("ar-TN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(product.price / 1000);
      setFormattedPrice(formatted);
    }
  }, [product.price]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  const selectedCategory = form.watch("category");
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategory) {
        try {
          const category = categories.find(
            (cat) => cat.name === selectedCategory,
          );
          if (category) {
            const data = await getSubcategoriesByCategoryId(category.id!);
            setSubcategories(data);
          } else {
            setSubcategories([]);
          }
        } catch (error) {
          console.error("Error fetching subcategories:", error);
          setSubcategories([]);
        }
      } else {
        setSubcategories([]);
      }
    };
    fetchSubcategories();
  }, [selectedCategory, categories]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
      }

      const allImageUrls = [...imageUrls, ...uploadedUrls];

      const imagesObject = allImageUrls.reduce(
        (acc, url, index) => {
          acc[`image_${index}`] = url;
          return acc;
        },
        {} as Record<string, string>,
      );

      await updateProduct(product.id!, {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        price: data.price,
        category: data.category || "",
        subcategory: data.subcategory,
        brand: data.brand?.trim() || "",
        unlimited: Boolean(data.unlimited),
        stock: data.unlimited ? undefined : data.stock || 0,
        stockStatus: data.unlimited ? "in-stock" : data.stockStatus,
        images: imagesObject as any,
        specs: specs,
        reference: data.reference,
        hasDiscount: data.hasDiscount,
        discountPercentage: data.discountPercentage,
        discountEndDate: data.discountEndDate || null,
        discountedPrice: data.discountedPrice,
        videoUrl: data.videoUrl?.trim() || undefined,
      });

      toast.success("Product updated successfully!");
      setSubmitStatus("success");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSubmitStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update product. Please try again.");
      }
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubmitButtonContent = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating...
        </>
      );
    }

    if (submitStatus === "success") {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Updated Successfully!
        </>
      );
    }

    if (submitStatus === "error") {
      return (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Try Again
        </>
      );
    }

    return (
      <>
        <Save className="mr-2 h-4 w-4" />
        Update Product
      </>
    );
  };

  const getSubmitButtonVariant = () => {
    if (submitStatus === "success") return "default";
    if (submitStatus === "error") return "destructive";
    return "default";
  };

  const addImage = () => {
    if (newImageUrl.trim() && !imageUrls.includes(newImageUrl.trim())) {
      const updatedImages = [...imageUrls, newImageUrl.trim()];
      setImageUrls(updatedImages);
      form.setValue("images", updatedImages);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updatedImages);
    form.setValue("images", updatedImages);
  };

  const addSpec = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      const updatedSpecs = {
        ...specs,
        [newSpecKey.trim()]: newSpecValue.trim(),
      };
      setSpecs(updatedSpecs);
      form.setValue("specs", updatedSpecs);
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpec = (key: string) => {
    const updatedSpecs = { ...specs };
    delete updatedSpecs[key];
    setSpecs(updatedSpecs);
    form.setValue("specs", updatedSpecs);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "internship");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");

    return data.secure_url;
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsSubmitting(true);
      const uploadedUrl = await uploadImageToCloudinary(file);
      setImageUrls((prev) => {
        const updated = [...prev, uploadedUrl];
        form.setValue("images", updated);
        return updated;
      });
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!selectedFiles.includes(file)) {
      setSelectedFiles((prev) => [...prev, file]);
    }
  };

  const calculateDiscountedPrice = (
    originalPrice: number,
    percentage: number,
  ): number => {
    return Math.round(((originalPrice * (100 - percentage)) / 100) * 100) / 100;
  };

  useEffect(() => {
    const price = form.getValues("price");
    if (hasDiscount && price > 0 && discountPercentage > 0) {
      const discounted = calculateDiscountedPrice(price, discountPercentage);
      form.setValue("discountedPrice", discounted);
    }
  }, [hasDiscount, discountPercentage, form]);

  const scrapeProductInfo = async (url: string) => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      toast.error("Please enter a valid URL format");
      return;
    }

    setIsScraping(true);
    try {
      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Failed to scrape product information",
        );
      }

      const scrapedData = await response.json();

      if (!scrapedData.name && !scrapedData.description && !scrapedData.price) {
        toast.warning(
          "No product information found. The website might not be supported or the product page structure is different.",
        );
        return;
      }

      if (scrapedData.name) {
        form.setValue("name", scrapedData.name);
      }
      if (scrapedData.description) {
        form.setValue("description", scrapedData.description);
      }
      if (scrapedData.price) {
        form.setValue("price", scrapedData.price);

        if (scrapedData.formattedPrice) {
          setFormattedPrice(scrapedData.formattedPrice);
        } else if (scrapedData.originalPriceText) {
          setFormattedPrice(scrapedData.originalPriceText);
        } else {
          const formatted = new Intl.NumberFormat("ar-TN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(scrapedData.price / 1000);
          setFormattedPrice(formatted);
        }
      }
      if (scrapedData.brand) {
        form.setValue("brand", scrapedData.brand);
      }
      if (scrapedData.images && scrapedData.images.length > 0) {
        setImageUrls(scrapedData.images);
        form.setValue("images", scrapedData.images);
      }
      if (scrapedData.specs && Object.keys(scrapedData.specs).length > 0) {
        setSpecs(scrapedData.specs);
        form.setValue("specs", scrapedData.specs);
      }

      if (scrapedData.name || scrapedData.description) {
        const content =
          `${scrapedData.name || ""} ${scrapedData.description || ""}`.toLowerCase();

        if (
          content.includes("camera") ||
          content.includes("surveillance") ||
          content.includes("security")
        ) {
          const cameraCategory = categories.find(
            (cat) =>
              cat.name.toLowerCase().includes("camera") ||
              cat.name.toLowerCase().includes("surveillance") ||
              cat.name.toLowerCase().includes("security"),
          );
          if (cameraCategory) {
            form.setValue("category", cameraCategory.name);
            toast.info(`Suggested category: ${cameraCategory.name}`);
          }
        } else if (
          content.includes("phone") ||
          content.includes("mobile") ||
          content.includes("smartphone")
        ) {
          const phoneCategory = categories.find(
            (cat) =>
              cat.name.toLowerCase().includes("phone") ||
              cat.name.toLowerCase().includes("mobile"),
          );
          if (phoneCategory) {
            form.setValue("category", phoneCategory.name);
            toast.info(`Suggested category: ${phoneCategory.name}`);
          }
        }
      }

      const scrapedFields = [];
      if (scrapedData.name) scrapedFields.push("name");
      if (scrapedData.description) scrapedFields.push("description");
      if (scrapedData.price) scrapedFields.push("price");
      if (scrapedData.brand) scrapedFields.push("brand");
      if (scrapedData.images?.length > 0)
        scrapedFields.push(`${scrapedData.images.length} images`);
      if (Object.keys(scrapedData.specs || {}).length > 0)
        scrapedFields.push("specifications");

      toast.success(
        `Product information scraped successfully! Found: ${scrapedFields.join(", ")}`,
      );
      setRivalUrl("");
    } catch (error) {
      console.error("Error scraping product:", error);
      toast.error(
        "Failed to scrape product information. Please check the URL and try again.",
      );
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <SheetContent>
      <ScrollArea className="h-screen">
        <SheetHeader>
          <SheetTitle className="mb-4">Edit Product</SheetTitle>
          <SheetDescription asChild>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Rival Website Scraping */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Import from Rival Website
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter product URL from rival website (e.g., www.tunisianet.com.tn/...)"
                      value={rivalUrl}
                      onChange={(e) => setRivalUrl(e.target.value)}
                      disabled={isScraping}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          rivalUrl.trim() &&
                          !isScraping
                        ) {
                          scrapeProductInfo(rivalUrl);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => scrapeProductInfo(rivalUrl)}
                      disabled={isScraping || !rivalUrl.trim()}
                      size="sm"
                    >
                      {isScraping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Scrape
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Paste a product URL from a rival website to automatically
                    fill the form with product information.
                  </p>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter product name"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the name of the product (max 100 characters).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter product description"
                            rows={3}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of the product
                          (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Original Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              {...field}
                              value={formattedPrice || field.value || ""}
                              onChange={(e) => {
                                const cleanValue = e.target.value.replace(
                                  /[^\d.]/g,
                                  "",
                                );
                                const numericValue =
                                  parseFloat(cleanValue) || 0;
                                // Store price in millimes (multiply by 1000)
                                field.onChange(numericValue * 1000);
                                setFormattedPrice(cleanValue);
                              }}
                              onBlur={(e) => {
                                const numericValue =
                                  parseFloat(
                                    e.target.value.replace(/[^\d.]/g, ""),
                                  ) || 0;
                                if (numericValue > 0) {
                                  const formatted = new Intl.NumberFormat(
                                    "ar-TN",
                                    {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    },
                                  ).format(numericValue);
                                  setFormattedPrice(formatted);
                                  // Store price in millimes (multiply by 1000)
                                  field.onChange(numericValue * 1000);
                                }
                              }}
                              placeholder="0.00"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the original price in Tunisian Dinars (DT).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Final Price</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={
                            hasDiscount &&
                            discountPercentage > 0 &&
                            form.getValues("price") > 0
                              ? new Intl.NumberFormat("ar-TN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(
                                  calculateDiscountedPrice(
                                    form.getValues("price"),
                                    discountPercentage,
                                  ) / 1000,
                                )
                              : form.getValues("price") > 0
                                ? new Intl.NumberFormat("ar-TN", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(form.getValues("price") / 1000)
                                : "0"
                          }
                          readOnly
                          className="bg-gray-50 dark:bg-gray-800"
                        />
                      </FormControl>
                      <FormDescription>
                        Final price customers will pay (read-only).
                      </FormDescription>
                    </FormItem>
                  </div>

                  {/* Discount Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hasDiscount"
                        checked={hasDiscount}
                        onCheckedChange={(checked) => {
                          const isChecked = Boolean(checked);
                          setHasDiscount(isChecked);
                          form.setValue("hasDiscount", isChecked);

                          if (!isChecked) {
                            setDiscountPercentage(0);
                            setDiscountEndDate(undefined);
                            form.setValue("discountPercentage", 0);
                            form.setValue("discountEndDate", undefined);
                            form.setValue("discountedPrice", undefined);
                          }
                        }}
                      />
                      <label
                        htmlFor="hasDiscount"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable Discount
                      </label>
                    </div>

                    {hasDiscount && (
                      <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200">
                        <FormField
                          control={form.control}
                          name="discountPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount Percentage (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  {...field}
                                  value={discountPercentage || ""}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    setDiscountPercentage(value);
                                    field.onChange(value);
                                  }}
                                  placeholder="0"
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormDescription>
                                Enter discount percentage (0-100%).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="discountEndDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Discount End Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={
                                    discountEndDate
                                      ? discountEndDate
                                          .toISOString()
                                          .split("T")[0]
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const date = e.target.value
                                      ? new Date(e.target.value)
                                      : undefined;
                                    setDiscountEndDate(date);
                                    field.onChange(date);
                                  }}
                                  min={new Date().toISOString().split("T")[0]}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormDescription>
                                When the discount expires (optional).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Reference */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reference</h3>
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              const value = e.target.value.trim();
                              if (value === "") {
                                field.onChange(undefined);
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
                            placeholder="Auto-assigned if left empty (e.g., F552-5MP, 12345)"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a custom reference (e.g., F552-5MP) or leave
                          empty to auto-assign the next numeric reference.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category and Brand */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Category & Brand</h3>

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("subcategory", "");
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the category this product belongs to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subcategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategory *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={
                            !selectedCategory || subcategories.length === 0
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  !selectedCategory
                                    ? "Select a category first"
                                    : subcategories.length === 0
                                      ? "No subcategories available"
                                      : "Select a subcategory"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem
                                key={subcategory.id}
                                value={subcategory.name}
                              >
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the subcategory this product belongs to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter brand name"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the brand of the product (optional).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Video URL for surveillance cameras */}
                  {form.watch("category") === "VidéoSurveillance" &&
                    form.watch("subcategory") === "Caméra de Surveillance" && (
                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://example.com/video.mp4"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                            <FormDescription>
                              Provide a video URL to demonstrate the camera's
                              quality and features.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                </div>

                {/* Stock Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Stock Management</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Unlimited Checkbox */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="unlimited"
                          checked={form.watch("unlimited")}
                          onCheckedChange={(checked) => {
                            const isChecked = Boolean(checked);
                            form.setValue("unlimited", isChecked);
                            if (isChecked) {
                              form.setValue("stock", 0);
                              form.setValue("stockStatus", "in-stock");
                            }
                          }}
                        />
                        <label
                          htmlFor="unlimited"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Unlimited stock (ignore stock tracking)
                        </label>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="stock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              placeholder="0"
                              disabled={isSubmitting || form.watch("unlimited")}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter the current stock quantity.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stockStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select stock status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in-stock">In Stock</SelectItem>
                              <SelectItem value="sur-commande">
                                Sur Commande
                              </SelectItem>
                              <SelectItem value="out-of-stock">
                                Out of Stock
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the current stock status of the product.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Images</h3>

                  {/* Upload Zone */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) await handleImageUpload(file);
                    }}
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition"
                  >
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="fileUpload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition"
                    >
                      <label
                        htmlFor="fileUpload"
                        className="cursor-pointer text-muted-foreground"
                      >
                        Drag & drop or{" "}
                        <span className="text-primary underline">
                          click to select
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Add by URL */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter image URL"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={addImage}
                      disabled={isSubmitting || !newImageUrl.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Preview Grid */}
                  {(imageUrls.length > 0 || selectedFiles.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {[
                        ...imageUrls,
                        ...selectedFiles.map((f) => URL.createObjectURL(f)),
                      ].map((src, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={src}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg shadow-md group-hover:opacity-90 transition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (index < imageUrls.length) {
                                removeImage(index);
                              } else {
                                setSelectedFiles((prev) =>
                                  prev.filter(
                                    (_, i) => i !== index - imageUrls.length,
                                  ),
                                );
                              }
                            }}
                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Specifications</h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Specification name"
                        value={newSpecKey}
                        onChange={(e) => setNewSpecKey(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="Specification value"
                        value={newSpecValue}
                        onChange={(e) => setNewSpecValue(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addSpec}
                      disabled={
                        isSubmitting ||
                        !newSpecKey.trim() ||
                        !newSpecValue.trim()
                      }
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Spec
                    </Button>

                    {Object.keys(specs).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          Added Specifications:
                        </p>
                        {Object.entries(specs).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                          >
                            <span className="text-sm font-medium text-foreground">
                              {key}:
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {value}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpec(key)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant={getSubmitButtonVariant()}
                    className="flex-1"
                  >
                    {getSubmitButtonContent()}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={onCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </SheetDescription>
        </SheetHeader>
      </ScrollArea>
    </SheetContent>
  );
};

export default EditProduct;
