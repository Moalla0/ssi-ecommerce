import ProductList from "@/components/ProductList";
import PopularProducts from "@/components/PopularProducts";
import NewArrivals from "@/components/NewArrivals";
import Sales from "@/components/Sales";
import TrustedBy from "@/components/TrustedBy";
import Image from "next/image";

const Homepage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    category: string | null;
    subcategory: string | null;
    sort: string | null;
    page: string | null;
  }>;
}) => {
  const { category, subcategory, sort, page } = await searchParams;
  const currentPage = page ? parseInt(page) : 1;
  
  return (
    <div className="">
      <div className="relative aspect-[3/1] mb-12">
        <Image src="/banner.png" alt="Featured Product" fill />
      </div>
      <ProductList
        category={category}
        subcategory={subcategory}
        params="homepage"
        sort={sort}
        page={currentPage}
        productsPerPage={12}
      />
      <NewArrivals />
      <Sales />
      <PopularProducts />
      <TrustedBy />
    </div>
  );
};

export default Homepage;
