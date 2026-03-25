const prisma = require("../config/prisma");
const redis = require("../config/redis");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const getAllProduct = async (req, res, next) => {
  try {
    const cached = await redis.get("products:all");

    if (cached) {
      const products = JSON.parse(cached);
      return res.status(200).json({ products });
    }

    const products = await prisma.product.findMany();
    await redis.set("products:all", JSON.stringify(products), "EX", 60);
    res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if(isNaN(id)) throw new AppError("ID tidak valid", 400)
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new AppError("Product tidak ditemukan", 404);
    }

    res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

const addNewProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category } = req.body;
    if (!name || !description || !price || !stock || !category) {
      throw new AppError(
        "Data name, description, price, stock, category wajib diisi!",
        400,
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name,
        description: description,
        price: price,
        stock: stock,
        category: category,
      },
    });

    await redis.del("products:all");
    res.status(201).json({
      message: "Product berhasil ditambahkan",
      newProductData: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError("ID tidak valid", 400)
    const { name, description, price, stock, category } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("Product tidak ditemukan", 404);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        category,
      },
    });

    await redis.del("products:all");
    res
      .status(200)
      .json({ message: "Product berhasil diubah", updatedProduct });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if(isNaN(id)) throw new AppError("ID tidak valid", 400)

    const deletedProduct = await prisma.product.delete({ where: { id } });

    await redis.del("products:all");
    res
      .status(200)
      .json({ message: "Product berhasil dihapus", deletedProduct });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProduct,
  getProduct,
  addNewProduct,
  updateProduct,
  deleteProduct,
};
