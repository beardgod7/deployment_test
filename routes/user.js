const express = require('express');
const cookie = require('cookie-parser')
const userOTP = require('../database/models/userOTP')
const generateOTP= require('../utils/generateOTP')
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const sendMail = require("../utils/mail");
const sendToken = require('../utils/usertoken');
const {User }= require('../database/models/user');
const resetPasswordOTP = require('../database/models/resetPasswordOTP') 
const {isAuthenticated} = require('../middleware/auth')
const bcrypt = require('bcryptjs');
const catchAsyncErrors = require('../middleware/catchAsyncErrors')
const jwt = require('jsonwebtoken')


router.post('/create-user', catchAsyncErrors (async (req, res) => {
  try {
    
    const {
      Email,
      Password,
    } = req.body;

    if ( !Email || !Password ) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

   
    const existingUser = await User.findOne({ where: { Email } });
    
    if (existingUser) {
    
      return res.status(400).json({ message: 'Email already in use.' });
    }
  
    const otpLength = 5;
    const generatedOTP = generateOTP(otpLength);
    const currentDate = new Date();
    const expirationTime= new Date(currentDate);
    expirationTime.setMinutes(currentDate.getMinutes() + 3);
    
    await userOTP.create({
      Email,
      Password,
      OTP: generatedOTP,
      createdAt: new Date(),
      expiresAt: expirationTime,
    });

    const user= {
        Email,
        Password
      }
  
    res.cookie('userEmail',user.Email,{httpOnly:true})
   
    try {
      await sendMail({
        Email: user.Email,
        subject: "Activate your account",
        message: `Hello ${user.firstName}, this is your OTP code: ${generatedOTP} it expires in three minutes`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.Email} for your OTP!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    return (new ErrorHandler(error.message, 400));
  }
}));


router.post('/activation', catchAsyncErrors(async (req, res, next) => {
  try {
    const { Email, OTP } = req.body;

    const otpRecords = await userOTP.findAll({ where: { email: Email } });

    // Loop through the OTP records to verify and handle each one
    for (const otpRecord of otpRecords) {
      if (otpRecord.expiresAt < new Date()) {
        // Expired OTP, continue to the next OTP record
        continue;
      }

      if (otpRecord.OTP === OTP) {
        // Valid and unexpired OTP, handle it and break out of the loop
        const { Password} = otpRecord;

        let user = await User.findOne({ where: { Email } });

        if (user) {
          return next(new ErrorHandler('User already exists', 400));
        }

        // Create a new user record in the database
        user = await User.create({
          Email,
          Password,
        });

        // Remove the OTP record after it has been used
        await userOTP.destroy({where:{ Email }});
        // Send a success response
        return res.status(201).json({ message: 'User created successfully.' });
      }
     }

    // If the loop completes without a valid OTP, return an error response
    return res.status(400).json({ message: 'Invalid or expired OTP.' });

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));


router.post(
  "/forget-password",catchAsyncErrors(async (req, res, next) => {
    try {
      const {
        Email
      } = req.body;

      let user = await User.findOne({ where: { Email } });
      
      if (!user) {
          return next(new ErrorHandler("User do not exists", 400));
        }
      const otpLength = 5; 
      const generatedOTP = generateOTP(otpLength);
      const currentDate = new Date();
      const expirationTime= new Date(currentDate);
      expirationTime.setMinutes(currentDate.getMinutes() + 3);
      

      await resetPasswordOTP.create({
        Email,
        OTP: generatedOTP,
        createdAt: new Date(),
        expiresAt: expirationTime,
      }); 

      const User1= {
        Email
      }
      res.cookie('userEmail',User1.Email,{httpOnly:true})
    try {
      await sendMail({
        Email: User1.Email,
        subject: "reset password",
        message: `Hello ${User1.firstName}, OTP  has been sent to reset password: ${generatedOTP}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${User1.Email} for your reset password OTP`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
      
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

router.put("/forget-password-activation", catchAsyncErrors(async (req, res, next) => {
  try {
    const { Password, confirmPassword, OTP } = req.body;
    if (Password !== confirmPassword) {
      return next(
        new ErrorHandler("Password doesn't match with each other!", 400)
      );
    }

    const otpRecords = await resetPasswordOTP.findAll({ where: { OTP: OTP } });

    let user; 
    for (const otpRecord of otpRecords) {
      if (otpRecord.expiresAt < new Date()) {
        
        continue;
      }

      if (otpRecord.OTP === OTP) {
        
        user = await User.findOne({ where: { Email: otpRecord.Email } });
        if (!user) {
          return next(new ErrorHandler('User does not exist', 400));
        }

        
        const hashedPassword = await bcrypt.hash(Password, 10);
        user.Password = hashedPassword;
        await user.save();

        
        await resetPasswordOTP.destroy({ where: { Email: otpRecord.Email } });
        break; 
      }
    }
    
    if (!user) {
      // No valid OTP was found
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    
    res.status(201).json({
      success: true,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

router.put(
  "/personal-details",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { Email,PhoneNumber, firstName, lastName,Year_of_birth, Nationality,Gender, } = req.body;
      if (!firstName || !lastName || !Email || !Nationality || !Gender ||!PhoneNumber ||!Year_of_birth) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
      }

      const user = await User.findOne({where:{ Email }})

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }
        user.firstName =firstName,
        user.lastName=lastName
        user.PhoneNumber=PhoneNumber
        user.Year_of_birth=Year_of_birth
        user.Nationality=Nationality
        user.Gender=Gender
    
      
      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.post(
  "/login-user",catchAsyncErrors(async (req, res, next) => {
    try {
      const { Email, Password } = req.body;
      const user = await User.findOne( {where:{ email:Email }})
     
      if (!Email || !Password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }
      
      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const PasswordValid = await user.comparePassword(Password);
      
      if (!PasswordValid) {
        return next(new ErrorHandler("password is incorrect", 400));
      };
      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.post('/resendotp', catchAsyncErrors(async (req, res) => {
  try {
    const Email = req.cookies.userEmail
    
    const existingUser = await userOTP.findOne({ where: { Email } });
    if (!existingUser) {
      
      return res.status(400).json({ message: 'user doesnt exist go back to registration' });
    }
    const otpLength = 5; 
    const generatedOTP = generateOTP(otpLength);
    const currentDate = new Date();
    const expirationTime= new Date(currentDate);
    expirationTime.setMinutes(currentDate.getMinutes() + 5);
    const { Password} = existingUser
    await userOTP.create({
      Email,
      Password,
      OTP: generatedOTP,
      createdAt: new Date(),
      expiresAt: expirationTime,
    });

    const user= {
        Email,
        Password,
        
      }
    
    try {
      await sendMail({
        Email: user.Email,
        subject: "Activate your account",
        message: `Hello ${user.firstName}, this is your new OTP code: ${generatedOTP} it expires in three minutes`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.Email} for your newOTP!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    return (new ErrorHandler(error.message, 400));
  }
}));

router.post('/resendotp-forget-password', catchAsyncErrors(async (req, res) => {
  try {
    const Email = req.cookies.userEmail
    
    const existingUser = await resetPasswordOTP.findOne({ where: { Email } });
    if (!existingUser) {
      
      return res.status(400).json({ message: 'user doesnt exist go back to registration' });
    }
    const otpLength = 5; 
    const generatedOTP = generateOTP(otpLength);
    const currentDate = new Date();
    const expirationTime= new Date(currentDate);
    expirationTime.setMinutes(currentDate.getMinutes() + 5);
    const { Password} = existingUser
    await resetPasswordOTP.create({
      Email,
      Password,
      OTP: generatedOTP,
      createdAt: new Date(),
      expiresAt: expirationTime,
    });

    const user= {
        Email,
        Password,
        
      }
    
    try {
      await sendMail({
        Email: user.Email,
        subject: "forget password your account",
        message: `Hello ${user.firstName}, this is your new OTP code: ${generatedOTP} it expires in three minutes`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.Email} for your newOTP!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    console.error("Error object:", error);
    console.error("Error message:", error.message);
    return (new ErrorHandler(error.message, 400));
  }
}));

router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
