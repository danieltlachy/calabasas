const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const {
  handleValidation,
  registerRules,
  loginRules,
  verifyRules,
  resendRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require("../middleware/validators");

router.post("/register", registerRules, handleValidation, authController.register);
router.post("/verify", verifyRules, handleValidation, authController.verifyEmail);
router.post("/resend-code", resendRules, handleValidation, authController.resendCode);
router.post("/login", loginRules, handleValidation, authController.login);
router.post("/logout", authController.logout);
router.post("/forgot-password", forgotPasswordRules, handleValidation, authController.requestPasswordReset);
router.post("/reset-password", resetPasswordRules, handleValidation, authController.resetPassword);
router.get("/me", requireAuth, authController.me);

module.exports = router;