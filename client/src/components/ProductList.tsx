import Categories from "./Categories";
import ProductCard from "./ProductCard";
import Link from "next/link";
import Filter from "./Filter";
import Pagination from "./Pagination";
import { fetchProducts, getProductsCount } from "@/lib/products";
import { Product as ProductType } from "@shared/types";
import { Suspense } from "react";

const ProductsGrid = async ({
  category,
  subcategory,
  sort,
  page,
  productsPerPage,
}: {
  category: string | null;
  subcategory?: string | null;
  sort: string | null;
  page: number;
  productsPerPage: number;
}) => {
  const data = await fetchProducts({
    categorySlug: category,
    subcategorySlug: subcategory,
    sort: (sort as any) ?? undefined,
    page,
    productsPerPage,
  });

  if (!data.length) {
    return <div className="text-sm text-gray-500">No products found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-12">
      {data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const ProductList = async ({
  category,
  subcategory,
  params,
  sort,
  page = 1,
  productsPerPage = 12,
}: {
  category: string | null;
  subcategory?: string | null;
  params: "homepage" | "products";
  sort: string | null;
  page?: number;
  productsPerPage?: number;
}) => {
  // Get total count for pagination
  const totalProducts = await getProductsCount({
    categorySlug: category,
    subcategorySlug: subcategory,
  });

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  return (
    <div className="w-full">
      <Categories />
      {params === "products" && <Filter />}
      <Suspense
        fallback={
          <div className="text-sm text-gray-500">Loading products...</div>
        }
      >
        <ProductsGrid
          category={category}
          subcategory={subcategory}
          sort={sort}
          page={page}
          productsPerPage={productsPerPage}
        />
      </Suspense>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalProducts={totalProducts}
        productsPerPage={productsPerPage}
      />

      <Link
        href={category ? `/products/?category=${category}` : "/products"}
        className="flex justify-end mt-4 underline text-sm text-gray-500"
      >
        View all products
      </Link>
    </div>
  );
};

export default ProductList;
