import axios from "axios";
import categoryRepository from "../repositories/category.repository.js";
import productRepository from "../repositories/product.repository.js";
import userRepository from "../repositories/user.repository.js";
import { hashPassword } from "../utils/auth.utils.js";
import { AppError } from "../middlewares/error.middleware.js";
import { HTTP_STATUS, PRODUCT_STATUS } from "../utils/constants.js";
import logger from "../utils/logger.js";
import prisma from "../config/prisma.js";

const DUMMYJSON_BASE_URL = "https://dummyjson.com";

/**
 * External Product Seeding Service
 * Handles ingestion of product and category data from DummyJSON
 */
class ExternalProductSeedService {
  /**
   * Normalize DummyJSON category name to match existing schema
   */
  normalizeCategory(categoryName) {
    return categoryName
      .trim()
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Generate slug from category name
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  }

  /**
   * Fetch categories from DummyJSON
   */
  async fetchExternalCategories() {
    try {
      logger.info("Fetching categories from DummyJSON");
      const response = await axios.get(
        `${DUMMYJSON_BASE_URL}/products/categories`,
      );
      return response.data;
    } catch (error) {
      logger.error("Error fetching categories from DummyJSON", error);
      throw new AppError(
        "Failed to fetch categories from external source",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch products from DummyJSON with pagination
   */
  async fetchExternalProducts(skip = 0, limit = 30) {
    try {
      const response = await axios.get(`${DUMMYJSON_BASE_URL}/products`, {
        params: { skip, limit },
      });
      return response.data;
    } catch (error) {
      logger.error("Error fetching products from DummyJSON", error);
      throw new AppError(
        "Failed to fetch products from external source",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Seed categories from DummyJSON
   */
  async seedCategories() {
    let categoriesCreated = 0;

    try {
      const externalCategories = await this.fetchExternalCategories();

      for (const categoryName of externalCategories) {
        const normalizedName = this.normalizeCategory(categoryName);
        const slug = this.generateSlug(normalizedName);

        // Check if category already exists
        const existingCategory = await categoryRepository.findBySlug(slug);

        if (!existingCategory) {
          await categoryRepository.create({
            name: normalizedName,
            slug,
            description: `${normalizedName} products`,
            level: 0,
            displayOrder: 0,
            isActive: true,
            productCount: 0,
          });

          categoriesCreated++;
          logger.info(`Created category: ${normalizedName}`);
        }
      }

      logger.info(`Seeding complete: ${categoriesCreated} categories created`);
      return categoriesCreated;
    } catch (error) {
      logger.error("Error seeding categories", error);
      throw error;
    }
  }

  /**
   * Build category mapping from DummyJSON categories to Prisma IDs
   */
  async buildCategoryMapping() {
    const mapping = {};
    const categories = await this.fetchExternalCategories();

    for (const categoryName of categories) {
      const normalizedName = this.normalizeCategory(categoryName);
      const slug = this.generateSlug(normalizedName);
      const category = await categoryRepository.findBySlug(slug);

      if (category) {
        mapping[categoryName] = category.id;
      }
    }

    return mapping;
  }

  /**
   * Get or create system admin user for seeded products
   */
  async getSystemUser() {
    const SYSTEM_EMAIL = "system@apexmart.local";
    let systemUser = await userRepository.findByEmail(SYSTEM_EMAIL);

    if (!systemUser) {
      const hashedPassword = await hashPassword("SystemAdminPassword123!");
      systemUser = await userRepository.create({
        name: "System Admin",
        email: SYSTEM_EMAIL,
        phone: "+1234567890",
        role: "ADMIN",
        hashedPassword,
      });
    }

    return systemUser;
  }

  /**
   * Normalize product data from DummyJSON
   */
  normalizeProduct(externalProduct, categoryId, systemUserId) {
    return {
      // Repo maps 'name' → Prisma 'title'
      name: externalProduct.title,
      description: externalProduct.description,
      price: externalProduct.price,
      stock: externalProduct.stock,
      images: (externalProduct.images || []).map((url, idx) => ({
        url,
        altText: externalProduct.title,
        sortOrder: idx,
      })),
      categoryId,
      sellerId: systemUserId,
      brand: externalProduct.brand || "",
      tags: externalProduct.tags || [],
      isActive: true,
    };
  }

  /**
   * Seed products from DummyJSON
   */
  async seedProducts() {
    let productsCreated = 0;
    let productsSkipped = 0;

    try {
      const categoryMapping = await this.buildCategoryMapping();
      const systemUser = await this.getSystemUser();

      let skip = 0;
      const limit = 30;
      let hasMore = true;

      while (hasMore) {
        const { products, total } = await this.fetchExternalProducts(
          skip,
          limit,
        );

        if (!products || products.length === 0) {
          hasMore = false;
          break;
        }

        for (const externalProduct of products) {
          const categoryId = categoryMapping[externalProduct.category];

          if (!categoryId) {
            logger.warn(
              `Skipping product: ${externalProduct.title} - category not found`,
            );
            productsSkipped++;
            continue;
          }

          // Check for duplicate using externalId field (stored in description as fallback or a dedicated field)
          // Since our Prisma schema doesn't have externalId, we check by title + categoryId
          const existingProduct = await prisma.product.findFirst({
            where: {
              title: externalProduct.title,
              categoryId: categoryId.toString(),
            },
            select: { id: true },
          });

          if (existingProduct) {
            logger.info(
              `Product already exists: ${externalProduct.title} (ID: ${externalProduct.id})`,
            );
            productsSkipped++;
            continue;
          }

          // Normalize product data
          const normalizedProduct = this.normalizeProduct(
            externalProduct,
            categoryId,
            systemUser.id,
          );

          // Validate before insertion
          if (
            !normalizedProduct.images ||
            normalizedProduct.images.length === 0
          ) {
            logger.warn(
              `Skipping product: ${externalProduct.title} - no valid images`,
            );
            productsSkipped++;
            continue;
          }

          try {
            const images = normalizedProduct.images;
            delete normalizedProduct.images;
            await productRepository.create(normalizedProduct, images);
            productsCreated++;
            logger.info(`Created product: ${externalProduct.title}`);
          } catch (insertError) {
            logger.error(
              `Error creating product: ${externalProduct.title}`,
              insertError,
            );
            productsSkipped++;
          }
        }

        skip += limit;
        hasMore = skip < total;
      }

      logger.info(
        `Product seeding complete: ${productsCreated} created, ${productsSkipped} skipped`,
      );
      return { productsCreated, productsSkipped };
    } catch (error) {
      logger.error("Error seeding products", error);
      throw error;
    }
  }

  /**
   * Main seed function - orchestrates category and product seeding
   */
  async seedAll() {
    try {
      const categoriesCreated = await this.seedCategories();
      const { productsCreated, productsSkipped } = await this.seedProducts();

      return {
        categoriesCreated,
        productsCreated,
        productsSkipped,
      };
    } catch (error) {
      logger.error("Error in seedAll", error);
      throw error;
    }
  }
}

export default new ExternalProductSeedService();
