// import { useEffect, useRef, useCallback } from "react";
// import { useSearchParams, useNavigate } from "react-router-dom";
// import { useAppDispatch, useAppSelector } from "@/app/hooks";
// import { fetchProducts, setFilters } from "@/features/product/productSlice";
// import ProductCard from "@/components/ui/ProductCard";
// import ProductListSkeleton from "@/components/ui/ProductListSkeleton";
// import { SearchX, FilterX } from "lucide-react";

// const Products = () => {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const observerTarget = useRef(null);
//   const fetchingRef = useRef(false);
//   const initialLoadDone = useRef(false);

//   const { products, loading, error, pagination, filters } = useAppSelector(
//     (state) => state.product,
//   );

//   const search = searchParams.get("search") || "";
//   const category = searchParams.get("category") || "";

//   useEffect(() => {
//     const newFilters = {};
//     let hasChanges = false;

//     if (filters.search !== search) {
//       newFilters.search = search;
//       hasChanges = true;
//     }

//     if (filters.category !== category) {
//       newFilters.category = category;
//       hasChanges = true;
//     }

//     if (hasChanges) {
//       dispatch(setFilters(newFilters));
//     }

//     // Reset both guards before every new search
//     fetchingRef.current = true;
//     initialLoadDone.current = false;

//     dispatch(fetchProducts({ isNewSearch: true }))
//       .unwrap()
//       .finally(() => {
//         initialLoadDone.current = true;
//         fetchingRef.current = false;
//       });
//   }, [search, category, dispatch]);

//   // Infinite Scroll Handler
//   const handleObserver = useCallback(
//     (entries) => {
//       const [target] = entries;

//       if (
//         target.isIntersecting &&
//         pagination.hasMore &&
//         !loading &&
//         !error &&
//         !fetchingRef.current &&
//         initialLoadDone.current // Block until first load is complete
//       ) {
//         fetchingRef.current = true;

//         dispatch(fetchProducts({ isNewSearch: false }))
//           .unwrap()
//           .catch(() => {})
//           .finally(() => {
//             fetchingRef.current = false;
//           });
//       }
//     },
//     [pagination.hasMore, loading, error, dispatch],
//   );

//   useEffect(() => {
//     const element = observerTarget.current;
//     if (!element) return;

//     const observer = new IntersectionObserver(handleObserver, {
//       threshold: 0.1,
//       rootMargin: "200px", // Load earlier for smoother infinite scroll
//     });

//     observer.observe(element);
//     return () => observer.disconnect();
//   }, [handleObserver]);

//   return (
//     <div className="container-custom py-8 pb-20">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-(--color-text-primary)">
//             {search
//               ? `Search results for "${search}"`
//               : category
//                 ? "Category Products"
//                 : "Latest Products"}
//           </h1>
//           <p className="text-(--color-text-muted) mt-1">
//             {search || category
//               ? `Found ${pagination.total} matching products`
//               : "Discover our premium collection"}
//           </p>
//         </div>

//         <div className="flex items-center gap-4">
//           {(search || category) && (
//             <button
//               onClick={() => navigate("/products")}
//               className="text-sm text-(--color-primary) hover:underline font-medium"
//             >
//               Clear filters
//             </button>
//           )}
//           {/* Future: Sort Dropdown */}
//         </div>
//       </div>

//       {error ? (
//         <div className="text-center py-20 flex flex-col items-center">
//           <div className="bg-(--color-error-light)/20 p-4 rounded-full mb-4">
//             <FilterX className="w-8 h-8 text-(--color-error)" />
//           </div>
//           <p className="text-(--color-text-primary) font-medium mb-1">
//             Something went wrong
//           </p>
//           <p className="text-(--color-text-muted) mb-6">{error}</p>
//           <button
//             onClick={() => dispatch(fetchProducts({ isNewSearch: true }))}
//             className="btn-primary"
//           >
//             Try Again
//           </button>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
//             {products.map((product) => (
//               <ProductCard key={product.id || product._id} product={product} />
//             ))}

//             {loading && <ProductListSkeleton count={4} />}
//           </div>

//           {!loading && products.length === 0 && (
//             <div className="text-center py-24 bg-(--color-background-alt)/30 rounded-3xl border border-dashed border-(--color-border) flex flex-col items-center">
//               <div className="bg-white p-5 rounded-full shadow-sm mb-4">
//                 <SearchX className="w-10 h-10 text-(--color-text-disabled)" />
//               </div>
//               <h3 className="text-xl font-semibold text-(--color-text-primary)">
//                 No products found
//               </h3>
//               <p className="text-(--color-text-muted) mt-2 max-w-md">
//                 We couldn't find any products
//                 {search ? ` matching "${search}"` : ""}. Try adjusting your
//                 search or filters.
//               </p>
//               {search && (
//                 <button
//                   onClick={() => navigate("/products")}
//                   className="mt-6 text-(--color-primary) font-medium hover:underline"
//                 >
//                   Clear all search filters
//                 </button>
//               )}
//             </div>
//           )}

