const prisma = require("../db");
const { issueVerificationCode } = require("../services/verificationService");

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function serializeUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function getProfile(req, res, next) {
  try {
    return res.json({ user: serializeUser(req.user) });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;
    const data = {};
    let emailChanged = false;

    if (name !== undefined && name.trim()) {
      data.name = name.trim();
    }

    if (email !== undefined) {
      const newEmail = normalizeEmail(email);
      if (newEmail !== req.user.email) {
        const taken = await prisma.user.findUnique({ where: { email: newEmail } });
        if (taken && taken.id !== req.user.id) {
          return res.status(409).json({ error: "This email is already in use" });
        }
        data.email = newEmail;
        data.emailVerifiedAt = null;
        emailChanged = true;
      }
    }

    const user = await prisma.user.update({ where: { id: req.user.id }, data });

    if (emailChanged) {
      await issueVerificationCode(user);
    }

    return res.json({
      user: serializeUser(user),
      message: emailChanged
        ? "Email updated. A new verification code was sent."
        : "Profile updated.",
    });
  } catch (error) {
    return next(error);
  }
}

async function claimPrimary(userId, addressId) {
  await prisma.address.updateMany({
    where: { userId },
    data: { isPrimary: false },
  });
  return prisma.address.update({
    where: { id: addressId },
    data: { isPrimary: true },
  });
}

async function listAddresses(req, res, next) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return res.json(addresses);
  } catch (error) {
    return next(error);
  }
}

async function createAddress(req, res, next) {
  try {
    const { street, neighborhood, zipCode, landmarks, isPrimary } = req.body;
    if (!street?.trim() || !neighborhood?.trim() || !zipCode?.trim()) {
      return res
        .status(400)
        .json({ error: "Street, neighborhood and ZIP code are required" });
    }

    const count = await prisma.address.count({ where: { userId: req.user.id } });

    if (isPrimary === true || count === 0) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isPrimary: false },
      });
      const address = await prisma.address.create({
        data: {
          userId: req.user.id,
          street,
          neighborhood,
          zipCode,
          landmarks: landmarks || null,
          isPrimary: true,
        },
      });
      return res.status(201).json(address);
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.id,
        street,
        neighborhood,
        zipCode,
        landmarks: landmarks || null,
      },
    });
    return res.status(201).json(address);
  } catch (error) {
    return next(error);
  }
}

async function updateAddress(req, res, next) {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Address not found" });
    }

    const { street, neighborhood, zipCode, landmarks, isPrimary } = req.body;
    const data = {};
    if (street !== undefined) data.street = street;
    if (neighborhood !== undefined) data.neighborhood = neighborhood;
    if (zipCode !== undefined) data.zipCode = zipCode;
    if (landmarks !== undefined) data.landmarks = landmarks || null;

    let address;
    if (isPrimary === true) {
      address = await claimPrimary(req.user.id, existing.id);
    } else {
      address = await prisma.address.update({ where: { id: existing.id }, data });
    }
    return res.json(address);
  } catch (error) {
    return next(error);
  }
}

async function setPrimaryAddress(req, res, next) {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Address not found" });
    }
    const address = await claimPrimary(req.user.id, existing.id);
    return res.json(address);
  } catch (error) {
    return next(error);
  }
}

async function deleteAddress(req, res, next) {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Address not found" });
    }

    await prisma.address.delete({ where: { id: existing.id } });

    if (existing.isPrimary) {
      const next = await prisma.address.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await claimPrimary(req.user.id, next.id);
      }
    }

    return res.json({ message: "Address deleted" });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  listAddresses,
  createAddress,
  updateAddress,
  setPrimaryAddress,
  deleteAddress,
};