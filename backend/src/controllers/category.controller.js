import categoryService from "../services/category.service.js";
import CategoryDTO from "../dtos/category.dto.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HTTP_STATUS } from "../utils/constants.js";

/**
 * Category Controller - Thin layer handling HTTP requests/responses
 * All business logic is delegated to CategoryService
 */

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new category
 * @access  Private/Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  return ApiResponse.success(
    res,
    "Category created successfully",
    CategoryDTO.detailedCategoryResponse(category),
    HTTP_STATUS.CREATED,
  );
});

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories (flat list)
 * @access  Public
 */
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories(req.query);

  return ApiResponse.success(
    res,
    "Categories fetched successfully",
    CategoryDTO.categoryListResponse(categories),
  );
});

/**
 * @route   GET /api/v1/categories/tree
 * @desc    Get category tree (hierarchical structure)
 * @access  Public
 */
export const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getCategoryTree();

  return ApiResponse.success(
    res,
    "Category tree fetched successfully",
    CategoryDTO.categoryTreeArrayResponse(tree),
  );
});

/**
 * @route   GET /api/v1/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);

  return ApiResponse.success(
    res,
    "Category fetched successfully",
    CategoryDTO.detailedCategoryResponse(category),
  );
});

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  return ApiResponse.success(
    res,
    "Category fetched successfully",
    CategoryDTO.detailedCategoryResponse(category),
  );
});

/**
 * @route   GET /api/v1/categories/:id/subcategories
 * @desc    Get subcategories of a category
 * @access  Public
 */
export const getSubcategories = asyncHandler(async (req, res) => {
  const subcategories = await categoryService.getSubcategories(req.params.id);

  return ApiResponse.success(
    res,
    "Subcategories fetched successfully",
    CategoryDTO.categoryListResponse(subcategories),
  );
});

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update category
 * @access  Private/Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body,
  );

  return ApiResponse.success(
    res,
    "Category updated successfully",
    CategoryDTO.detailedCategoryResponse(category),
  );
});

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete category (soft delete)
 * @access  Private/Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);

  return ApiResponse.success(res, "Category deleted successfully");
});