//           {/* Observer Target for Infinite Scroll */}
//           <div ref={observerTarget} className="h-20 w-full" />

//           {!pagination.hasMore && products.length > 0 && (
//             <div className="flex flex-col items-center mt-8">
//               <div className="h-px w-24 bg-(--color-border) mb-4"></div>
//               <p className="text-(--color-text-disabled) text-sm italic">
//                 You've seen all products
//               </p>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default Products;

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchProducts, setFilters } from "@/features/product/productSlice";
import ProductCard from "@/components/ui/ProductCard";
import ProductListSkeleton from "@/components/ui/ProductListSkeleton";
import { SearchX, FilterX } from "lucide-react";

const Products = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const observerTarget = useRef(null);
  const fetchingRef = useRef(false);
  const initialLoadDone = useRef(false);
  const lastTriggerTime = useRef(0); // 🔥 throttle control

  const { products, loading, error, pagination, filters } = useAppSelector(
    (state) => state.product,
  );

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  // 🔥 INITIAL LOAD
  useEffect(() => {
    const newFilters = {};
    let hasChanges = false;

    if (filters.search !== search) {
      newFilters.search = search;
      hasChanges = true;
    }

    if (filters.category !== category) {
      newFilters.category = category;
      hasChanges = true;
    }

    if (hasChanges) {
      dispatch(setFilters(newFilters));
    }

    fetchingRef.current = true;
    initialLoadDone.current = false;

    dispatch(fetchProducts({ isNewSearch: true }))
      .unwrap()
      .finally(() => {
        initialLoadDone.current = true;
        fetchingRef.current = false;
      });
  }, [search, category, dispatch]);

  // 🔥 INFINITE SCROLL HANDLER (FINAL FIX)
  const handleObserver = useCallback(
    (entries) => {
      const now = Date.now();

      // 🔥 THROTTLE (prevent rapid triggers)
      if (now - lastTriggerTime.current < 500) return;

      const [target] = entries;

      if (
        target.isIntersecting &&
        pagination.hasMore &&
        !loading &&
        !error &&
        !fetchingRef.current &&
        initialLoadDone.current
      ) {
        lastTriggerTime.current = now;
        fetchingRef.current = true;

        // 🔥 DELAY (smooth UX)
        setTimeout(() => {
          dispatch(fetchProducts({ isNewSearch: false }))
            .unwrap()
            .catch(() => {})
            .finally(() => {
              fetchingRef.current = false;
            });
        }, 300);
      }
    },
    [pagination.hasMore, loading, error, dispatch],
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "300px", // 🔥 increased for smoother preloading
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="container-custom py-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-(--color-text-primary)">
            {search
              ? `Search results for "${search}"`
              : category
                ? "Category Products"
                : "Latest Products"}
          </h1>
          <p className="text-(--color-text-muted) mt-1">
            {search || category
              ? `Found ${pagination.total} matching products`
              : "Discover our premium collection"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {(search || category) && (
            <button
              onClick={() => navigate("/products")}
              className="text-sm text-(--color-primary) hover:underline font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="bg-(--color-error-light)/20 p-4 rounded-full mb-4">
            <FilterX className="w-8 h-8 text-(--color-error)" />
          </div>
          <p className="text-(--color-text-primary) font-medium mb-1">
            Something went wrong
          </p>
          <p className="text-(--color-text-muted) mb-6">{error}</p>
          <button
            onClick={() => dispatch(fetchProducts({ isNewSearch: true }))}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}

            {/* 🔥 BETTER LOADING BUFFER */}
            {loading && <ProductListSkeleton count={8} />}
          </div>

          {!loading && products.length === 0 && (
            <div className="text-center py-24 bg-(--color-background-alt)/30 rounded-3xl border border-dashed border-(--color-border) flex flex-col items-center">
              <div className="bg-white p-5 rounded-full shadow-sm mb-4">
                <SearchX className="w-10 h-10 text-(--color-text-disabled)" />
              </div>
              <h3 className="text-xl font-semibold text-(--color-text-primary)">
                No products found
              </h3>
              <p className="text-(--color-text-muted) mt-2 max-w-md">
                We couldn't find any products
                {search ? ` matching "${search}"` : ""}. Try adjusting your
                search or filters.
              </p>
              {search && (
                <button
                  onClick={() => navigate("/products")}
                  className="mt-6 text-(--color-primary) font-medium hover:underline"
                >
                  Clear all search filters
                </button>
              )}
            </div>
          )}

          {/* Observer Target */}
          <div ref={observerTarget} className="h-20 w-full" />

          {!pagination.hasMore && products.length > 0 && (
            <div className="flex flex-col items-center mt-8">
              <div className="h-px w-24 bg-(--color-border) mb-4"></div>
              <p className="text-(--color-text-disabled) text-sm italic">
                You've seen all products
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Products;
