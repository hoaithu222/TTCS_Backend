"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
class Jwt {
    static generateAccessToken(payload) {
        const secret = env_config_1.env.JWT_SECRET;
        const options = {
            expiresIn: env_config_1.env.JWT_EXPIRES_IN,
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    static generateRefreshToken() {
        const payload = {
            value: Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15),
        };
        const secret = env_config_1.env.JWT_SECRET;
        const options = {
            expiresIn: env_config_1.env.JWT_EXPIRES_IN,
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    static verifyAccessToken(token) {
        try {
            const secret = env_config_1.env.JWT_SECRET;
            return jsonwebtoken_1.default.verify(token, secret);
        }
        catch (error) {
            throw new Error("Invalid token");
        }
    }
}
exports.default = Jwt;
