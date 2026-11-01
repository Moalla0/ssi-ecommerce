"use client";

import { shippingFormSchema, ShippingFormInputs } from "@shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@shared/firebase";
import { useAuth } from "@/contexts/AuthContext";
import useCartStore from "@/stores/cartStore";

interface Props {
  setShippingForm: (data: ShippingFormInputs) => void;
}

const ShippingForm = ({ setShippingForm }: Props) => {
  const { user } = useAuth();
  const router = useRouter();
  const { cart } = useCartStore();

  // Check for stock issues
  const stockIssues = cart.filter((item) => {
    if (item.stock !== undefined && item.quantity > item.stock) {
      return true;
    }
    return false;
  });

  const hasStockIssues = stockIssues.length > 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ShippingFormInputs>({
    resolver: zodResolver(shippingFormSchema),
  });

  useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.shippingInfo) reset(data.shippingInfo);
        }
      } catch (error) {
        console.error("Error fetching shipping info:", error);
      }
    };
    fetchShippingInfo();
  }, [user, reset]);

  const handleShippingForm: SubmitHandler<ShippingFormInputs> = (data) => {
    // Check for stock issues before proceeding
    if (hasStockIssues) {
      alert(
        "Some items in your cart have insufficient stock. Please return to cart and resolve these issues.",
      );
      router.push("/cart?step=1", { scroll: false });
      return;
    }

    setShippingForm(data);
    router.push("/cart?step=3", { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Stock Warning */}
      {hasStockIssues && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-red-800 font-medium text-sm">
              Stock Issues Detected
            </p>
          </div>
          <p className="text-red-700 text-sm mt-2">
            Some items in your cart have insufficient stock. Please return to
            cart and resolve these issues.
          </p>
        </div>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(handleShippingForm)}
      >
        {[
          { id: "name", label: "Name", type: "text" },
          { id: "email", label: "Email", type: "email" },
          { id: "phone", label: "Phone", type: "text" },
          { id: "address", label: "Address", type: "text" },
          {
            id: "apartment",
            label: "Apartment / Unit (optional)",
            type: "text",
            optional: true,
          },
          { id: "city", label: "City", type: "text" },
          { id: "state", label: "State / Province", type: "text" },
          { id: "zip", label: "ZIP / Postal Code", type: "text" },
          { id: "country", label: "Country", type: "text" },
        ].map(({ id, label, type, optional }) => (
          <div key={id} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-gray-500 font-medium">
              {label}
            </label>
            <input
              id={id}
              type={type}
              placeholder={label}
              className="border-b border-gray-200 py-2 outline-none text-sm"
              {...register(id as any)}
            />
            {!optional && errors[id as keyof ShippingFormInputs] && (
              <p className="text-xs text-red-500">
                {errors[id as keyof ShippingFormInputs]?.message as string}
              </p>
            )}
          </div>
        ))}

        {/* BUTTONS */}
        <div className="flex gap-4 mt-4">
          <button
            type="button"
            onClick={() => router.push("/cart?step=1", { scroll: false })}
            className="flex-1 bg-gray-200 hover:bg-gray-300 transition-all duration-300 text-gray-800 p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3 h-3" />
            Back
          </button>

          <button
            type="submit"
            className="flex-1 bg-gray-800 hover:bg-gray-900 transition-all duration-300 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingForm;
