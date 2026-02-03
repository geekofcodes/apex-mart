/**
 * Category DTO - Shapes category related responses
 */
class CategoryDTO {
  /**
   * Detailed category response
   */
  static detailedCategoryResponse(category) {
    if (!category) return null;

    return {
      id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentCategory: category.parentCategory || null,
      level: category.level,
      productCount: category.productCount,
      isActive: category.isActive,
      createdAt: category.createdAt,
    };
  }

  /**
   * Category list response
   */
  static categoryListResponse(categories) {
    return categories.map((cat) => this.detailedCategoryResponse(cat));
  }
  /**
   * Category tree response
   */
  static categoryTreeResponse(node) {
    if (!node) return null;

    return {
      id: node._id,
      name: node.name,
      slug: node.slug,
      children: node.children
        ? node.children.map((child) => this.categoryTreeResponse(child))
        : [],
    };
  }

  /**
   * Category tree array response
   */
  static categoryTreeArrayResponse(tree) {
    if (!tree || !Array.isArray(tree)) return [];
    return tree.map((node) => this.categoryTreeResponse(node));
  }
}

export default CategoryDTO;
