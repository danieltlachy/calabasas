const bcrypt = require("bcryptjs");
const prisma = require("../src/db");

const DEMO_EMAIL = "demo@calabasas.com";
const DEMO_NAME = "Demo Tester";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo1234!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, emailVerifiedAt: new Date() },
    create: {
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`Demo account ready: ${user.email} / ${DEMO_PASSWORD}`);
  console.log(`id: ${user.id}`);
}

main()
  .catch((error) => {
    console.error("Failed to create demo account:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());