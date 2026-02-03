import express from "express";
import * as cartController from "../controllers/cart.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", cartController.getCart);
router.post("/items", cartController.addItemToCart);
router.put("/items/:productId", cartController.updateItemQuantity);
router.delete("/items/:productId", cartController.removeItemFromCart);
router.delete("/", cartController.clearCart);
router.get("/validate", cartController.validateCart);

export default router;
