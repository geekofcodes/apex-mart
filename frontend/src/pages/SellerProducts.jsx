import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  fetchProducts,
  selectProducts,
  selectProductLoading,
} from "@/features/product/productSlice";
import { useAppSelector } from "@/app/hooks";
import { formatCurrency } from "@/utils/helpers";
import { Loader2, Search, Edit, Trash2, Plus } from "lucide-react";

const SellerProducts = ({ isAdmin = false }) => {
  const dispatch = useDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const products = useSelector(selectProducts);
  const loading = useSelector(selectProductLoading);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchProducts({}));
  }, [dispatch]);

  const addProductPath = isAdmin
    ? "/admin/products/new"
    : "/seller/products/new";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-(--color-text-primary)">
          {isAdmin ? "Product Inventory" : "My Products"}
        </h1>
        <Link
          to={addProductPath}
          className="btn btn-primary flex items-center gap-2 cursor-pointer transition-all hover:shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-(--color-border)">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search your products..."
              className="pl-9 pr-4 py-2 bg-(--color-background) border border-(--color-border) rounded-lg text-sm w-full focus:outline-none focus:border-(--color-primary)"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-(--color-background-alt) text-(--color-text-muted) uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-(--color-text-muted)"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-(--color-text-muted)"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-(--color-background-alt)/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="font-medium text-(--color-text-primary)">
                          {product.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-(--color-text-primary)">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          product.stock < 10
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-(--color-success-light) text-(--color-success-dark) px-2 py-1 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

export default SellerProducts;
