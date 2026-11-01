import { db } from "@shared/firebase";
import {
  Product as ProductType,
  Products as ProductsType,
} from "@shared/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  limit as fsLimit,
  updateDoc,
  increment,
  getCountFromServer,
  startAfter,
} from "firebase/firestore";
import { fetchCategoriesWithSubcategories } from "./categories";

const PRODUCTS_COLLECTION = "products";

// Helper function to check if discount is still valid (not expired)
export const isDiscountValid = (product: ProductType): boolean => {
  console.log("Checking discount validity for:", product.name, {
    hasDiscount: product.hasDiscount,
    discountPercentage: product.discountPercentage,
    discountEndDate: product.discountEndDate,
  });

  // Basic validation: must have discount enabled and percentage > 0
  if (
    !product.hasDiscount ||
    !product.discountPercentage ||
    product.discountPercentage <= 0
  ) {
    console.log("Discount invalid: missing required fields");
    return false;
  }

  // If no end date, discount is always valid
  if (!product.discountEndDate) {
    console.log("Discount valid: no end date (permanent discount)");
    return true;
  }

  // Check if discount has expired
  try {
    const now = new Date();
    const endDate = product.discountEndDate.toDate
      ? product.discountEndDate.toDate()
      : new Date(product.discountEndDate);
    const isValid = now < endDate;

    console.log("Discount end date check:", { now, endDate, isValid });
    return isValid;
  } catch (error) {
    console.error("Error checking discount end date:", error);
    // If there's an error parsing the date, assume discount is valid
    return true;
  }
};

// Helper function to get current price (discounted if valid, original if not)
export const getCurrentPrice = (product: ProductType): number => {
  const isValid = isDiscountValid(product);
  const currentPrice =
    isValid && product.discountedPrice
      ? product.discountedPrice
      : product.price;

  console.log("Getting current price for:", product.name, {
    originalPrice: product.price,
    discountedPrice: product.discountedPrice,
    isValid,
    currentPrice,
  });

  return currentPrice;
};

// Helper function to format price in Tunisian format (no decimals, comma separator)
export const formatPrice = (price: number): string => {
  // Convert price from millimes to dinars (divide by 1000)
  const priceInDinars = price / 1000;
  return new Intl.NumberFormat("ar-TN", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInDinars);
};

export type FetchProductsOptions = {
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  sort?: "newest" | "oldest" | "asc" | "desc";
  limitCount?: number;
  page?: number;
  productsPerPage?: number;
  searchTerm?: string;
};

const mapDocToProduct = (snap: any): ProductType => {
  const data = snap.data();

  // Debug discount data mapping
  console.log("Mapping product:", data.name, "Raw Firestore data:", data);
  console.log("Discount fields found:", {
    hasDiscount: data.hasDiscount,
    discountPercentage: data.discountPercentage,
    originalPrice: data.originalPrice,
    discountedPrice: data.discountedPrice,
    discountEndDate: data.discountEndDate,
    // Check for alternative field names
    discount: data.discount,
    discount_price: data.discount_price,
    discount_percentage: data.discount_percentage,
  });
  console.log("Video URL found:", data.videoUrl);

  const mappedProduct = {
    id: snap.id,
    name: data.name ?? "",
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",
    price:
      typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    images: Array.isArray(data.images)
      ? data.images.reduce(
          (acc: Record<string, string>, url: string, index: number) => {
            acc[`image_${index}`] = url;
            return acc;
          },
          {} as Record<string, string>,
        )
      : (data.images ?? {}),
    salesCount: typeof data.salesCount === "number" ? data.salesCount : 0,
    unlimited: Boolean(data.unlimited),
    stock: typeof data.stock === "number" ? data.stock : undefined,
    // Map additional fields
    reference: data.reference,
    category: data.category,
    subcategory: data.subcategory,
    brand: data.brand,
    specs: data.specs,
    stockStatus: data.stockStatus,
    // Map discount fields
    hasDiscount: data.hasDiscount ?? false,
    discountPercentage:
      typeof data.discountPercentage === "number"
        ? data.discountPercentage
        : undefined,
    originalPrice:
      typeof data.originalPrice === "number" ? data.originalPrice : undefined,
    discountedPrice:
      typeof data.discountedPrice === "number"
        ? data.discountedPrice
        : undefined,
    discountEndDate: data.discountEndDate || undefined,
    // Map video URL
    videoUrl: data.videoUrl || undefined,
  };

  console.log("Mapped product:", mappedProduct);
  console.log("Video URL in mapped product:", mappedProduct.videoUrl);
  return mappedProduct;
};

// Convert slug to actual category name
const getCategoryNameFromSlug = async (
  categorySlug: string,
): Promise<string | null> => {
  try {
    const categories = await fetchCategoriesWithSubcategories();
    const category = categories.find((cat) => cat.slug === categorySlug);
    return category ? category.name : null;
  } catch (error) {
    console.error("Error fetching categories for slug conversion:", error);
    return null;
  }
};

