"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerUi = exports.swaggerUiOptions = exports.specs = void 0;
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_config_1 = require("./env.config");
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "BTL API",
            version: "1.0.0",
            description: "API documentation for BTL",
        },
        servers: [{ url: env_config_1.env.API_PREFIX }],
    },
    apis: ["./src/routes/*.ts", "./src/features/**/*.ts"],
};
exports.specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
exports.swaggerUiOptions = {
    explorer: true,
};
