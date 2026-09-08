const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { authEnabled } = require("../config");
const {
  handleValidation,
  registerRules,
  loginRules,
  verifyRules,
  resendRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require("../middleware/validators");

function accountsEnabled(req, res, next) {
  if (authEnabled) return next();
  return res.status(403).json({ error: "Accounts are disabled on this demo." });
}

router.post("/register", accountsEnabled, registerRules, handleValidation, authController.register);
router.post("/verify", accountsEnabled, verifyRules, handleValidation, authController.verifyEmail);
router.post("/resend-code", accountsEnabled, resendRules, handleValidation, authController.resendCode);
router.post("/login", accountsEnabled, loginRules, handleValidation, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", accountsEnabled, forgotPasswordRules, handleValidation, authController.requestPasswordReset);
router.post("/reset-password", accountsEnabled, resetPasswordRules, handleValidation, authController.resetPassword);
router.get("/me", requireAuth, authController.me);

module.exports = router;