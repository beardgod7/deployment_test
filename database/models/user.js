const { DataTypes } = require('sequelize');
const jwt =  require("jsonwebtoken")
const sequelize = require('../config/pgconfig');

const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING,
  },
  lastName: {
    type: DataTypes.STRING,
  },
  Email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  Password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  PhoneNumber: {
    type: DataTypes.STRING,
  },
  Year_of_birth: {
    type: DataTypes.STRING,
  },
  Nationality: {
    type: DataTypes.STRING,
  },
  Gender: {
    type: DataTypes.STRING,
  },
  resetPasswordTime: {
    type: DataTypes.DATE,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define a method to check if the OTP is valid
User.prototype.isOTPValid = function () {
  return new Date() <= this.otpValidUntil;
};


User.prototype.comparePassword = async function (Password) {
  try {
    return await bcrypt.compare(Password, this.Password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};


// Generate a JWT token for a user
User.prototype.getJwtToken= function () {
  return jwt.sign({ id: this.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

module.exports = {
  User,
};
