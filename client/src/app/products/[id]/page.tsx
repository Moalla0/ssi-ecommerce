import ProductInteraction from "@/components/ProductInteraction";
import Image from "next/image";
import { fetchProductById } from "@/lib/products";
import ProductGallery from "@/components/ProductGallery";
import { isDiscountValid, getCurrentPrice, formatPrice } from "@/lib/products";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const product = await fetchProductById(id);
  return {
    title: product?.name || "Product",
    describe: product?.description || "",
  };
};

const ProductPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const product = await fetchProductById(id);
  if (!product) {
    return <div className="mt-12 text-sm text-gray-500">Product not found.</div>;
  }
  
  // Check if discount is valid and should be displayed
  const hasValidDiscount = product.hasDiscount && product.discountPercentage && isDiscountValid(product);
  const currentPrice = getCurrentPrice(product);
  
  // Get the first available image
  return (
    <div className="flex flex-col gap-8 mt-12">
      {/* MAIN PRODUCT SECTION */}
      <div className="flex flex-col gap-4 lg:flex-row md:gap-12">
        {/* IMAGE */}
        <div className="w-full lg:w-5/12">
          <ProductGallery images={product.images} />
        </div>
        {/* DETAILS */}
        <div className="w-full lg:w-7/12 flex flex-col gap-4">
          <h1 className="text-2xl font-medium">{product.name}</h1>
          <p className="text-gray-500">{product.description}</p>
          
          {/* PRICE SECTION */}
          <div className="flex flex-col gap-2">
            {hasValidDiscount ? (
              <>
                <h2 className="text-2xl font-semibold text-green-600">{formatPrice(currentPrice)}</h2>
                <p className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</p>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-md">
                    {product.discountPercentage}% OFF
                  </span>
                  {product.discountEndDate && (
                    <span className="text-sm text-gray-500">
                      Offer ends {new Date(product.discountEndDate.toDate ? product.discountEndDate.toDate() : product.discountEndDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <h2 className="text-2xl font-semibold">{formatPrice(product.price)}</h2>
            )}
          </div>
          
          <ProductInteraction
            product={product}
          />
        </div>
      </div>
      
      {/* VIDEO SECTION - MOVED TO BOTTOM */}
      {product.videoUrl && (
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold">Product Video</h3>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
            {product.videoUrl.includes('youtube.com') || product.videoUrl.includes('youtu.be') ? (
              <iframe
                src={getYouTubeEmbedUrl(product.videoUrl)}
                title="Product Video"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={product.videoUrl}
                controls
                className="w-full h-full object-cover"
                poster={product.images?.main || product.images?.thumbnail || ""}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Watch this video to see the product in action and assess its quality.
          </p>
        </div>
      )}
    </div>
  );
};

// Helper function to convert YouTube URLs to embed URLs
const getYouTubeEmbedUrl = (url: string): string => {
  // Handle different YouTube URL formats
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0] || '';
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // If we can't parse it, return the original URL
  return url;
};

export default ProductPage;
