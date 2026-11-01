"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCategoriesWithSubcategories, CategoryWithSubcategories } from "@/lib/categories";
import { fetchDistinctProductCategories } from "@/lib/products";

const Categories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get("category");
  const selectedSubcategory = searchParams.get("subcategory");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchCategoriesWithSubcategories();
        if (data.length === 0) {
          // Fallback: derive from products if no categories in DB
          const derived = await fetchDistinctProductCategories();
          const fallbackCategories: CategoryWithSubcategories[] = derived.map(slug => ({
            id: slug,
            name: slug,
            slug: slug,
            subcategories: []
          }));
          if (mounted) setCategories(fallbackCategories);
        } else {
          if (mounted) setCategories(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryChange = (categorySlug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (categorySlug && categorySlug !== "all") {
      params.set("category", categorySlug);
      params.delete("subcategory");
    } else {
      params.delete("category");
      params.delete("subcategory");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSubcategoryChange = (subcategorySlug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (subcategorySlug) {
      params.set("subcategory", subcategorySlug);
    } else {
      params.delete("subcategory");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex gap-2 mb-4">
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange("all")}
          className={`px-4 py-2 text-sm rounded border ${
            !selectedCategory 
              ? "bg-blue-600 text-white border-blue-600" 
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        
        {categories.map((category) => (
          <div key={category.slug} className="relative group">
            <button
              onClick={() => handleCategoryChange(category.slug)}
              className={`px-4 py-2 text-sm rounded border ${
                selectedCategory === category.slug
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {category.name}
            </button>
            
            {category.subcategories.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-40 hidden group-hover:block">
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.slug}
                    onClick={() => handleSubcategoryChange(subcategory.slug)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      selectedSubcategory === subcategory.slug
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
