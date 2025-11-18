"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_1 = __importDefault(require("./health"));
const auth_1 = __importDefault(require("./auth"));
const social_1 = __importDefault(require("./auth/social"));
const otp_1 = __importDefault(require("./otp"));
const users_1 = __importDefault(require("./users"));
const category_1 = __importDefault(require("./category"));
const sub_category_1 = __importDefault(require("./sub-category"));
const product_1 = __importDefault(require("./product"));
const product_attribute_1 = __importDefault(require("./product-attribute"));
const attribute_type_1 = __importDefault(require("./attribute-type"));
const attribute_value_1 = __importDefault(require("./attribute-value"));
const image_1 = __importDefault(require("./image"));
const shop_1 = __importDefault(require("./shop"));
const shop_management_1 = __importDefault(require("./shop-management"));
const analytics_1 = __importDefault(require("./analytics"));
const orders_1 = __importDefault(require("./orders"));
const cart_1 = __importDefault(require("./cart"));
const address_1 = __importDefault(require("./address"));
const reviews_1 = __importDefault(require("./reviews"));
const home_1 = __importDefault(require("./home"));
const payment_1 = __importDefault(require("./payment"));
const admin_1 = __importDefault(require("./admin"));
const router = (0, express_1.Router)();
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
 *   - name: Payments
 */
// Mount feature routes
router.use("/health", health_1.default);
router.use("/", auth_1.default);
router.use("/auth/social", social_1.default);
router.use("/otp", otp_1.default);
router.use("/users", users_1.default);
router.use("/category", category_1.default);
router.use("/sub-category", sub_category_1.default);
router.use("/products", product_1.default);
router.use("/product-attributes", product_attribute_1.default);
router.use("/attribute-types", attribute_type_1.default);
router.use("/attribute-values", attribute_value_1.default);
router.use("/images", image_1.default);
// Đăng ký shopManagementRoutes trước shopRoutes để các route cụ thể như /my-shop được match trước route /:id
router.use("/shops", shop_management_1.default);
router.use("/shops", shop_1.default);
router.use("/analytics", analytics_1.default);
router.use("/orders", orders_1.default);
router.use("/cart", cart_1.default);
router.use("/addresses", address_1.default);
router.use("/reviews", reviews_1.default);
router.use("/home", home_1.default);
router.use("/payments", payment_1.default);
router.use("/admin", admin_1.default);
exports.default = router;
