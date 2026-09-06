const Stripe = require("stripe");
const prisma = require("../db");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getOrCreateCustomer(user) {
  const existing = await prisma.paymentMethod.findFirst({
    where: { userId: user.id },
    select: { stripeCustomerId: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }
  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: { userId: user.id },
  });
  return customer.id;
}

async function savePaymentMethod(user, stripePaymentMethodId) {
  const customerId = await getOrCreateCustomer(user);

  await stripe.paymentMethods.attach(stripePaymentMethodId, {
    customer: customerId,
  });
  const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

  const anySaved = await prisma.paymentMethod.findFirst({
    where: { userId: user.id },
  });

  const record = await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripePaymentMethodId,
      last4: pm.card.last4,
      brand: pm.card.brand,
      isPrimary: !anySaved,
    },
  });
  return record;
}

async function removePaymentMethod(userId, recordId) {
  const record = await prisma.paymentMethod.findFirst({
    where: { id: recordId, userId },
  });
  if (!record) return null;

  try {
    await stripe.paymentMethods.detach(record.stripePaymentMethodId);
  } catch {}
  await prisma.paymentMethod.delete({ where: { id: record.id } });

  const wasPrimary = record.isPrimary;
  const next = await prisma.paymentMethod.findFirst({ where: { userId } });
  if (wasPrimary && next && !next.isPrimary) {
    await prisma.paymentMethod.update({
      where: { id: next.id },
      data: { isPrimary: true },
    });
  }
  return record;
}

async function chargeSavedCard(customerId, amountCents, stripePaymentMethodId) {
  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    payment_method: stripePaymentMethodId,
    confirm: true,
    off_session: false,
    automatic_payment_methods: { enabled: false },
    payment_method_types: ["card"],
    metadata: { source: "fayuca-checkout" },
  });

  if (intent.status !== "succeeded") {
    throw new Error("The payment could not be completed. Try a different card.");
  }
  return intent;
}

module.exports = {
  getOrCreateCustomer,
  savePaymentMethod,
  removePaymentMethod,
  chargeSavedCard,
};