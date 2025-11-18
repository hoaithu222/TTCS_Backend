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
        // normalize incoming shapes from various clients
        const normalizedAddressDetail = data.addressDetail ||
            data.address ||
            data.address_line1 ||
            "";
        const normalizedWard = data.ward || data.ward || "";
        const normalizedData = {
            name: data.recipient_name || data.name,
            phone: data.phone,
            addressDetail: normalizedAddressDetail,
            address: data.address || `${data.address_line2 || ""} ${data.address_line1 || ""}`.trim() || normalizedAddressDetail,
            district: data.district,
            city: data.city,
            ward: normalizedWard,
            isDefault: Boolean(data.is_default ?? data.isDefault),
        };
        if (normalizedData.isDefault) {
            await UserAddressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        }
        const item = await UserAddressModel_1.default.create({ ...normalizedData, userId });
        return { ok: true, item };
    }
    static async update(req, id, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        const normalized = { ...data };
        if (data.is_default !== undefined) {
            normalized.isDefault = Boolean(data.is_default);
        }
        if (data.recipient_name)
            normalized.name = data.recipient_name;
        if (data.address_line1 || data.address_line2) {
            const addr = `${data.address_line2 || ""} ${data.address_line1 || ""}`.trim();
            normalized.address = addr;
            normalized.addressDetail = data.address_line1 || addr;
        }
        if (normalized.isDefault) {
            await UserAddressModel_1.default.updateMany({ userId }, { $set: { isDefault: false } });
        }
        const item = await UserAddressModel_1.default.findOneAndUpdate({ _id: id, userId }, normalized, { new: true });
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
