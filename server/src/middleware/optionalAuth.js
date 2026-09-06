const jwt = require("jsonwebtoken");
const prisma = require("../db");

async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies.token;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user) req.user = user;
    }
  } catch {
    // Invalid cookie is fine here: guests are allowed.
  }
  next();
}

module.exports = { optionalAuth };