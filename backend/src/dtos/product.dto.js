/**
 * Product DTOs - Pass-through layer.
 *
 * The repository (#normalise) is the single source of truth for data shape.
 * DTOs are intentionally kept as identity functions to avoid duplicate
 * transformation logic and prevent field-omission bugs.
 */

class ProductDTO {
  static productListResponse(product)   { return product; }
  static productDetailResponse(product) { return product; }
  static sellerProductResponse(product) { return product; }
  static minimalProductResponse(product){ return product; }

  static productListArrayResponse(products) {
    return products.map((p) => this.productListResponse(p));
  }
}

export default ProductDTO;
