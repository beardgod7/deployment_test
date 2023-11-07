const { DataTypes } = require('sequelize');
const sequelize = require('../config/pgconfig'); 

// Define the OTP model
const   resetPasswordOTP = sequelize.define('resetPasswordOTP', {
  Email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  OTP: {
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


module.exports = resetPasswordOTP;
