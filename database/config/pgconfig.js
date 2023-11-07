const { configDotenv } = require('dotenv')
const Sequelize = require('sequelize');

const sequelize= new Sequelize({
    dialect: 'postgres',
    logging: false,
    host:'localhost',
    port:process.env.db_port,
    username:'postgres',
    password:'francis',
    database:'ibenefit',
    define: {
      underscored: true, 
    },
    pool: {
      max: 50000,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
module.exports=sequelize