const bcrypt = require("bcrypt");
const passwordLama = "admin123"; // Ganti dengan password yang kamu inginkan
const saltRounds = 10;

bcrypt.hash(passwordLama, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log("Hash baru kamu adalah:");
  console.log(hash);
});
