const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

redis.on("connect", () => {
  console.log("Berhasil konek ke Redis!");
});

redis.on("error", (err) => {
  console.log("Redis error:", err.message);
});

module.exports = redis;
