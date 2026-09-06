const prisma = require("../db");
const { sendVerificationCode } = require("./mailService");

const CODE_TTL_MS = 10 * 60 * 1000;

async function issueVerificationCode(user) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      code,
      type: "registration",
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  await sendVerificationCode(user.email, code);
}

module.exports = { issueVerificationCode };