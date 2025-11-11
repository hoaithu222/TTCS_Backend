import { Router } from "express";
import healthRoutes from "./health";
import authRoutes from "./auth";
import socialRoutes from "./auth/social";
import otpRoutes from "./otp";
import usersRoutes from "./users";
import categoryRoutes from "./category";
import subCategoryRoutes from "./sub-category";
import productRoutes from "./product";
import productAttributeRoutes from "./product-attribute";
import attributeTypeRoutes from "./attribute-type";
import attributeValueRoutes from "./attribute-value";
import imageRoutes from "./image";
import shopRoutes from "./shop";
import analyticsRoutes from "./analytics";
import ordersRoutes from "./orders";
import cartRoutes from "./cart";
import addressRoutes from "./address";
import reviewsRoutes from "./reviews";
import homeRoutes from "./home";
const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: Health
 *   - name: Auth
 *   - name: Categories
 *   - name: Sub Categories
 *   - name: Products
 *   - name: Product Attributes
 *   - name: Attribute Types
 *   - name: Attribute Values
 *   - name: Images
 *   - name: Shops
 *   - name: Analytics
 *   - name: Orders
 *   - name: Cart
 *   - name: Addresses
 *   - name: Reviews
 *   - name: Home
 */

// Mount feature routes
router.use("/health", healthRoutes);
router.use("/", authRoutes);
router.use("/auth/social", socialRoutes);
router.use("/otp", otpRoutes);
router.use("/users", usersRoutes);
router.use("/category", categoryRoutes);
router.use("/sub-category", subCategoryRoutes);
router.use("/products", productRoutes);
router.use("/product-attributes", productAttributeRoutes);
router.use("/attribute-types", attributeTypeRoutes);
router.use("/attribute-values", attributeValueRoutes);
router.use("/images", imageRoutes);
router.use("/shops", shopRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/orders", ordersRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/home", homeRoutes);
export default router;
