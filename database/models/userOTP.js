const { DataTypes } = require('sequelize');
const sequelize = require('../config/pgconfig');
const bcrypt = require('bcryptjs');


// Define the OTP model
const userOTP = sequelize.define('userOTP', {
  Email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  OTP: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

// Hash password before creating or updating a user
userOTP.beforeCreate(async (user) => {
  if (user.changed('Password')) {
    user.Password = await bcrypt.hash(user.Password, 10);
  }
});

module.exports = userOTP;
