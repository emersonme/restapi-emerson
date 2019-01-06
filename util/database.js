const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_SCHEMA, process.env.DB_USER, null, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

module.exports = sequelize;
    

