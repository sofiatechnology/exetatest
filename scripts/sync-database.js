"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const sequelize_typescript_1 = require("sequelize-typescript");
const user_model_1 = require("../src/models/user.model");
const otp_model_1 = require("../src/models/otp.model");
const item_model_1 = require("../src/models/item.model");
const item_course_model_1 = require("../src/models/item-course.model");
const item_question_model_1 = require("../src/models/item-question.model");
async function main() {
    const sequelize = new sequelize_typescript_1.Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        models: [user_model_1.User, otp_model_1.Otp, item_model_1.Item, item_course_model_1.ItemCourse, item_question_model_1.ItemQuestion],
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: console.log,
    });
    await sequelize.authenticate();
    console.log('Connected. Running sync({ alter: true }) for all registered models...');
    await sequelize.sync({ alter: true });
    console.log('Database schema synced successfully.');
    await sequelize.close();
}
main().catch(async (err) => {
    console.error('Sync failed:', err);
    process.exitCode = 1;
});
//# sourceMappingURL=sync-database.js.map