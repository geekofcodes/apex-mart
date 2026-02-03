import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
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
    const existingCategory = await Category.findOne({
      slug: categoryData.slug,
    });
    if (existingCategory) {
      throw new AppError(
        "Category with this slug already exists",
        HTTP_STATUS.CONFLICT,
      );
    }

    // If parent category is specified, verify it exists
    if (categoryData.parentCategory) {
      const parentExists = await Category.findById(categoryData.parentCategory);
      if (!parentExists) {
        throw new AppError("Parent category not found", HTTP_STATUS.NOT_FOUND);
      }
    }

    const category = await Category.create(categoryData);

    // Populate parent if exists
    if (category.parentCategory) {
      await category.populate("parentCategory", "name slug level");
    }

    return category;
  }

  /**
   * Get all categories (flat list)
   */
  async getAllCategories(queryParams = {}) {
    const { parentCategory, level } = queryParams;

    const filter = { isActive: true };

    if (parentCategory !== undefined) {
      filter.parentCategory = parentCategory === "null" ? null : parentCategory;
    }

    if (level !== undefined) {
      filter.level = parseInt(level, 10);
    }

    const categories = await Category.find(filter)
      .populate("parentCategory", "name slug")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return categories;
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree() {
    const tree = await Category.getCategoryTree();
    return tree;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId) {
    const category = await Category.findById(categoryId)
      .populate("parentCategory", "name slug level")
      .lean();

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug })
      .populate("parentCategory", "name slug level")
      .lean();

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, updateData) {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    // If slug is being updated, check for duplicates
    if (updateData.slug && updateData.slug !== category.slug) {
      const existingCategory = await Category.findOne({
        slug: updateData.slug,
      });
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
        const parentExists = await Category.findById(updateData.parentCategory);
        if (!parentExists) {
          throw new AppError(
            "Parent category not found",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        // Check for circular reference
        if (updateData.parentCategory.toString() === categoryId.toString()) {
          throw new AppError(
            "A category cannot be its own parent",
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const isDescendant = await Category.isDescendantOf(
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
    Object.assign(category, updateData);
    await category.save();

    // Populate and return
    if (category.parentCategory) {
      await category.populate("parentCategory", "name slug level");
    }

    return category;
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId) {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: categoryId });
    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category with ${productCount} associated products. Please reassign or delete products first.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({
      parentCategory: categoryId,
    });
    if (subcategoryCount > 0) {
      throw new AppError(
        `Cannot delete category with ${subcategoryCount} subcategories. Please delete or reassign subcategories first.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Soft delete
    category.isActive = false;
    await category.save();

    return category;
  }

  /**
   * Get subcategories of a category
   */
  async getSubcategories(categoryId) {
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new AppError("Category not found", HTTP_STATUS.NOT_FOUND);
    }

    const subcategories = await Category.find({
      parentCategory: categoryId,
      isActive: true,
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return subcategories;
  }

  /**
   * Update product count for a category
   */
  async updateProductCount(categoryId) {
    const count = await Product.countDocuments({
      category: categoryId,
      isActive: true,
    });

    await Category.findByIdAndUpdate(categoryId, { productCount: count });

    return count;
  }
}

export default new CategoryService();
