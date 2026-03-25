const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prisma error - data tidak ditemukan
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Data tidak ditemukan" });
  }

  // Prisma error - unique constraint (email sudah ada, dll)
  if (err.code === "P2002") {
    return res.status(409).json({ message: "Data sudah ada" });
  }

  // JWT error - token tidak valid
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Token tidak valid" });
  }

  // JWT error - token expired
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token sudah kadaluarsa" });
  }

  // Default - server error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Terjadi kesalahan pada server";
  res.status(statusCode).json({ message });
};

module.exports = errorHandler;
