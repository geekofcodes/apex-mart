import app from "./app.js";
import envConfig from "./config/env.config.js";
import connectDB from "./config/db.config.js";
import { configureCloudinary } from "./config/cloud.config.js";
import logger from "./utils/logger.js";

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Configure Cloudinary
    configureCloudinary();

    // Start server
    const PORT = envConfig.port;
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${envConfig.nodeEnv} mode on port ${PORT}`,
      );
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      logger.error("Unhandled Promise Rejection:", err);
      gracefulShutdown("unhandledRejection");
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception:", err);
      gracefulShutdown("uncaughtException");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
