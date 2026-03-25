const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const userRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError("Name, Email, dan Password wajib diisi", 400);
    }

    const existinguser = await prisma.user.findUnique({ where: { email } });
    if (existinguser) {
      throw new AppError("Email sudah terdaftar", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const register = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { name: true, email: true, role: true },
    });

    res.status(201).json({ message: "Berhasil Register!", data: register });
  } catch (error) {
    next(error);
  }
};

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError("Email dan Password salah", 401);
    }

    const check = await bcrypt.compare(password, user.password);
    if (!check) {
      throw new AppError("Email atau Password salah", 401);
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    logger.info({ userId: user.id, time: user.createdAt });
    res.status(200).json({ message: "Berhasil login!", token });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    if (!userData) {
      throw new AppError("User tidak ditemukan", 404);
    }
    res.status(200).json({ userData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userRegister,
  userLogin,
  getMe,
};
