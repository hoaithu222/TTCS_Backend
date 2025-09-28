"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = exports.swaggerUi = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
exports.swaggerUi = swagger_ui_express_1.default;
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "BTL API",
            version: "1.0.0",
            description: "API documentation for BTL",
            contact: {
                name: "API Support",
                email: "thu601925@gmail.com",
            },
        },
        servers: [
            {
                url: `${process.env.SWAGGER_BASE_URL ||
                    `http://localhost:${process.env.PORT || 3000}`}${process.env.API_PREFIX || "/api/v1"}`,
                description: "API server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        "./src/routes/*.ts",
        "./src/features/**/*.ts",
        "./dist/routes/*.js",
        "./dist/features/**/*.js",
    ],
};
const specs = (0, swagger_jsdoc_1.default)(options);
exports.specs = specs;
