import prisma from "../config/prisma.js";
import { PRODUCT_STATUS } from "../utils/constants.js";

/**
 * Product Repository — all DB access for products.
 *
 * Field-name contract (Prisma ↔ external DTO):
 *   Prisma `title`         ↔  DTO `name`
 *   Prisma `id`            ↔  DTO `_id` (also exposed as `id`)
 *   Prisma `sellerId`      ↔  input `seller` | `sellerId`
 *   Prisma `categoryId`    ↔  input `category` | `categoryId`
 *   Prisma `images[].imageUrl` ↔  DTO `images[].url`
 *
 * Status is derived at read time from (isActive + stock) — no DB column.
 */
class ProductRepository {
  // ─── Private include shapes ──────────────────────────────────────────────

  /** Relations loaded for list endpoints (lean — no heavy sub-relations) */
  #listInclude = {
    category: { select: { id: true, name: true, slug: true } },
    seller: { select: { id: true, name: true, email: true } },
    images: {
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        imageUrl: true,
        publicId: true,
        altText: true,
        sortOrder: true,
      },
    },
  };

  /** Relations loaded for detail / write endpoints */
  #detailInclude = {
    category: {
      select: { id: true, name: true, slug: true, description: true },
    },
    seller: { select: { id: true, name: true, email: true, phone: true } },
    images: {
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        imageUrl: true,
        publicId: true,
        altText: true,
        sortOrder: true,
      },
    },
  };

  // ─── Private helpers ─────────────────────────────────────────────────────

  /** Derive status string from isActive + stock */
  #deriveStatus(product) {
    if (!product.isActive) return PRODUCT_STATUS.DISCONTINUED;
    if (product.stock === 0) return PRODUCT_STATUS.OUT_OF_STOCK;
    return PRODUCT_STATUS.ACTIVE;
  }

  /**
   * Normalise a raw Prisma product row → DTO-compatible shape.
   * All callers receive this normalised form.
   */
  #normalise(p) {
    if (!p) return null;

    const finalPrice = p.discountPrice ?? p.price;
    const discountPercentage =
      p.discountPrice != null && p.price > 0
        ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
        : 0;

    return {
      // Identity
      id: p.id,

      // Core fields
      name: p.title, // DTOs expect 'name'
      slug: p.slug,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice ?? null,
      finalPrice,
      discountPercentage,

      // Stock
      stock: p.stock,
      inStock: p.stock > 0,

      // Extra attributes
      brand: p.brand ?? null,
      sku: p.sku ?? null,
      specifications: p.specifications ?? {},
      tags: p.tags ?? [],

      // Derived / computed
      status: this.#deriveStatus(p),
      isActive: p.isActive,
      isFeatured: p.isFeatured,

      // Stats
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      totalSales: p.totalSales,

      category: p.category
        ? {
            id: p.category.id,
            name: p.category.name,
            slug: p.category.slug,
            description: p.category.description ?? null,
          }
        : null,

      seller: p.seller
        ? {
            id: p.seller.id,
            name: p.seller.name,
            email: p.seller.email,
            phone: p.seller.phone ?? null,
          }
        : null,

      images: (p.images ?? []).map((img) => img.imageUrl),

      // Timestamps
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  // ─── Read operations ─────────────────────────────────────────────────────

  /**
   * Find product by primary key.
   * @param {string}  id
   * @param {boolean} withRelations - set false for lightweight existence checks
   */
  async findById(id, withRelations = true) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: withRelations ? this.#detailInclude : undefined,
    });
    return this.#normalise(product);
  }

  /**
   * Find product by URL slug.
   */
  async findBySlug(slug) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: this.#detailInclude,
    });
    return this.#normalise(product);
  }

  /**
   * Paginated product list with composable filters.
   *
   * All filter params are optional. When `isActive` is undefined the filter
   * is omitted entirely (admins can see inactive products).
   *
   * @param {object} opts
   * @param {string}  [opts.categoryId]
   * @param {string}  [opts.sellerId]
   * @param {string}  [opts.search]       - full-text across title/description/brand/tags
   * @param {number}  [opts.minPrice]
   * @param {number}  [opts.maxPrice]
   * @param {boolean} [opts.isActive]     - undefined = no restriction
   * @param {boolean} [opts.isFeatured]   - undefined = no restriction
   * @param {string}  [opts.sortBy]       - price | createdAt | averageRating | totalSales
   * @param {string}  [opts.sortOrder]    - asc | desc
   * @param {number}  [opts.skip]
   * @param {number}  [opts.limit]
   */
  async findMany({
    categoryId,
    sellerId,
    search,
    minPrice,
    maxPrice,
    isActive,
    isFeatured,
    sortBy = "createdAt",
    sortOrder = "desc",
    skip = 0,
    limit = 12,
  } = {}) {
    const where = {};

    // Only add isActive filter when a value is explicitly provided
    if (isActive !== undefined) where.isActive = isActive;

    // Indexed FK filters — use the DB column directly for index hit
    if (categoryId) where.categoryId = categoryId;
    if (sellerId) where.sellerId = sellerId;

    // Boolean filter (already parsed by service before reaching here)
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    // Price range — guard against NaN
    if (minPrice != null || maxPrice != null) {
      where.price = {};
      if (minPrice != null && !isNaN(minPrice))
        where.price.gte = Number(minPrice);
      if (maxPrice != null && !isNaN(maxPrice))
        where.price.lte = Number(maxPrice);
    }

    // Full-text search across indexed text columns
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    // Whitelist sortBy to prevent injection on ORDER BY
    const ALLOWED_SORTS = new Set([
      "price",
      "createdAt",
      "averageRating",
      "totalSales",
      "stock",
    ]);
    const orderField = ALLOWED_SORTS.has(sortBy) ? sortBy : "createdAt";
    const orderDir = sortOrder === "asc" ? "asc" : "desc";

    // Run count + data queries in parallel
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: this.#listInclude,
        orderBy: { [orderField]: orderDir },
        skip: Math.max(0, skip),
        take: Math.min(limit, 100), // hard cap at 100 rows per page
      }),
      prisma.product.count({ where }),
    ]);

    return { products: rows.map((p) => this.#normalise(p)), total };
  }

  /**
   * Raw count for use in admin dashboards / health checks.
   */
  async count(where = {}) {
    return prisma.product.count({ where });
  }

  // ─── Write operations ─────────────────────────────────────────────────────

  /**
   * Create a product with its images in one query (images via nested create).
   *
   * @param {object}  data   - product scalar fields (uses 'name' or 'title')
   * @param {Array}   images - [{ url, publicId?, altText?, sortOrder? }]
   */
  async create(data, images = []) {
    // Basic sanity — price and stock should be valid numbers at this point
    // (validation already done in service), but guard here as well.
    const product = await prisma.product.create({
      data: {
        title: data.name || data.title,
        slug: data.slug,
        description: data.description,
        price: Number(data.price),
        discountPrice:
          data.discountPrice != null ? Number(data.discountPrice) : null,
        stock: Math.max(0, parseInt(data.stock ?? 0, 10)),
        brand: data.brand ?? null,
        sku: data.sku ?? null,
        specifications: data.specifications ?? undefined,
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        sellerId: data.seller || data.sellerId,
        categoryId: data.category || data.categoryId,
        images: images.length
          ? {
              create: images.map((img, idx) => ({
                imageUrl: img.url || img.imageUrl,
                publicId: img.publicId ?? null,
                altText: img.altText ?? "",
                sortOrder: img.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: this.#detailInclude,
    });

    return this.#normalise(product);
  }

  /**
   * Partial update — only maps fields that are explicitly provided.
   * Prevents accidental nullification of untouched fields.
   */
  async update(id, data) {
    const updateData = {};

    // Title accepts either 'name' (DTO) or 'title' (Prisma)
    if (data.name !== undefined) updateData.title = data.name;
    if (data.title !== undefined) updateData.title = data.title;

    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.discountPrice !== undefined) {
      updateData.discountPrice =
        data.discountPrice != null ? Number(data.discountPrice) : null;
    }
    if (data.stock !== undefined) {
      updateData.stock = Math.max(0, parseInt(data.stock, 10));
    }
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.specifications !== undefined)
      updateData.specifications = data.specifications;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.averageRating !== undefined)
      updateData.averageRating = data.averageRating;
    if (data.totalReviews !== undefined)
      updateData.totalReviews = data.totalReviews;

    // Category FK — accept both forms
    if (data.category !== undefined) updateData.categoryId = data.category;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: this.#detailInclude,
    });

    return this.#normalise(product);
  }

  /**
   * Soft-delete — sets isActive = false, product stays in DB.
   */
  async softDelete(id) {
    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
      include: this.#detailInclude,
    });
    return this.#normalise(product);
  }

  /**
   * Update rating statistics (called after every review create/update/delete).
   */
  async updateRatingStats(id, { averageRating, totalReviews }) {
    await prisma.product.update({
      where: { id },
      data: { averageRating, totalReviews },
    });
  }

  // ─── Stock management ────────────────────────────────────────────────────

  /**
   * Adjust stock by a signed delta.
   * Designed for use inside `prisma.$transaction` — accepts an optional tx client.
   *
   * Example:  adjustStock(id, -2, tx)  → deduct 2 on order placement
   *           adjustStock(id, +2, tx)  → restore 2 on order cancel
   *
   * The DB-level `decrement` / `increment` is atomic, but callers must pass
   * a tx client to group this with other mutations.
   */
  async adjustStock(id, delta, tx = prisma) {
    return tx.product.update({
      where: { id },
      data: {
        stock:
          delta >= 0 ? { increment: delta } : { decrement: Math.abs(delta) },
      },
      select: { id: true, stock: true, title: true },
    });
  }

  // ─── Featured ─────────────────────────────────────────────────────────────

  async findFeatured(limit = 8) {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true, stock: { gt: 0 } },
      include: this.#listInclude,
      orderBy: [
        { averageRating: "desc" },
        { totalSales: "desc" },
        { createdAt: "desc" },
      ],
      take: Math.min(limit, 50),
    });
    return products.map((p) => this.#normalise(p));
  }
}

export default new ProductRepository();
