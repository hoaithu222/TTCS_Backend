"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartSchema = exports.CartStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
//   id         Int        @id @default(autoincrement())
//   user_id    Int
//   status     CartStatus @default(ACTIVE)
//   created_at DateTime   @default(now())
//   updated_at DateTime   @updatedAt
//   cart_items CartItem[]
var CartStatus;
(function (CartStatus) {
    CartStatus["ACTIVE"] = "ACTIVE";
    CartStatus["COMPLETED"] = "COMPLETED";
    CartStatus["ABANDONED"] = "ABANDONED";
})(CartStatus || (exports.CartStatus = CartStatus = {}));
exports.cartSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cartItems: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "CartItem",
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(CartStatus),
        required: true,
        default: CartStatus.ACTIVE,
    },
}, { timestamps: true });
const CartModel = mongoose_1.default.model("Cart", exports.cartSchema);
exports.default = CartModel;
