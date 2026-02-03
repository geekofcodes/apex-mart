import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    level: {
      type: Number,
      default: 0, // 0 for root, 1 for sub, etc.
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Static method to get hierarchical tree structure
 */
categorySchema.statics.getCategoryTree = async function () {
  const allCategories = await this.find({ isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  const buildTree = (categories, parentId = null) => {
    const tree = [];
    categories.forEach((cat) => {
      const catParentId = cat.parentCategory
        ? cat.parentCategory.toString()
        : null;
      const targetParentId = parentId ? parentId.toString() : null;

      if (catParentId === targetParentId) {
        const children = buildTree(categories, cat._id);
        const node = { ...cat };
        if (children.length > 0) {
          node.subcategories = children;
        }
        tree.push(node);
      }
    });
    return tree;
  };

  return buildTree(allCategories);
};

/**
 * Static method to check if a category is a descendant of another
 */
categorySchema.statics.isDescendantOf = async function (
  childId,
  potentialParentId,
) {
  let current = await this.findById(childId);
  while (current && current.parentCategory) {
    if (current.parentCategory.toString() === potentialParentId.toString()) {
      return true;
    }
    current = await this.findById(current.parentCategory);
  }
  return false;
};

const Category = mongoose.model("Category", categorySchema);

export default Category;
