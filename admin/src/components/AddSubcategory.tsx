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
import {
  addSubcategory,
  generateSlug,
  isSubcategorySlugUnique,
  getCategories,
  Category,
} from "@/lib/categories";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  categoryId: z.string().min(1, { message: "Please select a category!" }),
  name: z
    .string()
    .min(1, { message: "Name is required!" })
    .max(50, { message: "Name must be less than 50 characters" }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddSubcategoryProps {
  onSuccess?: () => void;
}

const AddSubcategory = ({ onSuccess }: AddSubcategoryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: "",
      name: "",
      description: "",
    },
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Get the selected category
      const selectedCategory = categories.find(
        (cat) => cat.id === data.categoryId
      );
      if (!selectedCategory) {
        toast.error("Selected category not found!");
        setSubmitStatus("error");
        return;
      }

      // Generate slug from name
      const slug = generateSlug(data.name);

      // Check if slug is unique within the category
      const isUnique = await isSubcategorySlugUnique(slug, data.categoryId);
      if (!isUnique) {
        toast.error(
          "A subcategory with this name already exists in this category!"
        );
        setSubmitStatus("error");
        return;
      }

      // Add subcategory to Firebase
      await addSubcategory({
        name: data.name.trim(),
        slug,
        categoryId: data.categoryId,
        categorySlug: selectedCategory.slug,
        description: data.description?.trim() || "",
      });

      toast.success("Subcategory added successfully!");
      setSubmitStatus("success");
      form.reset({
        categoryId: form.getValues("categoryId"), // keep selected parent category
        name: "",
        description: "",
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after a delay
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Error adding subcategory:", error);
      toast.error("Failed to add subcategory. Please try again.");
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
          Adding...
        </>
      );
    }

    if (submitStatus === "success") {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Added Successfully!
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

    return "Add Subcategory";
  };

  const getSubmitButtonVariant = () => {
    if (submitStatus === "success") return "default";
    if (submitStatus === "error") return "destructive";
    return "default";
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Subcategory</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id!}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the parent category for this subcategory.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter subcategory name"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a unique name for the subcategory. A URL-friendly
                      slug will be generated automatically.
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter subcategory description"
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief description of what this subcategory
                      contains.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  onClick={() => {
                    form.reset();
                    setSubmitStatus("idle");
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddSubcategory;
