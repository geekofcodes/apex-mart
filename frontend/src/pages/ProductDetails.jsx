import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import { fetchProductDetails } from "@/features/product/productSlice";
import { addToCart } from "@/features/cart/cartSlice";
import { formatCurrency } from "@/utils/helpers";
import {
  ShoppingCart,
  Heart,
  Share2,
  ArrowLeft,
  Star,
  Truck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { motion } from "framer-motion";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    activeProduct: product,
    loading,
    error,
  } = useAppSelector((state) => state.product);

  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchProductDetails(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-(--color-text-primary) mb-2">
          Product not found
        </h2>
        <p className="text-(--color-text-muted) mb-6">
          {error || "The product you're looking for doesn't exist."}
        </p>
        <button onClick={() => navigate("/products")} className="btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  const { title, description, price, discountPrice, images, stock } = product;
  const isOutOfStock = stock <= 0;
  const discountPercent = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  return (
    <div className="container-custom py-8 md:py-12">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center text-sm text-(--color-text-muted) hover:text-(--color-primary) mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-(--color-surface) rounded-2xl overflow-hidden border border-(--color-border) shadow-xs relative">
            {images && images.length > 0 ? (
              <img
                src={images[0]}
                alt={title}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-(--color-background) text-(--color-text-disabled)">
                No Image Available
              </div>
            )}

            {/* Tags */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isOutOfStock ? (
                <span className="bg-(--color-text-primary) text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Sold Out
                </span>
              ) : discountPrice ? (
                <span className="bg-(--color-error) text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Save {discountPercent}%
                </span>
              ) : null}
            </div>
          </div>

          {/* Thumbnails (Placeholder logic) */}
          {images && images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden border border-(--color-border) cursor-pointer hover:border-(--color-primary) transition-colors"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-center space-x-2">
            <span className="text-(--color-primary) font-medium text-sm">
              Electronics
            </span>
            <span className="text-(--color-text-muted)">•</span>
            <div className="flex items-center text-(--color-warning)">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 text-(--color-text-primary) text-sm font-medium">
                4.8 (124 reviews)
              </span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-(--color-text-primary) mb-4 leading-tight">
            {title}
          </h1>

          <div className="flex items-end gap-3 mb-6">
            {discountPrice ? (
              <>
                <span className="text-3xl font-bold text-(--color-text-primary)">
                  {formatCurrency(discountPrice)}
                </span>
                <span className="text-lg text-(--color-text-muted) line-through mb-1">
                  {formatCurrency(price)}
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-(--color-text-primary)">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          <div className="prose prose-sm text-(--color-text-muted) mb-8 border-b border-(--color-border) pb-8">
            <p>{description}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <button
                  disabled={isOutOfStock || isAdding}
                  onClick={async () => {
                    setIsAdding(true);
                    await dispatch(addToCart({ productId: id, quantity: 1 }));
                    setIsAdding(false);
                  }}
                  className={`w-full h-12 flex items-center justify-center space-x-2 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${
                    isOutOfStock
                      ? "bg-(--color-background-alt) text-(--color-text-disabled) cursor-not-allowed"
                      : "bg-(--color-primary) text-(--color-surface) hover:bg-(--color-primary-hover) shadow-lg shadow-(--color-primary)/20 disabled:opacity-70 disabled:cursor-wait"
                  }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  <span>
                    {isOutOfStock
                      ? "Out of Stock"
                      : isAdding
                        ? "Adding to Cart..."
                        : "Add to Cart"}
                  </span>
                </button>
              </div>
              <button className="h-12 w-12 flex items-center justify-center rounded-xl border border-(--color-border) text-(--color-text-muted) hover:border-(--color-error) hover:text-(--color-error) hover:bg-(--color-error-light)/10 transition-colors">
                <Heart className="w-5 h-5" />
              </button>
              <button className="h-12 w-12 flex items-center justify-center rounded-xl border border-(--color-border) text-(--color-text-muted) hover:border-(--color-primary) hover:text-(--color-primary) hover:bg-(--color-primary-light) transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {stock > 0 && stock < 10 && (
              <p className="text-(--color-error) text-sm font-medium animate-pulse">
                Only {stock} items left in stock!
              </p>
            )}
          </div>

          {/* Features / Trust Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-(--color-background-alt) rounded-xl">
              <Truck className="w-6 h-6 text-(--color-primary) shrink-0" />
              <div>
                <p className="font-semibold text-(--color-text-primary) text-sm">
                  Free Delivery
                </p>
                <p className="text-xs text-(--color-text-muted)">
                  Orders over $50
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-(--color-background-alt) rounded-xl">
              <ShieldCheck className="w-6 h-6 text-(--color-accent) shrink-0" />
              <div>
                <p className="font-semibold text-(--color-text-primary) text-sm">
                  2 Year Warranty
                </p>
                <p className="text-xs text-(--color-text-muted)">
                  100% Protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