// Convert slug to actual subcategory name
const getSubcategoryNameFromSlug = async (
  subcategorySlug: string,
  categorySlug: string,
): Promise<string | null> => {
  try {
    const categories = await fetchCategoriesWithSubcategories();
    const category = categories.find((cat) => cat.slug === categorySlug);
    if (!category) return null;

    const subcategory = category.subcategories.find(
      (sub) => sub.slug === subcategorySlug,
    );
    return subcategory ? subcategory.name : null;
  } catch (error) {
    console.error("Error fetching subcategories for slug conversion:", error);
    return null;
  }
};

export const fetchProducts = async (
  options: FetchProductsOptions = {},
): Promise<ProductsType> => {
  const {
    categorySlug,
    subcategorySlug,
    sort,
    page = 1,
    productsPerPage = 12,
    searchTerm,
  } = options;

  const colRef = collection(db, PRODUCTS_COLLECTION);
  const constraints: any[] = [];

  // Convert category slug to actual category name
  if (categorySlug && categorySlug !== "all") {
    const categoryName = await getCategoryNameFromSlug(categorySlug);
    if (categoryName) {
      constraints.push(where("category", "==", categoryName));
    }
  }

  // Convert subcategory slug to actual subcategory name
  if (subcategorySlug && categorySlug) {
    const subcategoryName = await getSubcategoryNameFromSlug(
      subcategorySlug,
      categorySlug,
    );
    if (subcategoryName) {
      constraints.push(where("subcategory", "==", subcategoryName));
    }
  }

  // Handle sorting
  if (sort === "newest") constraints.push(orderBy("createdAt", "desc"));
  else if (sort === "oldest") constraints.push(orderBy("createdAt", "asc"));
  else if (sort === "asc") constraints.push(orderBy("price", "asc"));
  else if (sort === "desc") constraints.push(orderBy("price", "desc"));
  else constraints.push(orderBy("createdAt", "desc")); // Default sort

  // If there's a search term, we unfortunately have to fetch more docs and filter in memory
  // because Firestore doesn't support full-text search.
  // We'll limit to a reasonable "search pool" to avoid fetching the entire DB.
  if (searchTerm && searchTerm.trim()) {
    const q = query(colRef, ...constraints, fsLimit(1000));
    const snapshot = await getDocs(q);
    let allProducts = snapshot.docs.map(mapDocToProduct);

    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    allProducts = allProducts.filter((product) => {
      const searchableFields = [
        product.name,
        product.description,
        product.brand,
        product.category,
        product.subcategory,
      ]
        .filter((field): field is string => typeof field === "string")
        .map((field) => field.toLowerCase());

      return searchableFields.some((field) =>
        field.includes(normalizedSearchTerm),
      );
    });

    const startIndex = (page - 1) * productsPerPage;
    return allProducts.slice(startIndex, startIndex + productsPerPage);
  }

  // Native Pagination (Skip-to-page approximation using limit)
  // For deep pagination, cursors are required, but for page numbers we fetch (page * size)
  const q = query(colRef, ...constraints, fsLimit(page * productsPerPage));
  const snapshot = await getDocs(q);

  const allDocs = snapshot.docs;
  const startIndex = (page - 1) * productsPerPage;
  const pageDocs = allDocs.slice(startIndex);

  return pageDocs.map(mapDocToProduct);
};

