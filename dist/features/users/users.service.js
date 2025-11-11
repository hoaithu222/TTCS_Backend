"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserModel_1 = __importDefault(require("../../models/UserModel"));
class UsersService {
    // lấy thông tin user
    static async getUser(id) {
        const user = await UserModel_1.default.findById(id);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
    // cập nhật thông tin user
    static async updateUser(id, data) {
        const user = await UserModel_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
    // xóa user
    static async deleteUser(id) {
        const user = await UserModel_1.default.findByIdAndDelete(id);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
    // lấy danh sách user
    static async getUsers() {
        const users = await UserModel_1.default.find();
        return { ok: true, users };
    }
}
exports.default = UsersService;
