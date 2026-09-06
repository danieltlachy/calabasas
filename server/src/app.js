const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const productsRouter = require("./routes/products");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const ordersRouter = require("./routes/orders");

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ error: "Too many requests. Try again later." }),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 10 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ error: "Too many auth attempts. Try again later." }),
});

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/products", productsRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

const publicDir = path.join(__dirname, "../public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ${status} ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err);
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message });
});

module.exports = app;