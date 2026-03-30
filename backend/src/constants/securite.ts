// Nombre de rounds bcrypt — configurable via .env (valeur par défaut : 10)
export function getBcryptSaltRounds(): number {
    const val = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    if (isNaN(val) || val < 4 || val > 31) return 10;
    return val;
}
