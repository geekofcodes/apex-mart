import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchCategories,
  selectCategories,
  selectCategoryLoading,
  selectCategoryError,
} from "@/features/product/categorySlice";
import { Loader2, Plus, FolderTree } from "lucide-react";

const AdminCategories = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectCategories);
  const loading = useSelector(selectCategoryLoading);
  const error = useSelector(selectCategoryError);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-primary)">
            Category Management
          </h1>
          <p className="text-(--color-text-muted)">
            Manage product categories and hierarchy.
          </p>
        </div>
        <Link
          to="/admin/categories/new"
          className="btn btn-primary flex items-center gap-2 cursor-pointer transition-all hover:shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Category
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--color-background-alt) text-(--color-text-muted) uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Parent Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {loading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-(--color-text-muted)"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading categories...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-(--color-error)"
                  >
                    {error}
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-(--color-text-muted)"
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-(--color-background-alt)/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-(--color-primary)" />
                        <span className="font-medium text-(--color-text-primary)">
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-(--color-text-muted)">
                      {cat.id}
                    </td>
                    <td className="px-6 py-4 text-(--color-text-muted)">
                      {cat.parentCategoryId || "Root"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-(--color-primary) hover:underline text-xs font-medium cursor-pointer">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
