import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export type Category = {
  id: string;
  name: string;
  slug: string;
  position?: number;
};

export type Subcategory = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  position?: number;
};

export type CategoryWithSubcategories = Category & {
  subcategories: Subcategory[];
};

const CATEGORIES_COLLECTION = "categories";
const SUBCOLLECTION_NAME = "subcategories";

export const fetchCategories = async (): Promise<Category[]> => {
  const colRef = collection(db, CATEGORIES_COLLECTION);
  const q = query(colRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      position: typeof data.position === "number" ? data.position : undefined,
    };
  });
};

export const fetchSubcategories = async (): Promise<Subcategory[]> => {
  const colRef = collection(db, SUBCOLLECTION_NAME);
  const q = query(colRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      categoryId: data.categoryId ?? "",
      categorySlug: data.categorySlug ?? "",
      position: typeof data.position === "number" ? data.position : undefined,
    };
  });
};

export const fetchSubcategoriesByCategoryId = async (categoryId: string): Promise<Subcategory[]> => {
  const colRef = collection(db, SUBCOLLECTION_NAME);
  const q = query(colRef, where("categoryId", "==", categoryId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      name: data.name ?? "",
      slug: data.slug ?? "",
      categoryId: data.categoryId ?? "",
      categorySlug: data.categorySlug ?? "",
      position: typeof data.position === "number" ? data.position : undefined,
    };
  });
};

export const fetchCategoriesWithSubcategories = async (): Promise<CategoryWithSubcategories[]> => {
  try {
    const categories = await fetchCategories();
    const subcategories = await fetchSubcategories();
    
    return categories.map(category => ({
      ...category,
      subcategories: subcategories.filter(sub => sub.categoryId === category.id)
    }));
  } catch (error) {
    console.error("Error fetching categories with subcategories:", error);
    throw new Error("Failed to get categories with subcategories");
  }
};


