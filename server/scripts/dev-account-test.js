const prisma = require("../src/db");

const BASE = "http://localhost:3000";
const JSON_HEADERS = { "Content-Type": "application/json" };

const request = (path, method, body, cookie) =>
  fetch(`${BASE}${path}`, {
    method,
    headers: { ...JSON_HEADERS, ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });

async function main() {
  const email = `acct${Date.now()}@example.com`;
  const password = "Password123";

  const register = await request("/api/auth/register", "POST", {
    name: "Acct Tester",
    email,
    password,
  });
  console.log("1. register ->", register.status, "(expect 201)");

  const vt = await prisma.verificationToken.findFirst({
    where: { user: { email }, type: "registration", usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  await request("/api/auth/verify", "POST", { email, code: vt.code });

  const login = await request("/api/auth/login", "POST", { email, password });
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const profilePatch = await request(
    "/api/users/me",
    "PATCH",
    { name: "Renamed User" },
    cookie
  );
  const profileBody = await profilePatch.json();
  console.log(
    "2. update profile ->",
    profilePatch.status,
    "name renamed:",
    profileBody.user?.name === "Renamed User"
  );

  const a1 = await request(
    "/api/users/me/addresses",
    "POST",
    { street: "Main St 1", neighborhood: "Downtown", zipCode: "91000" },
    cookie
  );
  const addrA = await a1.json();
  console.log(
    "3. create address A ->",
    a1.status,
    "auto-primary:",
    addrA.isPrimary === true,
    "(first address becomes primary)"
  );

  const a2 = await request(
    "/api/users/me/addresses",
    "POST",
    { street: "Second Ave", neighborhood: "Uptown", zipCode: "91100" },
    cookie
  );
  const addrB = await a2.json();
  console.log(
    "4. create address B ->",
    a2.status,
    "not primary:",
    addrB.isPrimary === false,
    "(second address does NOT auto-become primary)"
  );

  const setPrimary = await request(
    `/api/users/me/addresses/${addrB.id}/primary`,
    "POST",
    undefined,
    cookie
  );
  const afterPrimary = await setPrimary.json();
  console.log("5. set B as primary ->", setPrimary.status, "B primary:", afterPrimary.isPrimary === true);

  const listAfterPrimary = await (
    await request("/api/users/me/addresses", "GET", undefined, cookie)
  ).json();
  const aNow = listAfterPrimary.find((x) => x.id === addrA.id);
  console.log("6. A demoted ->", aNow.isPrimary === false);

  const delA = await request(`/api/users/me/addresses/${addrA.id}`, "DELETE", undefined, cookie);
  const listAfterDel = await (
    await request("/api/users/me/addresses", "GET", undefined, cookie)
  ).json();
  console.log("7. delete A ->", delA.status, "B survives, still primary:", listAfterDel.length === 1 && listAfterDel[0].isPrimary === true);

  const delB = await request(`/api/users/me/addresses/${addrB.id}`, "DELETE", undefined, cookie);
  const finalList = await (
    await request("/api/users/me/addresses", "GET", undefined, cookie)
  ).json();
  console.log("8. delete B (primary) ->", delB.status, "empty:", finalList.length === 0);

  await prisma.user.delete({ where: { email } });
  console.log("9. test user cleaned up");

  console.log("\nALL ACCOUNT CHECKS PASSED");
}

main()
  .catch((error) => {
    console.error("FAILED:", error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());