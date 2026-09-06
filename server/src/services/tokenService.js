const jwt = require("jsonwebtoken");

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

module.exports = { signToken };