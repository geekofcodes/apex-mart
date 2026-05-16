import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createCategory,
  fetchCategories,
  selectCategories,
  selectCategoryLoading,
} from "@/features/product/categorySlice";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  parentCategory: z.string().optional(),
  description: z.string().optional(),
});

const AddCategory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectCategoryLoading);
  const categories = useSelector(selectCategories);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      parentCategory: "",
      description: "",
    },
  });

  const categoryName = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (categoryName) {
      const slug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setValue("slug", slug, { shouldValidate: true });
    }
  }, [categoryName, setValue]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const onSubmit = async (data) => {
    try {
      // Map empty string parentCategory to null for backend
      const payload = {
        ...data,
        parentCategory: data.parentCategory || null,
      };
      await dispatch(createCategory(payload)).unwrap();
      toast.success("Category created successfully!");
      navigate("/admin/categories");
    } catch (err) {
      toast.error(err || "Failed to create category");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/categories")}
          className="p-2 hover:bg-(--color-background-alt) rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-(--color-text-muted)" />
        </button>
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          Add New Category
        </h1>
      </div>

      <div className="card shadow-lg bg-(--color-surface) border border-(--color-border)">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-(--color-text-primary)">
              Category Name <span className="text-(--color-error)">*</span>
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="e.g., Electronics, Fashion"
              className={`input-field w-full ${errors.name ? "border-(--color-error) focus:ring-(--color-error)/20" : ""}`}
            />
            {errors.name && (
              <p className="text-xs text-(--color-error) font-medium">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-(--color-text-primary)">
              Category Slug <span className="text-(--color-error)">*</span>
            </label>
            <input
              {...register("slug")}
              type="text"
              placeholder="e.g., electronics-gadgets"
              className={`input-field w-full bg-(--color-background-alt)/30 ${errors.slug ? "border-(--color-error)" : ""}`}
            />
            <p className="text-[10px] text-(--color-text-muted)">
              The "slug" is the URL-friendly version of the name. It is
              auto-generated but can be edited.
            </p>
            {errors.slug && (
              <p className="text-xs text-(--color-error) font-medium">
                {errors.slug.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-(--color-text-primary)">
              Parent Category (Optional)
            </label>
            <select
              {...register("parentCategory")}
              className="input-field w-full bg-white"
            >
              <option value="">None (Top Level)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-(--color-text-primary)">
              Description (Optional)
            </label>
            <textarea
              {...register("description")}
              rows="4"
              placeholder="Brief description of the category..."
              className="input-field w-full min-h-[120px] py-3"
            />
          </div>

          <div className="pt-6 border-t border-(--color-border) flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/categories")}
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
              {loading ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategory;
