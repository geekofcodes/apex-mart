import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Calculate totals before saving
 */
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  this.totalAmount = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  next();
});

/**
 * Cart instance methods
 */
cartSchema.methods.getItem = function (productId) {
  return this.items.find(
    (item) =>
      item.product?._id?.toString() === productId.toString() ||
      item.product?.toString() === productId.toString(),
  );
};

cartSchema.methods.hasProduct = function (productId) {
  return this.items.some(
    (item) =>
      item.product?._id?.toString() === productId.toString() ||
      item.product?.toString() === productId.toString(),
  );
};

cartSchema.methods.addItem = function (productId, quantity, price) {
  const existingItem = this.getItem(productId);

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price;
  } else {
    this.items.push({ product: productId, quantity, price });
  }
};

cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const item = this.getItem(productId);
  if (item) {
    item.quantity = quantity;
  }
};

cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter(
    (item) =>
      item.product?._id?.toString() !== productId.toString() &&
      item.product?.toString() !== productId.toString(),
  );
};

cartSchema.methods.clearCart = function () {
  this.items = [];
};

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
