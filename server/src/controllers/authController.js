const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const prisma = require("../db");
const { signToken } = require("../services/tokenService");
const { sendPasswordResetLink } = require("../services/mailService");
const { issueVerificationCode } = require("../services/verificationService");

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, passwordHash },
    });

    await issueVerificationCode(user);

    return res.status(201).json({
      message: "Registered! Check your email for the verification code.",
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const token = await prisma.verificationToken.findFirst({
      where: { userId: user.id, code, type: "registration", usedAt: null },
    });
    if (!token) {
      return res.status(400).json({ error: "Invalid code" });
    }
    if (token.expiresAt < new Date()) {
      return res.status(400).json({ error: "Code expired. Request a new one." });
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return res.json({ message: "Email verified. You can log in now." });
  } catch (error) {
    return next(error);
  }
}

async function resendCode(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    if (user.emailVerifiedAt) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    await issueVerificationCode(user);
    return res.json({ message: "A new code was sent." });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.emailVerifiedAt) {
      return res.status(403).json({
        error: "Please verify your email before logging in.",
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: isProd });
  return res.json({ message: "Logged out" });
}

async function me(req, res) {
  return res.json({
    user: { id: req.user.id, name: req.user.name, email: req.user.email },
  });
}

async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (!user) {
      return res.json({ message: "If that email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        code: token,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    await sendPasswordResetLink(user.email, resetUrl);

    return res.json({ message: "If that email exists, a reset link was sent." });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and new password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const record = await prisma.verificationToken.findFirst({
      where: { code: token, type: "password_reset", usedAt: null },
    });
    if (!record) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Reset link expired. Request a new one." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
    ]);

    return res.json({ message: "Password updated. You can log in now." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  logout,
  me,
  requestPasswordReset,
  resetPassword,
};