import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  createProduct,
  selectProductLoading,
} from "@/features/product/productSlice";
import {
  fetchCategories,
  selectCategories,
} from "@/features/product/categorySlice";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { USER_ROLES } from "@/utils/constants";

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.preprocess(
    (val) => Number(val),
    z.number().positive("Price must be positive"),
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().int().nonnegative("Stock must be non-negative"),
  ),
  category: z.string().min(1, "Please select a category"),
  imageUrl: z
    .string()
    .url("Please enter a valid image URL")
    .min(1, "Image URL is required"),
});

const AddProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const loading = useSelector(selectProductLoading);
  const categories = useSelector(selectCategories);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      imageUrl: "",
    },
  });

  const previewImage = watch("imageUrl");

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      // Map images as array of objects per backend model
      const { imageUrl, ...rest } = data;
      const productData = {
        ...rest,
        images: [{ url: imageUrl }],
      };

      await dispatch(createProduct(productData)).unwrap();
      toast.success("Product created successfully!");

      const redirectPath =
        user?.role === USER_ROLES.ADMIN
          ? "/admin/products"
          : "/seller/products";
      navigate(redirectPath);
    } catch (err) {
      toast.error(err || "Failed to create product");
    }
  };

  const backPath =
    user?.role === USER_ROLES.ADMIN ? "/admin/products" : "/seller/products";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(backPath)}
          className="p-2 hover:bg-(--color-background-alt) rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-(--color-text-muted)" />
        </button>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          Add New Product
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card shadow-lg bg-(--color-surface) border border-(--color-border)">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-(--color-text-primary)">
                    Product Title{" "}
                    <span className="text-(--color-error)">*</span>
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="Premium Wireless Headphones"
                    className={`input-field w-full ${errors.name ? "border-(--color-error)" : ""}`}
                  />
                  {errors.name && (
                    <p className="text-xs text-(--color-error)">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-(--color-text-primary)">
                    Price ($) <span className="text-(--color-error)">*</span>
                  </label>
                  <input
                    {...register("price")}
                    type="number"
                    step="0.01"
                    placeholder="99.99"
                    className={`input-field w-full ${errors.price ? "border-(--color-error)" : ""}`}
                  />
                  {errors.price && (
                    <p className="text-xs text-(--color-error)">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-(--color-text-primary)">
                    Stock Quantity{" "}
                    <span className="text-(--color-error)">*</span>
                  </label>
                  <input
                    {...register("stock")}
                    type="number"
                    placeholder="100"
                    className={`input-field w-full ${errors.stock ? "border-(--color-error)" : ""}`}
                  />
                  {errors.stock && (
                    <p className="text-xs text-(--color-error)">
                      {errors.stock.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-(--color-text-primary)">
                    Category <span className="text-(--color-error)">*</span>
                  </label>
                  <select
                    {...register("category")}
                    className={`input-field w-full bg-white ${errors.category ? "border-(--color-error)" : ""}`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-xs text-(--color-error)">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-(--color-text-primary)">
                    Product Description{" "}
                    <span className="text-(--color-error)">*</span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows="5"
                    placeholder="Detailed description of your product..."
                    className={`input-field w-full min-h-[150px] py-3 ${errors.description ? "border-(--color-error)" : ""}`}
                  />
                  {errors.description && (
                    <p className="text-xs text-(--color-error)">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-(--color-text-primary)">
                    Image URL <span className="text-(--color-error)">*</span>
                  </label>
                  <input
                    {...register("imageUrl")}
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className={`input-field w-full ${errors.imageUrl ? "border-(--color-error)" : ""}`}
                  />
                  {errors.imageUrl && (
                    <p className="text-xs text-(--color-error)">
                      {errors.imageUrl.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-(--color-border) flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate(backPath)}
                  className="btn btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {loading ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-(--color-text-primary) uppercase tracking-wider px-1">
            Product Preview
          </h3>
          <div className="card p-0 overflow-hidden shadow-md border border-(--color-border) bg-(--color-surface)">
            <div className="aspect-square bg-(--color-background-alt) flex items-center justify-center relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400?text=Invalid+Image+URL";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center text-(--color-text-disabled)">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-xs">No image preview</p>
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-(--color-background-alt) rounded-sm w-1/4 animate-pulse"></div>
              <h4 className="font-bold text-lg truncate">
                {watch("name") || "Product Title"}
              </h4>
              <p className="text-(--color-text-muted) text-sm line-clamp-2 min-h-[40px]">
                {watch("description") ||
                  "Product description will appear here..."}
              </p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xl font-extrabold text-(--color-primary)">
                  ${watch("price") || "0.00"}
                </span>
                <span className="text-xs text-(--color-text-muted)">
                  Stock: {watch("stock") || "0"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-blue-800 text-xs font-bold uppercase mb-2">
              Tips
            </h4>
            <ul className="text-blue-700 text-xs space-y-1 list-disc pl-4">
              <li>Use high-quality product images for better conversion.</li>
              <li>
                Detailed descriptions help customers make informed choices.
              </li>
              <li>Ensure pricing is competitive within its category.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
