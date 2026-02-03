import bcrypt from "bcryptjs";

bcrypt.hash("Seller@123", 10).then(console.log);
