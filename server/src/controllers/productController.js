const prisma = require("../db");

function serializeProduct(product) {
  return { ...product, price: Number(product.price) };
}

async function getProducts(req, res, next) {
  try {
    const categorySlug = req.query.category;
    const products = await prisma.product.findMany({
      where: categorySlug ? { category: { slug: categorySlug } } : undefined,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(products.map(serializeProduct));
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(serializeProduct(product));
  } catch (error) {
    next(error);
  }
}

module.exports = { getProducts, getProductById };