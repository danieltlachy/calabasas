const registrationEnabled =
  process.env.REGISTRATION_ENABLED === "true" || process.env.NODE_ENV !== "production";

module.exports = { registrationEnabled };