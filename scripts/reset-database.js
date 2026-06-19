"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = require("fs");
const path_1 = require("path");
const sequelize_1 = require("sequelize");
async function main() {
    const sequelize = new sequelize_1.Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
        logging: console.log,
    });
    await sequelize.authenticate();
    console.log('Connected. Dropping all existing tables and types...');
    await sequelize.query('DROP SCHEMA public CASCADE;');
    await sequelize.query('CREATE SCHEMA public;');
    await sequelize.query('GRANT ALL ON SCHEMA public TO public;');
    const migrationPath = (0, path_1.join)(__dirname, 'migrations', '001-initial-schema.sql');
    const sql = (0, fs_1.readFileSync)(migrationPath, 'utf8');
    console.log('Applying initial migration from scripts/migrations/001-initial-schema.sql...');
    await sequelize.query(sql);
    console.log('Database reset complete. Fresh schema is ready.');
    await sequelize.close();
}
main().catch(async (err) => {
    console.error('Database reset failed:', err);
    process.exitCode = 1;
});
//# sourceMappingURL=reset-database.js.map