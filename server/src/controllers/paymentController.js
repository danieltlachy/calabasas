const prisma = require("../db");
const stripeService = require("../services/stripeService");

async function listPaymentMethods(req, res, next) {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "asc" },
    });
    return res.json(
      methods.map((m) => ({
        id: m.id,
        brand: m.brand,
        last4: m.last4,
        isPrimary: m.isPrimary,
      }))
    );
  } catch (error) {
    return next(error);
  }
}

async function savePaymentMethod(req, res, next) {
  try {
    const { stripePaymentMethodId } = req.body;
    if (!stripePaymentMethodId) {
      return res.status(400).json({ error: "Card token is required" });
    }

    const record = await stripeService.savePaymentMethod(
      req.user,
      stripePaymentMethodId
    );

    return res.status(201).json({
      id: record.id,
      brand: record.brand,
      last4: record.last4,
      isPrimary: record.isPrimary,
    });
  } catch (error) {
    return next(error);
  }
}

async function removePaymentMethod(req, res, next) {
  try {
    const record = await stripeService.removePaymentMethod(
      req.user.id,
      req.params.id
    );
    if (!record) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    return res.json({ message: "Card removed." });
  } catch (error) {
    return next(error);
  }
}

async function setPrimaryPaymentMethod(req, res, next) {
  try {
    const method = await prisma.paymentMethod.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!method) {
      return res.status(404).json({ error: "Payment method not found" });
    }

    await prisma.$transaction([
      prisma.paymentMethod.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false },
      }),
      prisma.paymentMethod.update({
        where: { id: method.id },
        data: { isPrimary: true },
      }),
    ]);

    return res.json({ message: "Primary card updated." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listPaymentMethods,
  savePaymentMethod,
  removePaymentMethod,
  setPrimaryPaymentMethod,
};