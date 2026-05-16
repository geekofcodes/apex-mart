import prisma from "../config/prisma.js";

/**
 * Category Repository — all DB access for the categories table.
 */
class CategoryRepository {
  #normalise(cat) {
    if (!cat) return null;
    const { id, parentId, parent, children, ...rest } = cat;
    return {
      id: id,
      id,
      ...rest,
      parentCategory: parent
        ? {
            id: parent.id,
            id: parent.id,
            name: parent.name,
            slug: parent.slug,
            level: parent.level,
          }
        : null,
      ...(children !== undefined
        ? { subcategories: children.map((c) => this.#normalise(c)) }
        : {}),
    };
  }

  async findById(id) {
    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, slug: true, level: true } },
      },
    });
    return this.#normalise(cat);
  }

  async findBySlug(slug) {
    const cat = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true, level: true } },
      },
    });
    return this.#normalise(cat);
  }

  /**
   * Flat list of categories with optional filters.
   * @param {{ parentId?: string|null, level?: number, isActive?: boolean }} filter
   */
  async findMany({ parentId, level, isActive = true } = {}) {
    const where = { isActive };
    if (parentId !== undefined)
      where.parentId = parentId === "null" ? null : parentId;
    if (level !== undefined) where.level = Number(level);

    const cats = await prisma.category.findMany({
      where,
      include: { parent: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return cats.map((c) => this.#normalise(c));
  }

  /**
   * Build and return the full category tree.
   */
  async getTree() {
    const all = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
    return this.#buildTree(all, null);
  }

  #buildTree(categories, parentId) {
    return categories
      .filter((c) => (c.parentId ?? null) === parentId)
      .map((c) => {
        const children = this.#buildTree(categories, c.id);
        const node = this.#normalise(c);
        if (children.length > 0) node.subcategories = children;
        return node;
      });
  }

  async create(data) {
    const cat = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        level: data.level ?? 0,
        displayOrder: data.displayOrder ?? 0,
        parentId: data.parentCategory || null,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true, level: true } },
      },
    });
    return this.#normalise(cat);
  }

  async update(id, data) {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;
    if (data.parentCategory !== undefined)
      updateData.parentId = data.parentCategory || null;

    const cat = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true, slug: true, level: true } },
      },
    });
    return this.#normalise(cat);
  }

  /** Soft delete */
  async softDelete(id) {
    const cat = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return this.#normalise(cat);
  }

  async countProducts(categoryId) {
    return prisma.product.count({ where: { categoryId, isActive: true } });
  }

  async countSubcategories(parentId) {
    return prisma.category.count({ where: { parentId, isActive: true } });
  }

  async updateProductCount(categoryId) {
    const count = await this.countProducts(categoryId);
    await prisma.category.update({
      where: { id: categoryId },
      data: { productCount: count },
    });
    return count;
  }

  /**
   * Walk parent chain to check if childId is a descendant of potentialParentId.
   * Replaces the Mongoose static isDescendantOf.
   */
  async isDescendantOf(childId, potentialParentId) {
    let current = await prisma.category.findUnique({
      where: { id: childId },
      select: { parentId: true },
    });
    while (current && current.parentId) {
      if (current.parentId === potentialParentId) return true;
      current = await prisma.category.findUnique({
        where: { id: current.parentId },
        select: { parentId: true },
      });
    }
    return false;
  }
}

export default new CategoryRepository();
