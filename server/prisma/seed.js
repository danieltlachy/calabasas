const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categories = [
  { name: "Clothing", slug: "clothing" },
  { name: "Tennis Shoes", slug: "shoes" },
];

const products = [
  {
    name: "Classic Cotton Tee",
    slug: "classic-cotton-tee",
    price: 19.99,
    description: "Soft 100% cotton t-shirt, relaxed fit.",
    imageUrl: "https://placehold.co/600x600?text=Tee",
    stock: 50,
    categorySlug: "clothing",
  },
  {
    name: "Slim Fit Jeans",
    slug: "slim-fit-jeans",
    price: 49.99,
    description: "Classic slim-fit denim with stretch.",
    imageUrl: "https://placehold.co/600x600?text=Jeans",
    stock: 30,
    categorySlug: "clothing",
  },
  {
    name: "Oversized Hoodie",
    slug: "oversized-hoodie",
    price: 59.99,
    description: "Heavyweight fleece hoodie, oversized cut.",
    imageUrl: "https://placehold.co/600x600?text=Hoodie",
    stock: 25,
    categorySlug: "clothing",
  },
  {
    name: "Cargo Joggers",
    slug: "cargo-joggers",
    price: 45.0,
    description: "Comfortable joggers with side cargo pockets.",
    imageUrl: "https://placehold.co/600x600?text=Joggers",
    stock: 40,
    categorySlug: "clothing",
  },
  {
    name: "Denim Jacket",
    slug: "denim-jacket",
    price: 79.99,
    description: "Timeless denim jacket, medium wash.",
    imageUrl: "https://placehold.co/600x600?text=Jacket",
    stock: 20,
    categorySlug: "clothing",
  },
  {
    name: "Court Classic White",
    slug: "court-classic-white",
    price: 89.99,
    description: "Minimalist leather court shoe in white.",
    imageUrl: "https://placehold.co/600x600?text=Court",
    stock: 35,
    categorySlug: "shoes",
  },
  {
    name: "Retro Running Sneaker",
    slug: "retro-running-sneaker",
    price: 74.5,
    description: "Retro-styled running sneaker with gum sole.",
    imageUrl: "https://placehold.co/600x600?text=Retro",
    stock: 28,
    categorySlug: "shoes",
  },
  {
    name: "Low-Top Canvas",
    slug: "low-top-canvas",
    price: 45.0,
    description: "Classic low-top canvas sneaker.",
    imageUrl: "https://placehold.co/600x600?text=Canvas",
    stock: 60,
    categorySlug: "shoes",
  },
  {
    name: "High-Top Court Legacy",
    slug: "high-top-court-legacy",
    price: 99.0,
    description: "High-top court silhouette in leather and suede.",
    imageUrl: "https://placehold.co/600x600?text=HighTop",
    stock: 22,
    categorySlug: "shoes",
  },
  {
    name: "Performance Tennis Shoe",
    slug: "performance-tennis-shoe",
    price: 119.99,
    description: "Competition-grade tennis shoe with grippy outsole.",
    imageUrl: "https://placehold.co/600x600?text=Tennis",
    stock: 18,
    categorySlug: "shoes",
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    console.log(`Category ready: ${category.name}`);
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        stock: product.stock,
        categoryId: category.id,
      },
      create: {
        name: product.name,
        slug: product.slug,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
        stock: product.stock,
        categoryId: category.id,
      },
    });
    console.log(`Product ready: ${product.name}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });