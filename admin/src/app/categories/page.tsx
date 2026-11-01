"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Hash, Folder } from "lucide-react";
import { getCategoriesWithSubcategories, deleteCategory, deleteSubcategory, Category, Subcategory } from "@/lib/categories";
import { toast } from "sonner";
import AddCategory from "@/components/AddCategory";
import EditCategory from "@/components/EditCategory";
import AddSubcategory from "@/components/AddSubcategory";
import EditSubcategory from "@/components/EditSubcategory";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type CategoryWithSubcategories = Category & { subcategories: Subcategory[] };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isAddSubcategorySheetOpen, setIsAddSubcategorySheetOpen] = useState(false);
  const [isEditSubcategorySheetOpen, setIsEditSubcategorySheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategoriesWithSubcategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This will also delete all its subcategories.`)) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success(`Category "${name}" deleted successfully`);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Failed to delete category");
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the subcategory "${name}"?`)) {
      return;
    }

    try {
      await deleteSubcategory(id);
      toast.success(`Subcategory "${name}" deleted successfully`);
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast.error("Failed to delete subcategory");
    }
  };

  const handleAddSuccess = () => {
    setIsAddSheetOpen(false);
    fetchCategories(); // Refresh the list
  };

  const handleEditSuccess = () => {
    setIsEditSheetOpen(false);
    setSelectedCategory(null);
    fetchCategories(); // Refresh the list
  };

  const handleAddSubcategorySuccess = () => {
    setIsAddSubcategorySheetOpen(false);
    fetchCategories(); // Refresh the list
  };

  const handleEditSubcategorySuccess = () => {
    setIsEditSubcategorySheetOpen(false);
    setSelectedSubcategory(null);
    fetchCategories(); // Refresh the list
  };

  const handleEditCancel = () => {
    setIsEditSheetOpen(false);
    setSelectedCategory(null);
  };

  const handleEditSubcategoryCancel = () => {
    setIsEditSubcategorySheetOpen(false);
    setSelectedSubcategory(null);
  };

  const openEditSheet = (category: Category) => {
    setSelectedCategory(category);
    setIsEditSheetOpen(true);
  };

  const openEditSubcategorySheet = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setIsEditSubcategorySheetOpen(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading categories...</p>
        </div>
      </div>
    );
  }

  const totalSubcategories = categories.reduce((sum, cat) => sum + cat.subcategories.length, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories & Subcategories</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage product categories and subcategories for your store
          </p>
        </div>
        
                 <div className="flex gap-2">
           <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
             <SheetTrigger asChild>
               <Button>
                 <Plus className="mr-2 h-4 w-4" />
                 Add Category
               </Button>
             </SheetTrigger>
             <SheetContent>
               <AddCategory onSuccess={handleAddSuccess} />
             </SheetContent>
           </Sheet>

           <Sheet open={isAddSubcategorySheetOpen} onOpenChange={setIsAddSubcategorySheetOpen}>
             <SheetTrigger asChild>
               <Button variant="outline">
                 <Plus className="mr-2 h-4 w-4" />
                 Add Subcategory
               </Button>
             </SheetTrigger>
             <SheetContent>
               <AddSubcategory onSuccess={handleAddSubcategorySuccess} />
             </SheetContent>
           </Sheet>
         </div>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Hash className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first category to organize your products.
            </p>
            <Button onClick={() => setIsAddSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2">{category.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {category.description || "No description provided"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                                 <div className="flex items-center gap-2">
                   <Badge variant="secondary" className="text-xs">
                     {category.slug}
                   </Badge>
                   {category.subcategories.length > 0 && (
                     <Badge variant="outline" className="text-xs">
                       {category.subcategories.length} subcategories
                     </Badge>
                   )}
                 </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Created: {formatDate(category.createdAt)}
                </div>
                
                                 <div className="flex gap-2 pt-2">
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="flex-1"
                     onClick={() => openEditSheet(category)}
                   >
                     <Edit className="mr-2 h-3 w-3" />
                     Edit
                   </Button>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="flex-1 text-destructive hover:text-destructive"
                     onClick={() => handleDeleteCategory(category.id!, category.name)}
                   >
                     <Trash2 className="mr-2 h-3 w-3" />
                     Delete
                   </Button>
                 </div>

                 {/* Subcategories List */}
                 {category.subcategories.length > 0 && (
                   <div className="mt-4 pt-3 border-t border-border">
                     <h4 className="text-sm font-medium text-foreground mb-2">Subcategories:</h4>
                     <div className="space-y-2">
                       {category.subcategories.map((subcategory) => (
                         <div key={subcategory.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                           <div className="flex items-center gap-2">
                             <Folder className="h-3 w-3 text-green-500" />
                             <div>
                               <div className="text-sm font-medium text-foreground">{subcategory.name}</div>
                               <div className="text-xs text-muted-foreground">{subcategory.slug}</div>
                             </div>
                           </div>
                           <div className="flex gap-1">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-6 w-6 p-0"
                               onClick={() => openEditSubcategorySheet(subcategory)}
                             >
                               <Edit className="h-3 w-3" />
                             </Button>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                               onClick={() => handleDeleteSubcategory(subcategory.id!, subcategory.name)}
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Category Sheet */}
      {selectedCategory && (
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent>
            <EditCategory 
              category={selectedCategory}
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Edit Subcategory Sheet */}
      {selectedSubcategory && (
        <Sheet open={isEditSubcategorySheetOpen} onOpenChange={setIsEditSubcategorySheetOpen}>
          <SheetContent>
            <EditSubcategory 
              subcategory={selectedSubcategory}
              onSuccess={handleEditSubcategorySuccess}
              onCancel={handleEditSubcategoryCancel}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Category Statistics</CardTitle>
          <CardDescription>Overview of your category management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Total Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalSubcategories}</div>
              <div className="text-sm text-muted-foreground">Total Subcategories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {categories.filter(cat => cat.description).length}
              </div>
              <div className="text-sm text-muted-foreground">Categories with Description</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {categories.length > 0 ? formatDate(categories[0].createdAt) : "N/A"}
              </div>
              <div className="text-sm text-muted-foreground">Latest Added</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
