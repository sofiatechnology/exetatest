"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const sequelize_typescript_1 = require("sequelize-typescript");
const user_model_1 = require("../src/models/user.model");
async function main() {
    const email = process.argv[2]?.trim();
    const sequelize = new sequelize_typescript_1.Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        models: [user_model_1.User],
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: false,
    });
    await sequelize.authenticate();
    const [user, created] = await user_model_1.User.findOrCreate({
        where: { email },
        defaults: {
            email,
            role: user_model_1.UserRoleEnum.ADMIN,
            current_streak: 0,
            longest_streak: 0,
        },
    });
    if (!created && user.role !== user_model_1.UserRoleEnum.ADMIN) {
        await user.update({ role: user_model_1.UserRoleEnum.ADMIN });
    }
    console.log(`OK: ${email} est maintenant admin (userId=${user.id}).`);
    await sequelize.close();
}
main().catch(async (err) => {
    console.error('Erreur:', err);
    process.exitCode = 1;
});
//# sourceMappingURL=grant-admin.js.map