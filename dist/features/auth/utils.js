"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generatedOtp = () => {
    return Math.floor(Math.random() * 900000) + 100000; // 100000 - 999999
};
exports.default = generatedOtp;
