import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import { categoryAPI } from "@/api/category.api";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryAPI.getCategories();
        setCategories(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Category icon mapping (you can customize this)
  const getCategoryIcon = (name) => {
    const iconMap = {
      electronics: "📱",
      fashion: "👕",
      home: "🏡",
      sports: "⚽",
      books: "📚",
      toys: "🧸",
      beauty: "💄",
      food: "🍔",
      automotive: "🚗",
      default: "📦",
    };

    const key = name?.toLowerCase() || "";
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (key.includes(keyword)) return icon;
    }
    return iconMap.default;
  };

  if (loading) {
    return (
      <div className="container-custom py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-(--color-text-primary)">
            Browse Categories
          </h1>
          <p className="text-(--color-text-muted) mt-1">
            Explore products by category
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-(--color-primary)" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-(--color-text-primary)">
            Browse Categories
          </h1>
          <p className="text-(--color-text-muted) mt-1">
            Explore products by category
          </p>
        </div>
        <div className="text-center py-20 bg-(--color-background-alt)/30 rounded-3xl border border-dashed border-(--color-border)">
          <p className="text-(--color-error) mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-(--color-text-primary)">
          Browse Categories
        </h1>
        <p className="text-(--color-text-muted) mt-1">
          Explore products by category
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category._id || category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() =>
                navigate(`/products?category=${category._id || category.id}`)
              }
              className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {getCategoryIcon(category.name)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-(--color-text-primary) group-hover:text-(--color-primary) transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-(--color-text-muted)">
                      {category.description || "Browse products"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-(--color-text-muted) group-hover:text-(--color-primary) transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-(--color-background-alt)/30 rounded-3xl border border-dashed border-(--color-border) flex flex-col items-center">
          <div className="bg-white p-5 rounded-full shadow-sm mb-4">
            <Package className="w-10 h-10 text-(--color-text-disabled)" />
          </div>
          <h3 className="text-xl font-semibold text-(--color-text-primary)">
            No categories available
          </h3>
          <p className="text-(--color-text-muted) mt-2 max-w-md">
            Categories will appear here once they are added.
          </p>
        </div>
      )}
    </div>
  );
};

export default Categories;
