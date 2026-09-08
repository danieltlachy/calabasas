const authEnabled =
  process.env.AUTH_ENABLED === "true" || process.env.NODE_ENV !== "production";

module.exports = { authEnabled };