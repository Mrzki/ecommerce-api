const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient();

let adminToken;
let userToken;
let productId;

beforeAll(async () => {
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Admin Test",
      email: "admin@test.com",
      password: hashedAdminPassword,
      role: "admin",
    },
  });

  const hashedUserPassword = await bcrypt.hash("user123", 10);
  await prisma.user.create({
    data: {
      name: "User Biasa",
      email: "user@test.com",
      password: hashedUserPassword,
      role: "customer",
    },
  });

  const adminLogin = await request(app).post("/auth/login").send({
    email: "admin@test.com",
    password: "admin123",
  });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app).post("/auth/login").send({
    email: "user@test.com",
    password: "user123",
  });
  userToken = userLogin.body.token;

  const product = await prisma.product.create({
    data: {
      name: "Indomie Goreng",
      description: "Mie instan enak",
      price: 3000,
      stock: 50,
      category: "Makanan",
    },
  });
  productId = product.id;
});

describe("POST /auth/register", () => {
  it("berhasil register dengan data valid", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Budi",
      email: "budi@test.com",
      password: "password",
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Berhasil Register!");
    expect(response.body.data).toHaveProperty("email", "budi@test.com");
    expect(response.body.data).not.toHaveProperty("password");
  });

  it("gagal register jika data tidak lengkap", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Budi",
      email: "budi@test.com",
    });

    expect(response.status).toBe(400);
  });

  it("gagal register jika email sudah terdaftar", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Budi",
      email: "budi@test.com",
      password: "password",
    });

    expect(response.status).toBe(409);
  });
});

describe("GET /products", () => {
  it("berhasil menampilkan products", async () => {
    const response = await request(app).get("/products");
    expect(response.status).toBe(200);
  });
});

describe("POST /products", () => {
  it("berhasil menambahkan product (sebagai admin)", async () => {
    const response = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Aqua 600ML",
        description: "Air mineral asli",
        price: 3000,
        stock: 10,
        category: "Minuman",
      });

    expect(response.status).toBe(201);
    expect(response.body.newProductData).toHaveProperty("name", "Aqua 600ML");
  });

  it("gagal menambahkan product (sebagai User Biasa)", async () => {
    const response = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        name: "Produk Terlarang",
        description: "Tidak boleh",
        price: 1000,
        stock: 1,
        category: "Ilegal",
      });

    expect(response.status).toBe(403);
  });

  it("gagal menambahkan product (tanpa Login/Token)", async () => {
    const response = await request(app).post("/products").send({
      name: "Produk Anonim",
      description: "Tanpa token",
      price: 5000,
      stock: 5,
      category: "Minuman",
    });

    expect(response.status).toBe(401);
  });
});

describe("POST /orders", () => {
  it("berhasil membuat order (User Terautentikasi)", async () => {
    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [
          {
            productId: productId,
            qty: 2,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Order berhasil");
    expect(response.body.order).toHaveProperty("total");
  });

  it("gagal membuat order jika stok tidak cukup", async () => {
    const response = await request(app)
      .post("/orders")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        items: [
          {
            productId: productId,
            qty: 999,
          },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/stok tidak cukup/i);
  });
});

afterAll(async () => {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
