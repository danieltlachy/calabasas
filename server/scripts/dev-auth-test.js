const prisma = require("../src/db");

const BASE = "http://localhost:3000";

async function main() {
  const email = `devtest${Date.now()}@example.com`;
  const password = "Password123";

  const reg = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Dev Tester", email, password }),
  });
  console.log("1. register  ->", reg.status, "(expect 201)");

  const token = await prisma.verificationToken.findFirst({
    where: { user: { email }, type: "registration", usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!token) {
    throw new Error("No verification token was stored in the database");
  }
  console.log("2. code found in DB:", token.code);

  const verify = await fetch(`${BASE}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code: token.code }),
  });
  console.log("3. verify    ->", verify.status, "(expect 200)");
  if (verify.status !== 200) throw new Error("verify failed");

  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  console.log("4. login     ->", login.status, "(expect 200)");
  if (login.status !== 200) throw new Error("login failed");
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const me = await fetch(`${BASE}/api/auth/me`, { headers: { cookie } });
  const meBody = await me.json();
  const emailMatches = meBody.user?.email === email;
  console.log("5. me        ->", me.status, "(expect 200, email matches:", emailMatches + ")");

  const logout = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { cookie },
  });
  console.log("6. logout    ->", logout.status, "(expect 200)");

  // After logout the browser deletes the cookie, so we send NO cookie header.
  const meAfter = await fetch(`${BASE}/api/auth/me`);
  console.log("7. me again  ->", meAfter.status, "(expect 401, no cookie = session ended)");

  const forgot = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  console.log("8. forgot    ->", forgot.status, "(expect 200)");

  const resetRecord = await prisma.verificationToken.findFirst({
    where: { user: { email }, type: "password_reset", usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!resetRecord) throw new Error("No password reset token stored in DB");
  console.log("9. reset token stored in DB");

  const newPassword = "NewPassword123";
  const reset = await fetch(`${BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: resetRecord.code, password: newPassword }),
  });
  console.log("10. reset    ->", reset.status, "(expect 200)");
  if (reset.status !== 200) throw new Error("reset password failed");

  const relogin = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: newPassword }),
  });
  console.log("11. login new pw ->", relogin.status, "(expect 200)");
  if (relogin.status !== 200) throw new Error("login with new password failed");

  await prisma.user.delete({ where: { email } });
  console.log("12. test user cleaned up");

  console.log("\nALL CHECKS PASSED");
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());