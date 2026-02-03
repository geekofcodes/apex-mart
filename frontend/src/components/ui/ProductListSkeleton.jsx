const ProductListSkeleton = ({ count = 8 }) => {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, idx) => (
          <div
            key={idx}
            className="card p-0 overflow-hidden h-full border-(--color-border)"
          >
            <div className="aspect-square bg-(--color-border) animate-pulse relative">
              <div className="absolute top-3 left-3 w-12 h-5 bg-(--color-background-alt) rounded-sm" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-(--color-border) rounded-sm animate-pulse w-3/4" />
              <div className="h-4 bg-(--color-border) rounded-sm animate-pulse w-1/2" />
              <div className="pt-3 border-t border-(--color-background) flex justify-between items-end">
                <div className="space-y-1">
                  <div className="h-3 bg-(--color-border) rounded-sm w-10" />
                  <div className="h-5 bg-(--color-border) rounded-sm w-16" />
                </div>
                <div className="w-10 h-10 rounded-full bg-(--color-border)" />
              </div>
            </div>
          </div>
        ))}
    </>
  );
};

export default ProductListSkeleton;