export const fetchProductById = async (
  id: string,
): Promise<ProductType | null> => {
  const ref = doc(db, PRODUCTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return mapDocToProduct(snap);
};

export const fetchDistinctProductCategories = async (
  max: number = 200,
): Promise<string[]> => {
  // Note: Firestore has no DISTINCT, so we fetch up to `max` docs and derive categories client-side.
  const colRef = collection(db, PRODUCTS_COLLECTION);
  const q = query(colRef, fsLimit(max));
  const snapshot = await getDocs(q);
  const set = new Set<string>();
  snapshot.forEach((d) => {
    const cat = (d.data() as any)?.category;
    if (typeof cat === "string" && cat.trim().length > 0) set.add(cat);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

// Update product stock and sales count after order
export const updateProductAfterOrder = async (
  productId: string,
  quantity: number,
) => {
  try {
    console.log(`Updating product ${productId} with quantity ${quantity}`);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);

    // Get current product data to check if stock exists
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const productData = productSnap.data();
    console.log(`Current product data:`, {
      name: productData.name,
      currentStock: productData.stock,
      currentSalesCount: productData.salesCount,
    });

    const updates: any = {
      salesCount: increment(quantity), // Always increment sales count
      updatedAt: new Date(),
    };

    // Only update stock if NOT unlimited and stock exists as a number
    if (!productData.unlimited && typeof productData.stock === "number") {
      const newStock = productData.stock - quantity;
      if (newStock < 0) {
        throw new Error(
          `Insufficient stock for product ${productData.name}. Available: ${productData.stock}, Requested: ${quantity}`,
        );
      }
      updates.stock = newStock;
      console.log(`Stock updated: ${productData.stock} → ${newStock}`);
    } else {
      console.log(
        `Unlimited or no stock field for product ${productData.name}, skipping stock update`,
      );
    }

    console.log(
      `Sales count updated: ${productData.salesCount || 0} → ${(productData.salesCount || 0) + quantity}`,
    );

    await updateDoc(productRef, updates);
    console.log(`Product ${productId} updated successfully`);
    return true;
  } catch (error) {
    console.error(`Error updating product ${productId} after order:`, error);
    throw error;
  }
};

// Batch update multiple products after order
export const updateProductsAfterOrder = async (
  cartItems: Array<{ id: string; quantity: number }>,
) => {
  try {
    console.log(
      `Starting batch update for ${cartItems.length} products:`,
      cartItems,
    );

    const updatePromises = cartItems.map((item) =>
      updateProductAfterOrder(item.id, item.quantity),
    );

    await Promise.all(updatePromises);
    console.log(`All ${cartItems.length} products updated successfully`);
    return true;
  } catch (error) {
    console.error("Error updating products after order:", error);
    throw error;
  }
};

// Check if product has sufficient stock
export const checkProductStock = async (
  productId: string,
  requestedQuantity: number,
): Promise<{
  hasStock: boolean;
  availableStock?: number;
  error?: string;
}> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return { hasStock: false, error: "Product not found" };
    }

    const productData = productSnap.data();

    // If unlimited or no stock field, assume unlimited stock
    if (productData.unlimited || productData.stock === undefined) {
      return { hasStock: true };
    }

    // Check if requested quantity is available
    if (productData.stock >= requestedQuantity) {
      return { hasStock: true, availableStock: productData.stock };
    } else {
      return {
        hasStock: false,
        availableStock: productData.stock,
        error: `Insufficient stock. Available: ${productData.stock}, Requested: ${requestedQuantity}`,
      };
    }
  } catch (error) {
    console.error(`Error checking stock for product ${productId}:`, error);
    return { hasStock: false, error: "Error checking stock availability" };
  }
};

// Get total count of products for pagination using aggregation query
export const getProductsCount = async (
  options: Omit<FetchProductsOptions, "page" | "productsPerPage"> = {},
): Promise<number> => {
  const { categorySlug, subcategorySlug } = options;

  const colRef = collection(db, PRODUCTS_COLLECTION);
  const constraints: any[] = [];

  // Convert category slug to actual category name
  if (categorySlug && categorySlug !== "all") {
    const categoryName = await getCategoryNameFromSlug(categorySlug);
    if (categoryName) {
      constraints.push(where("category", "==", categoryName));
    }
  }

  // Convert subcategory slug to actual subcategory name
  if (subcategorySlug && categorySlug) {
    const subcategoryName = await getSubcategoryNameFromSlug(
      subcategorySlug,
      categorySlug,
    );
    if (subcategoryName) {
      constraints.push(where("subcategory", "==", subcategoryName));
    }
  }

  const q = constraints.length ? query(colRef, ...constraints) : query(colRef);
  const snapshot = await getCountFromServer(q);

  return snapshot.data().count;
};

// Batch check stock for multiple products
export const checkProductsStock = async (
  cartItems: Array<{ id: string; quantity: number }>,
): Promise<{
  allInStock: boolean;
  stockIssues: Array<{
    id: string;
    name: string;
    requested: number;
    available: number;
    error: string;
  }>;
}> => {
  try {
    const stockChecks = await Promise.all(
      cartItems.map(async (item) => {
        const stockCheck = await checkProductStock(item.id, item.quantity);
        if (!stockCheck.hasStock) {
          // Get product name for better error reporting
          const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
          const productSnap = await getDoc(productRef);
          const productName = productSnap.exists()
            ? productSnap.data().name
            : "Unknown Product";

          return {
            id: item.id,
            name: productName,
            requested: item.quantity,
            available: stockCheck.availableStock || 0,
            error: stockCheck.error || "Insufficient stock",
          };
        }
        return null;
      }),
    );

    const stockIssues = stockChecks.filter(Boolean);
    return {
      allInStock: stockIssues.length === 0,
      stockIssues: stockIssues as Array<{
        id: string;
        name: string;
        requested: number;
        available: number;
        error: string;
      }>,
    };
  } catch (error) {
    console.error("Error checking products stock:", error);
    return {
      allInStock: false,
      stockIssues: [
        {
          id: "unknown",
          name: "Unknown",
          requested: 0,
          available: 0,
          error: "Error checking stock",
        },
      ],
    };
  }
};
