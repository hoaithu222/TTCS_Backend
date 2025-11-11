"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserAddressModel_1 = __importDefault(require("../../models/UserAddressModel"));
class AddressService {
    static async list(req) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        const items = await UserAddressModel_1.default.find({ userId }).sort({
            isDefault: -1,
            updatedAt: -1,
        });
        return { ok: true, items };
    }
    static async create(req, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        if (data.isDefault) {
            await UserAddressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        }
        const item = await UserAddressModel_1.default.create({ ...data, userId });
        return { ok: true, item };
    }
    static async update(req, id, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        if (data.isDefault) {
            await UserAddressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        }
        const item = await UserAddressModel_1.default.findOneAndUpdate({ _id: id, userId }, data, { new: true });
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "Địa chỉ không tồn tại",
            };
        return { ok: true, item };
    }
    static async delete(req, id) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        const item = await UserAddressModel_1.default.findOneAndDelete({ _id: id, userId });
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "Địa chỉ không tồn tại",
            };
        return { ok: true, item };
    }
    static async setDefault(req, id) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        await UserAddressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        const updated = await UserAddressModel_1.default.findOneAndUpdate({ _id: id, userId }, { $set: { isDefault: true } }, { new: true });
        if (!updated)
            return {
                ok: false,
                status: 404,
                message: "Địa chỉ không tồn tại",
            };
        const items = await UserAddressModel_1.default.find({ userId }).sort({
            isDefault: -1,
            updatedAt: -1,
        });
        return { ok: true, items };
    }
    static async getById(req, id) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        const item = await UserAddressModel_1.default.findOne({ _id: id, userId });
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "Địa chỉ không tồn tại",
            };
        return { ok: true, item };
    }
}
exports.default = AddressService;
