const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { registrationEnabled } = require("../config");
const {
  handleValidation,
  registerRules,
  loginRules,
  verifyRules,
  resendRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require("../middleware/validators");

function accountsOpen(req, res, next) {
  if (registrationEnabled) return next();
  return res.status(403).json({ error: "Account registration is disabled on this demo." });
}

router.post("/register", accountsOpen, registerRules, handleValidation, authController.register);
router.post("/verify", accountsOpen, verifyRules, handleValidation, authController.verifyEmail);
router.post("/resend-code", accountsOpen, resendRules, handleValidation, authController.resendCode);
router.post("/login", loginRules, handleValidation, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", accountsOpen, forgotPasswordRules, handleValidation, authController.requestPasswordReset);
router.post("/reset-password", accountsOpen, resetPasswordRules, handleValidation, authController.resetPassword);
router.get("/me", requireAuth, authController.me);

module.exports = router;