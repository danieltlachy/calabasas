const prisma = require("../db");
const stripeService = require("../services/stripeService");

const STATUS_LABELS = {
  pending: "Pending",
  in_transit: "In transit",
  delivered: "Delivered",
};

function buildReference() {
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `FYC-${time}-${rand}`;
}

function serializeOrder(order) {
  return {
    ...order,
    total: Number(order.total),
    statusLabel: STATUS_LABELS[order.status] || order.status,
    items: order.items.map((item) => ({
      ...item,
      price: Number(item.price),
    })),
  };
}

async function createOrder(req, res, next) {
  try {
    const { items, customer, paymentMethodId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Your cart is empty" });
    }
    const required = ["name", "email", "street", "neighborhood", "zipCode"];
    for (const field of required) {
      if (!customer?.[field]?.trim()) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((item) => item.id) } },
    });
    if (products.length !== items.length) {
      return res.status(400).json({ error: "One or more products no longer exist" });
    }
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      const product = productMap.get(item.id);
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${product.name}` });
      }
    }

    const total = items.reduce(
      (sum, item) => sum + productMap.get(item.id).price * item.quantity,
      0
    );

    if (paymentMethodId) {
      if (!req.user) {
        return res.status(400).json({ error: "Log in to pay by card" });
      }
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { id: paymentMethodId, userId: req.user.id },
      });
      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      try {
        await stripeService.chargeSavedCard(
          paymentMethod.stripeCustomerId,
          Math.round(total * 100),
          paymentMethod.stripePaymentMethodId
        );
      } catch (error) {
        return res.status(402).json({ error: error.message });
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          reference: buildReference(),
          userId: req.user?.id || null,
          customerName: customer.name,
          email: customer.email,
          street: customer.street,
          neighborhood: customer.neighborhood,
          zipCode: customer.zipCode,
          landmarks: customer.landmarks || null,
          total,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.id);
              return {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return res.status(201).json(serializeOrder(order));
  } catch (error) {
    return next(error);
  }
}

async function getOrderByReference(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { reference: req.params.reference },
      include: { items: true },
    });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    return res.json(serializeOrder(order));
  } catch (error) {
    return next(error);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders.map(serializeOrder));
  } catch (error) {
    return next(error);
  }
}

module.exports = { createOrder, getOrderByReference, getMyOrders };