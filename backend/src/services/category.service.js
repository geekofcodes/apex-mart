import categoryRepository from "../repositories/category.repository.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Category Service - Contains all category management business logic
 */
class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(categoryData) {
    // Check if slug already exists
    const existingCategory = await categoryRepository.findBySlug(categoryData.slug);
    if (existingCategory) {
      throw new AppError(
        "Category with this slug already exists",
        HTTP_STATUS.CONFLICT,
      );
    }

    // If parent category is specified, verify it exists
    if (categoryData.parentCategory) {
      const parentExists = await categoryRepository.findById(categoryData.parentCategory);
      if (!parentExists) {
        throw new AppError("Parent category not found", HTTP_STATUS.NOT_FOUND);
      }
    }

    const category = await categoryRepository.create(categoryData);
    return category;
  }

  /**
   * Get all categories (flat list)
   */
  async getAllCategories(queryParams = {}) {
    const { parentCategory, level } = queryParams;

    const categories = await categoryRepository.findMany({
      parentId: parentCategory,
      level,
      isActive: true,
    });

    return categories;
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree() {
    return categoryRepository.getTree();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, updateData) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    // If slug is being updated, check for duplicates
    if (updateData.slug && updateData.slug !== category.slug) {
      const existingCategory = await categoryRepository.findBySlug(updateData.slug);
      if (existingCategory) {
        throw new AppError(
          "Category with this slug already exists",
          HTTP_STATUS.CONFLICT,
        );
      }
    }

    // If parent is being updated, verify it exists and prevent circular references
    if (updateData.parentCategory !== undefined) {
      if (updateData.parentCategory) {
        const parentExists = await categoryRepository.findById(updateData.parentCategory);
        if (!parentExists) {
          throw new AppError(
            "Parent category not found",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        // Check for circular reference
        if (updateData.parentCategory === categoryId) {
          throw new AppError(
            "A category cannot be its own parent",
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const isDescendant = await categoryRepository.isDescendantOf(
          updateData.parentCategory,
          categoryId,
        );
        if (isDescendant) {
          throw new AppError(
            "Circular reference detected: parent cannot be a descendant",
            HTTP_STATUS.BAD_REQUEST,
          );
        }
      }
    }

    // Update category
    const updated = await categoryRepository.update(categoryId, updateData);
    return updated;
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check if category has products
    const productCount = await categoryRepository.countProducts(categoryId);
    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category with ${productCount} associated products. Please reassign or delete products first.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Check if category has subcategories
    const subcategoryCount = await categoryRepository.countSubcategories(categoryId);
    if (subcategoryCount > 0) {
      throw new AppError(
        `Cannot delete category with ${subcategoryCount} subcategories. Please delete or reassign subcategories first.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Soft delete
    const deleted = await categoryRepository.softDelete(categoryId);
    return deleted;
  }

  /**
   * Get subcategories of a category
   */
  async getSubcategories(categoryId) {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    const subcategories = await categoryRepository.findMany({
      parentId: categoryId,
      isActive: true,
    });

    return subcategories;
  }

  /**
   * Update product count for a category
   */
  async updateProductCount(categoryId) {
    return categoryRepository.updateProductCount(categoryId);
  }
}

export default new CategoryService();
