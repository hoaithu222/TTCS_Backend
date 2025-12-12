"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddressByIdController = exports.setDefaultAddressController = exports.deleteAddressController = exports.updateAddressController = exports.createAddressController = exports.listAddressesController = void 0;
const address_service_1 = __importDefault(require("./address.service"));
const response_util_1 = require("../../shared/utils/response.util");
const listAddressesController = async (req, res) => {
    const result = await address_service_1.default.list(req);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items);
};
exports.listAddressesController = listAddressesController;
const createAddressController = async (req, res) => {
    const result = await address_service_1.default.create(req, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.item);
};
exports.createAddressController = createAddressController;
const updateAddressController = async (req, res) => {
    const { id } = req.params;
    const result = await address_service_1.default.update(req, id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.updateAddressController = updateAddressController;
const deleteAddressController = async (req, res) => {
    const { id } = req.params;
    const result = await address_service_1.default.delete(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.deleteAddressController = deleteAddressController;
const setDefaultAddressController = async (req, res) => {
    const { id } = req.params;
    const result = await address_service_1.default.setDefault(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items, "Đã đặt địa chỉ mặc định thành công");
};
exports.setDefaultAddressController = setDefaultAddressController;
const getAddressByIdController = async (req, res) => {
    const { id } = req.params;
    const result = await address_service_1.default.getById(req, id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.getAddressByIdController = getAddressByIdController;
