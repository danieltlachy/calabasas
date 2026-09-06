const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/optionalAuth");
const { handleValidation, orderRules } = require("../middleware/validators");

router.post("/", orderRules, handleValidation, optionalAuth, orderController.createOrder);
router.get("/ref/:reference", orderController.getOrderByReference);
router.get("/mine", requireAuth, orderController.getMyOrders);

module.exports = router;