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
  const email = `ord${Date.now()}@example.com`;
  const password = "Password123";

  const product = await prisma.product.findFirst({
    orderBy: { createdAt: "asc" },
  });
  const stockBefore = await prisma.product.findUnique({
    where: { id: product.id },
    select: { stock: true },
  });
  const quantity = 2;

  await request("/api/auth/register", "POST", {
    name: "Order Tester",
    email,
    password,
  });
  const vt = await prisma.verificationToken.findFirst({
    where: { user: { email }, type: "registration", usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  await request("/api/auth/verify", "POST", { email, code: vt.code });
  const login = await request("/api/auth/login", "POST", { email, password });
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const customer = {
    name: "Order Tester",
    email,
    street: "Main St 100",
    neighborhood: "Centro",
    zipCode: "91000",
  };

  const placed = await request(
    "/api/orders",
    "POST",
    { items: [{ id: product.id, quantity }], customer },
    cookie
  );
  const order = await placed.json();
  assertOk(placed.status === 201, "create order (logged in) -> 201");
  assertOk(
    order.total === Number(product.price) * quantity,
    "server-side total is product price x qty"
  );
  assertOk(/^FYC-[A-Z0-9]+-\d{4}$/.test(order.reference), "reference format FYC-XXXX-####");

  const byRef = await request(`/api/orders/ref/${order.reference}`, "GET");
  assertOk(byRef.status === 200, "fetch order by reference -> 200");

  const mine = await (
    await request("/api/orders/mine", "GET", undefined, cookie)
  ).json();
  assertOk(
    mine.length === 1 && mine[0].items[0].productName === product.name,
    "order history shows order with correct item"
  );

  const guest = await request("/api/orders", "POST", {
    items: [{ id: product.id, quantity: 1 }],
    customer: { ...customer, email: "guest-x@example.com" },
  });
  assertOk(guest.status === 201, "guest checkout -> 201");

  const stockAfter = await prisma.product.findUnique({
    where: { id: product.id },
    select: { stock: true },
  });
  assertOk(
    stockAfter.stock === stockBefore.stock - quantity - 1,
    "stock decremented by exact quantity"
  );

  await prisma.product.update({
    where: { id: product.id },
    data: { stock: stockBefore.stock },
  });
  const user = await prisma.user.findUnique({ where: { email } });
  await prisma.order.deleteMany({ where: { userId: user.id } });
  await prisma.order.deleteMany({ where: { email: "guest-x@example.com" } });
  await prisma.user.delete({ where: { email } });
  console.log("PASS — cleaned up (stock restored)");

  console.log("\nALL ORDER CHECKS PASSED");
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());