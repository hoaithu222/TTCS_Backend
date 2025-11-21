"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = exports.mongoConfig = exports.postgresConfig = void 0;
// Database configurations
exports.postgresConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "mylove_db",
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD ?? "",
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};
exports.mongoConfig = {
    uri: process.env.MONGODB_URI || "",
    options: {
        // Mongoose v8+ defaults
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    },
};
exports.redisConfig = {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
};
