const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const paymentController = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/auth");
const {
  handleValidation,
  updateProfileRules,
  addressRules,
  savePaymentMethodRules,
} = require("../middleware/validators");

router.use(requireAuth);

router.get("/me", userController.getProfile);
router.patch("/me", updateProfileRules, handleValidation, userController.updateProfile);
router.get("/me/addresses", userController.listAddresses);
router.post("/me/addresses", addressRules, handleValidation, userController.createAddress);
router.patch("/me/addresses/:id", addressRules, handleValidation, userController.updateAddress);
router.delete("/me/addresses/:id", userController.deleteAddress);
router.post("/me/addresses/:id/primary", userController.setPrimaryAddress);
router.get("/me/payment-methods", paymentController.listPaymentMethods);
router.post(
  "/me/payment-methods",
  savePaymentMethodRules,
  handleValidation,
  paymentController.savePaymentMethod
);
router.delete(
  "/me/payment-methods/:id",
  paymentController.removePaymentMethod
);
router.post(
  "/me/payment-methods/:id/primary",
  paymentController.setPrimaryPaymentMethod
);

module.exports = router;