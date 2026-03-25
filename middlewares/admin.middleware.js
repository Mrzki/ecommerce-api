const requireAdmin = (req, res, next) => {
  try {
    const userRole = req.user.role;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Role bukan admin" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token tidak valid" });
  }
};

module.exports = requireAdmin;
