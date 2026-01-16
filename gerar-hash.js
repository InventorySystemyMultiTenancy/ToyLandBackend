import bcrypt from "bcryptjs";

const senha = "SuperAdmin@123";
const hash = bcrypt.hashSync(senha, 10);

console.log("Senha:", senha);
console.log("Hash bcrypt:", hash);
console.log("\n--- Copie o hash acima para usar no SQL ---");
