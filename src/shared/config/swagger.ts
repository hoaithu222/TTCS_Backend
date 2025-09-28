import swaggerUi from "swagger-ui-express";
import swaggerJsdoc, { Options } from "swagger-jsdoc";
import { env } from "./env.config";

const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BTL API",
      version: "1.0.0",
      description: "API documentation for BTL",
    },
    servers: [{ url: env.API_PREFIX }],
  },
  apis: ["./src/routes/*.ts", "./src/features/**/*.ts"],
};

export const specs = swaggerJsdoc(swaggerOptions);

export const swaggerUiOptions = {
  explorer: true,
};

export { swaggerUi };
