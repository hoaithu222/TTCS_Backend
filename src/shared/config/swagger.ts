import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const resolveBaseUrl = () => {
  const raw =
    process.env.SWAGGER_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `http://${raw}`;
};

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
    // Use a relative server URL so Swagger UI calls the same origin as it is served from
    servers: [
      {
        url: `${process.env.API_PREFIX || "/api/v1"}`,
        description: "Current origin",
      },
      {
        url: `${resolveBaseUrl()}${process.env.API_PREFIX || "/api/v1"}`,
        description: "Explicit host (fallback)",
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

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
