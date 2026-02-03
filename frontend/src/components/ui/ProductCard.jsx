import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/utils/helpers";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { addToCart } from "@/features/cart/cartSlice";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);

  // Defensive destructuring with fallbacks
  const {
    id,
    title,
    name,
    description,
    price,
    discountPrice,
    images,
    stock,
    _id,
  } = product || {};

  console.log("ProductCard product:", product);

  const effectiveId = id || _id;

  // Handle title/name discrepancy and ensure string
  const displayTitle = title || name || "Untitled Product";

  // Handle description (if available in API) or fallback logic
  const displayDescription = description || "";

  // Handle images with inline SVG fallback
  const placeholderImage =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

  const mainImage =
    images && images.length > 0 && images[0] ? images[0] : placeholderImage;

  const isOutOfStock = (stock || 0) <= 0;

  // Calculate discount percentage if applicable
  const discountPercent = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="group card p-0 overflow-hidden flex flex-col h-full hover-lift relative bg-(--color-surface) border border-(--color-border) hover:border-(--color-border-highlight) shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Product Image */}
      <Link
        to={`/products/${effectiveId}`}
        className="relative aspect-square overflow-hidden block bg-(--color-background-alt) border-b border-(--color-border)"
      >
        <img
          src={mainImage}
          alt={displayTitle}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = placeholderImage;
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isOutOfStock ? (
            <span className="bg-(--color-text-primary)/80 text-(--color-surface) text-xs font-bold px-2 py-1 rounded-sm backdrop-blur-xs">
              SOLD OUT
            </span>
          ) : discountPrice ? (
            <span className="bg-(--color-error) text-(--color-surface) text-xs font-bold px-2 py-1 rounded-sm shadow-sm">
              -{discountPercent}%
            </span>
          ) : null}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${effectiveId}`} className="block">
          <h3 className="text-(--color-text-primary) font-medium text-base mb-1 line-clamp-2 min-h-12 group-hover:text-(--color-primary) transition-colors">
            {displayTitle}
          </h3>
        </Link>

        {/* Description - Added per user request */}
        {displayDescription && (
          <p className="text-sm text-(--color-text-muted) line-clamp-2 mb-3 h-10">
            {displayDescription}
          </p>
        )}

        <div className="mt-auto pt-3 flex items-end justify-between border-t border-(--color-background)">
          <div>
            {discountPrice ? (
              <div className="flex flex-col">
                <span className="text-xs text-(--color-text-disabled) line-through decoration-(--color-text-disabled) mb-0.5">
                  {formatCurrency(price)}
                </span>
                <span className="text-lg font-bold text-(--color-text-primary)">
                  {formatCurrency(discountPrice)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-(--color-text-primary)">
                {formatCurrency(price)}
              </span>
            )}
          </div>

          {/* Add to Cart Button - Made more prominent */}
          <button
            disabled={isOutOfStock || isAdding}
            onClick={async () => {
              setIsAdding(true);
              await dispatch(
                addToCart({ productId: effectiveId, quantity: 1 }),
              );
              setIsAdding(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm ${
              isOutOfStock
                ? "bg-(--color-background-alt) text-(--color-text-disabled) cursor-not-allowed"
                : "bg-(--color-primary) text-white hover:bg-(--color-primary-hover) shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-wait"
            }`}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            <span>{isAdding ? "Adding..." : "Add"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
