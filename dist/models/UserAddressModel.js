"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAddressSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.userAddressSchema = new mongoose_1.default.Schema({
    // user id
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // name
    name: {
        type: String,
        required: true,
    },
    // phone
    phone: {
        type: String,
        required: true,
    },
    // address
    addressDetail: {
        type: String,
        required: true,
    },
    // normalized address string (optional mirror for clients)
    address: {
        type: String,
    },
    // Tỉnh
    city: {
        type: String,
        required: true,
    },
    // xã/phường
    district: {
        type: String,
        required: true,
    },
    // ward/phường (optional for legacy)
    ward: {
        type: String,
    },
    // isDefault
    isDefault: {
        type: Boolean,
        default: false,
    },
});
const UserAddressModel = mongoose_1.default.model("UserAddress", exports.userAddressSchema);
exports.default = UserAddressModel;
