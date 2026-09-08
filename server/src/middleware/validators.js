const { body, validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  return next();
}

const registerRules = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().withMessage("Enter a valid email address"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email").isEmail().withMessage("Enter a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

const verifyRules = [
  body("email").isEmail().withMessage("Enter a valid email address"),
  body("code").matches(/^\d{6}$/).withMessage("Verification code must be 6 digits"),
];

const resendRules = [body("email").isEmail().withMessage("Enter a valid email address")];

const forgotPasswordRules = [body("email").isEmail().withMessage("Enter a valid email address")];

const resetPasswordRules = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const updateProfileRules = [
  body("name").optional({ values: "falsy" }).trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Enter a valid email address"),
];

const addressRules = [
  body("street").trim().isLength({ min: 2, max: 120 }).withMessage("Enter a valid street address"),
  body("neighborhood").trim().isLength({ min: 2, max: 120 }).withMessage("Enter a valid neighborhood"),
  body("zipCode").trim().isLength({ min: 3, max: 10 }).matches(/^\d+$/).withMessage("ZIP code must contain only numbers"),
  body("landmarks").optional({ values: "falsy" }).trim().isLength({ max: 200 }).withMessage("Landmarks is too long"),
];

const savePaymentMethodRules = [
  body("stripePaymentMethodId").isString().notEmpty().withMessage("Card token is required"),
];

const orderRules = [
  body("customer.name").trim().isLength({ min: 2, max: 50 }).withMessage("Enter a valid name"),
  body("customer.email").isEmail().withMessage("Enter a valid email address"),
  body("customer.street").trim().isLength({ min: 2, max: 120 }).withMessage("Enter a valid street address"),
  body("customer.neighborhood").trim().isLength({ min: 2, max: 120 }).withMessage("Enter a valid neighborhood"),
  body("customer.zipCode").trim().isLength({ min: 3, max: 10 }).matches(/^\d+$/).withMessage("ZIP code must contain only numbers"),
  body("customer.landmarks").optional({ values: "falsy" }).trim().isLength({ max: 200 }),
  body("items").isArray({ min: 1 }).withMessage("Your cart is empty"),
  body("items.*.id").isString().notEmpty().withMessage("Invalid item"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Invalid quantity"),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  verifyRules,
  resendRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateProfileRules,
  addressRules,
  savePaymentMethodRules,
  orderRules,
};