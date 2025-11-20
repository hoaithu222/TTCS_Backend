// Database configurations
export const postgresConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "mylove_db",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD ?? "",
  dialect: "postgres" as const,
  logging: process.env.NODE_ENV === "development",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export const mongoConfig = {
  uri: process.env.MONGODB_URI || "mongodb+srv://thu601925_db_user:m7EyEOeLez1YIk0Q@cluster0.ayg2z2y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  options: {
    // Mongoose v8+ defaults
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
};

export const redisConfig = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
};
