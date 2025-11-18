"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileController = exports.getProfileController = void 0;
const response_util_1 = require("../../shared/utils/response.util");
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const shop_service_1 = __importDefault(require("../shop/shop.service"));
const getProfileController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser)
        return response_util_1.ResponseUtil.unauthorized(res);
    // Lấy shop status của user
    const shopStatusResult = await shop_service_1.default.getShopStatusByUserId(currentUser._id || currentUser.id);
    if (shopStatusResult.ok) {
        return response_util_1.ResponseUtil.success(res, {
            ...currentUser,
            shopStatus: shopStatusResult.shopStatus,
            shop: shopStatusResult.shop,
        });
    }
    return response_util_1.ResponseUtil.success(res, {
        ...currentUser,
        shopStatus: "not_registered",
        shop: null,
    });
};
exports.getProfileController = getProfileController;
const updateProfileController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser)
        return response_util_1.ResponseUtil.unauthorized(res);
    const { name, fullName, phone, avatar } = req.body;
    const updateData = {};
    if (typeof name === "string")
        updateData.name = name;
    if (typeof fullName === "string")
        updateData.fullName = fullName;
    if (typeof phone === "string")
        updateData.phone = phone;
    if (typeof avatar === "string")
        updateData.avatar = avatar;
    try {
        const updated = await UserModel_1.default.findByIdAndUpdate(currentUser._id, updateData, {
            new: true,
        });
        if (!updated)
            return response_util_1.ResponseUtil.badRequest(res, "User không tồn tại");
        return response_util_1.ResponseUtil.success(res, updated, "Cập nhật hồ sơ thành công");
    }
    catch (e) {
        return response_util_1.ResponseUtil.error(res, e.message, 400);
    }
};
exports.updateProfileController = updateProfileController;
