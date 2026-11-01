import { z } from "zod";

export type ProductType = {
  id: string | number;
  reference?: string | number;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  images: Record<string, string>;
  salesCount?: number;
  unlimited?: boolean;
  stock?: number;
  // Additional fields
  category?: string;
  subcategory?: string;
  brand?: string;
  specs?: Record<string, any>;
  stockStatus?: 'in-stock' | 'sur-commande' | 'out-of-stock';
  // Discount fields
  hasDiscount?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountEndDate?: any;
  // Video URL for surveillance cameras
  videoUrl?: string;
};

export type ProductsType = ProductType[];

export type CartItemType = ProductType & {
  quantity: number;
};

export type CartItemsType = CartItemType[];

export const shippingFormSchema = z.object({
  name: z.string().min(1, "Name is required!"),
  email: z
    .string()
    .email("Invalid email address!")
    .min(1, "Email is required!"),
  phone: z
    .string()
    .min(7, "Phone number must be between 7 and 10 digits!")
    .max(10, "Phone number must be between 7 and 10 digits!")
    .regex(/^\d+$/, "Phone number must contain only numbers!"),
  address: z.string().min(1, "Address is required!"),
  apartment: z.string().optional(), // optional field
  city: z.string().min(1, "City is required!"),
  state: z.string().min(1, "State/Province is required!"),
  zip: z
    .string()
    .min(1, "ZIP/Postal Code is required!")
    .regex(/^\d{4,10}$/, "ZIP/Postal Code must be between 4 and 10 digits!"),
  country: z.string().min(1, "Country is required!"),
});

export type ShippingFormInputs = z.infer<typeof shippingFormSchema>;



export type CartStoreStateType = {
  cart: CartItemsType;
  hasHydrated: boolean;
};

export type CartStoreActionsType = {
  addToCart: (product: CartItemType) => void;
  removeFromCart: (product: CartItemType) => void;
  clearCart: () => void;
};
