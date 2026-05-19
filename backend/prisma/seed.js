import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const pool = new Pool({
  // connectionString: process.env.DATABASE_URL,
  connectionString: "postgresql://postgres:1Manny_1940@localhost:5432/apexmart",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------- HELPERS ----------
const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

const generateSKU = () => "SKU-" + faker.string.alphanumeric(8).toUpperCase();

// ---------- MAIN ----------
async function main() {
  console.log("🌱 Seeding started...");

  const password = await bcrypt.hash("123456", 10);

  // ---------- USERS ----------
  const admin = await prisma.user.upsert({
    where: { email: "admin@apexmart.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@apexmart.com",
      password,
      role: "ADMIN",
      isVerified: true,
    },
  });

  const sellers = [];

  for (let i = 1; i <= 3; i++) {
    const seller = await prisma.user.upsert({
      where: { email: `seller${i}@apexmart.com` },
      update: {},
      create: {
        name: `Seller ${i}`,
        email: `seller${i}@apexmart.com`,
        password,
        role: "SELLER",
        isVerified: true,
      },
    });
    sellers.push(seller);
  }

  const customers = [];

  for (let i = 1; i <= 6; i++) {
    const customer = await prisma.user.upsert({
      where: { email: `customer${i}@apexmart.com` },
      update: {},
      create: {
        name: `Customer ${i}`,
        email: `customer${i}@apexmart.com`,
        password,
        role: "CUSTOMER",
        isVerified: true,
      },
    });
    customers.push(customer);
  }

  // ---------- CATEGORIES ----------
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics" },
  });

  const clothing = await prisma.category.upsert({
    where: { slug: "clothing" },
    update: {},
    create: { name: "Clothing", slug: "clothing" },
  });

  const mobiles = await prisma.category.upsert({
    where: { slug: "mobiles" },
    update: {},
    create: {
      name: "Mobiles",
      slug: "mobiles",
      parentId: electronics.id,
    },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      parentId: electronics.id,
    },
  });

  const shirts = await prisma.category.upsert({
    where: { slug: "shirts" },
    update: {},
    create: {
      name: "Shirts",
      slug: "shirts",
      parentId: clothing.id,
    },
  });

  const categories = [mobiles, laptops, shirts];

  // ---------- PRODUCTS ----------
  const productCount = 500;

  for (let i = 0; i < productCount; i++) {
    const name = faker.commerce.productName();
    const slug = slugify(name);

    const seller = faker.helpers.arrayElement(sellers);
    const category = faker.helpers.arrayElement(categories);

    await prisma.product.create({
      data: {
        title: name,
        slug,
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 500, max: 10000 })),
        discountPrice: faker.datatype.boolean()
          ? parseFloat(faker.commerce.price({ min: 100, max: 500 }))
          : null,
        stock: faker.number.int({ min: 0, max: 100 }),

        sku: generateSKU(),
        brand: faker.company.name(),

        isActive: true,
        isFeatured: faker.datatype.boolean(),

        sellerId: seller.id,
        categoryId: category.id,

        images: {
          create: [
            {
              imageUrl: faker.image.urlPicsumPhotos(),
            },
          ],
        },
      },
    });
  }

  console.log("✅ Seeding completed");
}

// ---------- EXECUTE ----------
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
