import { z } from "zod";

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  images: Record<string, string>;
  salesCount: number;
  unlimited: boolean;
  stock?: number;
  reference?: string | number;
  category?: string;
  subcategory?: string;
  brand?: string;
  specs?: Record<string, any>;
  stockStatus?: "in-stock" | "sur-commande" | "out-of-stock";
  hasDiscount: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountEndDate?: any;
  videoUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type Products = Product[];

export interface CartItem extends Product {
  quantity: number;
}

export type CartItems = CartItem[];

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
  apartment: z.string().optional(),
  city: z.string().min(1, "City is required!"),
  state: z.string().min(1, "State/Province is required!"),
  zip: z
    .string()
    .min(1, "ZIP/Postal Code is required!")
    .regex(/^\d{4,10}$/, "ZIP/Postal Code must be between 4 and 10 digits!"),
  country: z.string().min(1, "Country is required!"),
});

export type ShippingFormInputs = z.infer<typeof shippingFormSchema>;

export interface AdminUser {
  id: string; // Document ID
  uid?: string; // Firebase UID (often same as id)
  email: string;
  role: "admin" | "user";
  name?: string;
  avatar?: string;
  fullName?: string;
  status?: "active" | "inactive";
}

export interface Order {
  id: string;
  orderNumber: number;
  userId: string;
  total: number;
  status: string;
  createdAt: any;
  customerName?: string;
  customerEmail?: string;
  items?: any[];
  shippingInfo?: any;
}
