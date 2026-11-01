import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Subcategory {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}

const COLLECTION_NAME = "categories";
const SUBCOLLECTION_NAME = "subcategories";

// Add a new category
export const addCategory = async (
  categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
) => {
  try {
    // Validate input
    if (!categoryData.name || !categoryData.slug) {
      throw new Error("Name and slug are required");
    }

    if (categoryData.name.length > 50) {
      throw new Error("Category name must be less than 50 characters");
    }

    if (categoryData.slug.length > 50) {
      throw new Error("Category slug must be less than 50 characters");
    }

    // Check if slug already exists
    const isUnique = await isSlugUnique(categoryData.slug);
    if (!isUnique) {
      throw new Error("A category with this slug already exists");
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...categoryData,
    };
  } catch (error) {
    console.error("Error adding category:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add category");
  }
};

// Add a new subcategory
export const addSubcategory = async (
  subcategoryData: Omit<Subcategory, "id" | "createdAt" | "updatedAt">
) => {
  try {
    // Validate input
    if (!subcategoryData.name || !subcategoryData.slug || !subcategoryData.categoryId) {
      throw new Error("Name, slug, and category ID are required");
    }

    if (subcategoryData.name.length > 50) {
      throw new Error("Subcategory name must be less than 50 characters");
    }

    if (subcategoryData.slug.length > 50) {
      throw new Error("Subcategory slug must be less than 50 characters");
    }

    // Check if slug already exists within the same category
    const isUnique = await isSubcategorySlugUnique(subcategoryData.slug, subcategoryData.categoryId);
    if (!isUnique) {
      throw new Error("A subcategory with this slug already exists in this category");
    }

    const docRef = await addDoc(collection(db, SUBCOLLECTION_NAME), {
      ...subcategoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...subcategoryData,
    };
  } catch (error) {
    console.error("Error adding subcategory:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add subcategory");
  }
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    console.error("Error getting categories:", error);
    throw new Error("Failed to get categories");
  }
};

// Get all subcategories
export const getSubcategories = async (): Promise<Subcategory[]> => {
  try {
    const q = query(collection(db, SUBCOLLECTION_NAME));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subcategory[];
  } catch (error) {
    console.error("Error getting subcategories:", error);
    throw new Error("Failed to get subcategories");
  }
};

// Get subcategories by category ID
export const getSubcategoriesByCategoryId = async (categoryId: string): Promise<Subcategory[]> => {
  try {
    const q = query(
      collection(db, SUBCOLLECTION_NAME),
      where("categoryId", "==", categoryId)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Subcategory[];
  } catch (error) {
    console.error("Error getting subcategories by category ID:", error);
    throw new Error("Failed to get subcategories");
  }
};

// Get categories with their subcategories
export const getCategoriesWithSubcategories = async (): Promise<(Category & { subcategories: Subcategory[] })[]> => {
  try {
    const categories = await getCategories();
    const subcategories = await getSubcategories();
    
    return categories.map(category => ({
      ...category,
      subcategories: subcategories.filter(sub => sub.categoryId === category.id)
    }));
  } catch (error) {
    console.error("Error getting categories with subcategories:", error);
    throw new Error("Failed to get categories with subcategories");
  }
};

// Update a category
export const updateCategory = async (
  id: string,
  updates: Partial<Category>
) => {
  try {
    if (!id) {
      throw new Error("Category ID is required");
    }

    const categoryRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(categoryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return { id, ...updates };
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
};

// Update a subcategory
export const updateSubcategory = async (
  id: string,
  updates: Partial<Subcategory>
) => {
  try {
    if (!id) {
      throw new Error("Subcategory ID is required");
    }

    const subcategoryRef = doc(db, SUBCOLLECTION_NAME, id);
    await updateDoc(subcategoryRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return { id, ...updates };
  } catch (error) {
    console.error("Error updating subcategory:", error);
    throw new Error("Failed to update subcategory");
  }
};

// Delete a category
export const deleteCategory = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Category ID is required");
    }

    // First, delete all subcategories in this category
    const subcategories = await getSubcategoriesByCategoryId(id);
    for (const subcategory of subcategories) {
      await deleteSubcategory(subcategory.id!);
    }

    const categoryRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(categoryRef);
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
};

// Delete a subcategory
export const deleteSubcategory = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Subcategory ID is required");
    }

    const subcategoryRef = doc(db, SUBCOLLECTION_NAME, id);
    await deleteDoc(subcategoryRef);
    return true;
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    throw new Error("Failed to delete subcategory");
  }
};

// Generate slug from name
export const generateSlug = (name: string): string => {
  if (!name) return "";

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
};

// Check if slug already exists
export const isSlugUnique = async (
  slug: string,
  excludeId?: string
): Promise<boolean> => {
  const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug));
  const snapshot = await getDocs(q);
  if (excludeId) {
    return !snapshot.docs.some((doc) => doc.id !== excludeId);
  }
  return snapshot.empty;
};

// Check if subcategory slug already exists within a category
export const isSubcategorySlugUnique = async (
  slug: string,
  categoryId: string,
  excludeId?: string
): Promise<boolean> => {
  const q = query(
    collection(db, SUBCOLLECTION_NAME), 
    where("slug", "==", slug),
    where("categoryId", "==", categoryId)
  );
  const snapshot = await getDocs(q);
  if (excludeId) {
    return !snapshot.docs.some((doc) => doc.id !== excludeId);
  }
  return snapshot.empty;
};

// Get category by slug
export const getCategoryBySlug = async (
  slug: string
): Promise<Category | null> => {
  try {
    if (!slug) return null;

    const categories = await getCategories();
    return categories.find((cat) => cat.slug === slug) || null;
  } catch (error) {
    console.error("Error getting category by slug:", error);
    return null;
  }
};

// Get subcategory by slug
export const getSubcategoryBySlug = async (
  slug: string
): Promise<Subcategory | null> => {
  try {
    if (!slug) return null;

    const subcategories = await getSubcategories();
    return subcategories.find((sub) => sub.slug === slug) || null;
  } catch (error) {
    console.error("Error getting subcategory by slug:", error);
    return null;
  }
};

// Get category by ID
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    if (!id) return null;

    const categories = await getCategories();
    return categories.find((cat) => cat.id === id) || null;
  } catch (error) {
    console.error("Error getting category by ID:", error);
    return null;
  }
};

// Get subcategory by ID
export const getSubcategoryById = async (id: string): Promise<Subcategory | null> => {
  try {
    if (!id) return null;

    const subcategories = await getSubcategories();
    return subcategories.find((sub) => sub.id === id) || null;
  } catch (error) {
    console.error("Error getting subcategory by ID:", error);
    return null;
  }
};
