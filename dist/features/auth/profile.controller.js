"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileController = void 0;
const response_util_1 = require("../../shared/utils/response.util");
const getProfileController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser)
        return response_util_1.ResponseUtil.unauthorized(res);
    return response_util_1.ResponseUtil.success(res, { user: currentUser });
};
exports.getProfileController = getProfileController;
