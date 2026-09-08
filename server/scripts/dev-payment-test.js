const Stripe = require("stripe");
const prisma = require("../src/db");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BASE = "http://localhost:3000";
const JSON_HEADERS = { "Content-Type": "application/json" };

const request = (path, method, body, cookie) =>
  fetch(`${BASE}${path}`, {
    method,
    headers: { ...JSON_HEADERS, ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

function assertOk(ok, label) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
  if (!ok) throw new Error(`Check failed: ${label}`);
}

async function cleanupPreviousRuns() {
  const users = await prisma.user.findMany({ where: { email: { startsWith: "pay" } } });
  for (const user of users) {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId: user.id },
    });
    for (const method of methods) {
      try {
        await stripe.paymentMethods.detach(method.stripePaymentMethodId);
      } catch {}
      try {
        await stripe.customers.del(method.stripeCustomerId);
      } catch {}
    }
    await prisma.paymentMethod.deleteMany({ where: { userId: user.id } });
    await prisma.order.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

async function main() {
  await cleanupPreviousRuns();

  const email = `pay${Date.now()}@example.com`;
  const password = "Password123";

  await request("/api/auth/register", "POST", { name: "Pay Tester", email, password });
  const vt = await prisma.verificationToken.findFirst({
    where: { user: { email }, type: "registration", usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  await request("/api/auth/verify", "POST", { email, code: vt.code });
  const login = await request("/api/auth/login", "POST", { email, password });
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const user = await prisma.user.findUnique({ where: { email } });

  const pm1 = "pm_card_visa";

  const saved1 = await (
    await request(
      "/api/users/me/payment-methods",
      "POST",
      { stripePaymentMethodId: pm1 },
      cookie
    )
  ).json();
  assertOk(
    saved1.brand === "visa" && saved1.last4 === "4242" && saved1.isPrimary,
    "save card 1 (pm_card_visa) -> visa •••• 4242, isPrimary"
  );

  const pm2 = "pm_card_mastercard";
  const saved2 = await (
    await request(
      "/api/users/me/payment-methods",
      "POST",
      { stripePaymentMethodId: pm2 },
      cookie
    )
  ).json();
  assertOk(!saved2.isPrimary, "second card saved, NOT primary");

  const listed = await (
    await request("/api/users/me/payment-methods", "GET", undefined, cookie)
  ).json();
  assertOk(listed.length === 2, "list shows 2 cards");

  await request(
    `/api/users/me/payment-methods/${saved2.id}/primary`,
    "POST",
    undefined,
    cookie
  );
  const afterFlip = await (
    await request("/api/users/me/payment-methods", "GET", undefined, cookie)
  ).json();
  const primary = afterFlip.find((m) => m.isPrimary);
  assertOk(primary && primary.id === saved2.id, "set-primary flips to card 2");

  const product = await prisma.product.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const placed = await request(
    "/api/orders",
    "POST",
    {
      items: [{ id: product.id, quantity: 1 }],
      customer: { name: "Pay Tester", email, street: "Main St 100", neighborhood: "Centro", zipCode: "91000" },
      paymentMethodId: saved2.id,
    },
    cookie
  );

  const intents = await stripe.paymentIntents.list({
    customer: (
      await prisma.paymentMethod.findFirst({ where: { userId: user.id } })
    ).stripeCustomerId,
    limit: 10,
  });
  const succeeded = intents.data.find((i) => i.status === "succeeded");
  const paid = placed.status === 201 && succeeded;
  assertOk(
    paid,
    `paid order via card -> 201 + successful PaymentIntent${succeeded ? ` for $${(succeeded.amount / 100).toFixed(2)}` : ""}`
  );
  const placedJson = await placed.json();
  assertOk(
    placedJson.status === "paid",
    `order placed with a card has status "paid" (got "${placedJson.status}")`
  );

  const unknownOrder = await request(
    "/api/orders",
    "POST",
    {
      items: [{ id: product.id, quantity: 1 }],
      customer: { name: "Pay Tester", email, street: "Main St 100", neighborhood: "Centro", zipCode: "91000" },
      paymentMethodId: "pm_does_not_exist",
    },
    cookie
  );
  assertOk(unknownOrder.status === 404, "unknown payment method -> 404");

  const delRes = await request(`/api/users/me/payment-methods/${saved2.id}`, "DELETE", undefined, cookie);
  const afterRemove = await (
    await request("/api/users/me/payment-methods", "GET", undefined, cookie)
  ).json();
  const promoted = afterRemove.find((m) => m.id === saved1.id);
  assertOk(
    afterRemove.length === 1 && promoted?.isPrimary,
    "removing primary card promotes the remaining card"
  );

  const methods = await prisma.paymentMethod.findMany({ where: { userId: user.id } });
  const customerIds = [...new Set(methods.map((m) => m.stripeCustomerId))];
  for (const m of methods) {
    try {
      await stripe.paymentMethods.detach(m.stripePaymentMethodId);
    } catch {}
  }
  for (const customerId of customerIds) {
    try {
      await stripe.customers.del(customerId);
    } catch {}
  }
  await prisma.order.deleteMany({ where: { userId: user.id } });
  await prisma.paymentMethod.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { email } });
  console.log("PASS — cleaned up (stripe customer + cards + orders)");

  console.log("\nALL PAYMENT CHECKS PASSED");
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
