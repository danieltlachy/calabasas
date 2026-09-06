const prisma = require("../src/db");

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

async function main() {
  const email = `hard${Date.now()}@example.com`;

  const badEmail = await request("/api/auth/register", "POST", {
    name: "X",
    email: "not-an-email",
    password: "Password123",
  });
  assertOk(badEmail.status === 400, "register with invalid email -> 400");

  const shortPw = await request("/api/auth/register", "POST", {
    name: "Valid Name",
    email,
    password: "short",
  });
  assertOk(shortPw.status === 400, "register with short password -> 400");

  const badCode = await request("/api/auth/verify", "POST", {
    email,
    code: "12",
  });
  assertOk(badCode.status === 400, "verify with non-6-digit code -> 400");

  const badLogin = await request("/api/auth/login", "POST", {
    email,
    password: "",
  });
  assertOk(badLogin.status === 400, "login with empty password -> 400");

  const noItems = await request("/api/orders", "POST", {
    items: [],
    customer: { name: "A", email: "a@a.com", street: "s", neighborhood: "n", zipCode: "12345" },
  });
  assertOk(noItems.status === 400, "order with empty cart -> 400");

  const badCustomer = await request("/api/orders", "POST", {
    items: [{ id: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
    customer: { name: "A", email: "bad", street: "s", neighborhood: "n", zipCode: "12345" },
  });
  assertOk(badCustomer.status === 400, "order with invalid customer email -> 400");

  await request("/api/auth/register", "POST", {
    name: "Hard Test",
    email,
    password: "Password123",
  });
  const vt = await prisma.verificationToken.findFirst({
    where: { user: { email }, type: "registration", usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  await request("/api/auth/verify", "POST", { email, code: vt.code });
  const login = await request("/api/auth/login", "POST", { email, password: "Password123" });
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const badAddress = await request(
    "/api/users/me/addresses",
    "POST",
    { street: "", neighborhood: "", zipCode: "", landmarks: "" },
    cookie
  );
  assertOk(badAddress.status === 400, "address with missing fields -> 400");

  const badPayment = await request(
    "/api/users/me/payment-methods",
    "POST",
    { stripePaymentMethodId: "" },
    cookie
  );
  assertOk(badPayment.status === 400, "payment method missing token -> 400");

  let first429 = -1;
  for (let i = 0; i < 305; i++) {
    const res = await request("/api/health", "GET");
    if (res.status === 429) {
      first429 = i;
      break;
    }
  }
  assertOk(
    first429 >= 285 && first429 <= 295,
    `general limiter returns 429 around the 300th request (got ${first429})`
  );

  await prisma.order.deleteMany({ where: { email } });
  await prisma.user.delete({ where: { email } });
  console.log("PASS — cleaned up test user");

  console.log("\nALL HARDENING CHECKS PASSED");
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());