/**
 * Product DTOs - Data Transfer Objects for Product Management
 * Ensures API responses don't expose sensitive data
 */

class ProductDTO {
  /**
   * Basic product response DTO (for list views)
   */
  static productListResponse(product) {
    return {
      _id: product._id,
      name: product.name,
      description: product.description?.substring(0, 150) + "..." || "",
      price: product.price,
      discountPrice: product.discountPrice || null,
      finalPrice: product.finalPrice,
      discountPercentage: product.discountPercentage,
      category: product.category,
      images: product.images?.length > 0 ? [product.images[0]] : [],
      stock: product.stock,
      inStock: product.inStock,
      status: product.status,
      brand: product.brand || null,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
    };
  }

  /**
   * Detailed product response DTO (for single product view)
   */
  static productDetailResponse(product) {
    return {
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || null,
      finalPrice: product.finalPrice,
      discountPercentage: product.discountPercentage,
      category: product.category,
      seller: product.seller,
      images: product.images || [],
      stock: product.stock,
      inStock: product.inStock,
      sku: product.sku || null,
      brand: product.brand || null,
      specifications: product.specifications
        ? product.specifications instanceof Map
          ? Object.fromEntries(product.specifications)
          : product.specifications
        : {},
      tags: product.tags || [],
      status: product.status,
      isFeatured: product.isFeatured,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      totalSales: product.totalSales,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Product list response with array transformation
   */
  static productListArrayResponse(products) {
    return products.map((product) => this.productListResponse(product));
  }

  /**
   * Seller product response (includes additional seller info)
   */
  static sellerProductResponse(product) {
    return {
      _id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || null,
      finalPrice: product.finalPrice,
      category: product.category,
      images: product.images || [],
      stock: product.stock,
      sku: product.sku || null,
      status: product.status,
      isActive: product.isActive,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      totalSales: product.totalSales,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  /**
   * Minimal product response (for references in other entities)
   */
  static minimalProductResponse(product) {
    return {
      _id: product._id,
      name: product.name,
      price: product.price,
      discountPrice: product.discountPrice || null,
      finalPrice: product.finalPrice,
      image: product.images?.length > 0 ? product.images[0].url : null,
      stock: product.stock,
      inStock: product.inStock,
    };
  }
}

export default ProductDTO;
