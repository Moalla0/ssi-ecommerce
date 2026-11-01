"use client";

import { useState } from "react";
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
import { addCategory, generateSlug, isSlugUnique } from "@/lib/categories";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required!" }).max(50, { message: "Name must be less than 50 characters" }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddCategoryProps {
  onSuccess?: () => void;
}

const AddCategory = ({ onSuccess }: AddCategoryProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Generate slug from name
      const slug = generateSlug(data.name);
      
      // Check if slug is unique
      const isUnique = await isSlugUnique(slug);
      if (!isUnique) {
        toast.error("A category with this name already exists!");
        setSubmitStatus('error');
        return;
      }

      // Add category to Firebase
      await addCategory({
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || "",
      });

      toast.success("Category added successfully!");
      setSubmitStatus('success');
      form.reset();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset status after a delay
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error adding category:', error);
      toast.error("Failed to add category. Please try again.");
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
          Adding...
        </>
      );
    }

    if (submitStatus === 'success') {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          Added Successfully!
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

    return "Add Category";
  };

  const getSubmitButtonVariant = () => {
    if (submitStatus === 'success') return 'default';
    if (submitStatus === 'error') return 'destructive';
    return 'default';
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Category</SheetTitle>
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
                      Enter a unique name for the category. A URL-friendly slug will be generated automatically.
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
                  onClick={() => {
                    form.reset();
                    setSubmitStatus('idle');
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

export default AddCategory;
