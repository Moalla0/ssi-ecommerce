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
import { updateCategory, generateSlug, isSlugUnique, Category } from "@/lib/categories";
import { Loader2, CheckCircle, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }).max(50, { message: "Name must be less than 50 characters" }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditCategoryProps {
  category: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EditCategory = ({ category, onSuccess, onCancel }: EditCategoryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category.name,
      description: category.description || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Generate new slug from name
      const newSlug = generateSlug(data.name);
      
      // Check if new slug is unique (excluding current category)
      if (newSlug !== category.slug) {
        const isUnique = await isSlugUnique(newSlug, category.id);
        if (!isUnique) {
          toast.error("A category with this name already exists!");
          setSubmitStatus('error');
          return;
        }
      }

      // Update category in Firebase
      await updateCategory(category.id!, {
        name: data.name.trim(),
        slug: newSlug,
        description: data.description?.trim() || "",
      });

      toast.success("Category updated successfully!");
      setSubmitStatus('success');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after a delay
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error updating category:', error);
      toast.error("Failed to update category. Please try again.");
      setSubmitStatus('error');
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

    if (submitStatus === 'success') {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Updated Successfully!
        </>
      );
    }

    if (submitStatus === 'error') {
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
        Update Category
      </>
    );
  };

  const getSubmitButtonVariant = () => {
    if (submitStatus === 'success') return 'default';
    if (submitStatus === 'error') return 'destructive';
    return 'default';
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Edit Category</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter category name"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a unique name for the category. A new URL-friendly slug will be generated automatically.
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
                        placeholder="Enter category description"
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a brief description of what this category contains.
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
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default EditCategory;
