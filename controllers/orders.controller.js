const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const order = async (req, res, next) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    const result = await prisma.$transaction(async (tx) => {
      let total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) throw new AppError(`Produk tidak ditemukan`, 404);
        if (product.stock < item.qty)
          throw new AppError(`Stok tidak cukup`, 400);

        total += product.price * item.qty;
        orderItems.push({
          product_id: product.id,
          qty: item.qty,
          price: product.price,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.qty } },
        });
      }

      const order = await tx.order.create({
        data: {
          user_id: userId,
          total,
          orderItems: {
            create: orderItems,
          },
        },
        include: { orderItems: true },
      });

      return order;
    });

    if (!result) {
      throw new AppError("Order gagal", 409);
    }

    res.status(201).json({ message: "Order berhasil", order: result });
  } catch (error) {
    next(error);
  }
};

const getAllOrder = async (req, res, next) => {
  try {
    const id = req.user.userId;
    const order = await prisma.order.findMany({
      where: { user_id: id },
      include: { orderItems: { include: { product: true } } },
    });
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (isNaN(orderId)) throw new AppError("ID tidak valid", 400)
    const id = req.user.userId;
    const order = await prisma.order.findUnique({
      where: { id: orderId, user_id: id },
    });
    if (!order) {
      throw new AppError("Order tidak ditemukan", 404);
    }
    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  order,
  getAllOrder,
  getOrder,
};
