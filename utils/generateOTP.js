function generateOTP(length) {
    const charset = '0123456789'; // You can customize this if needed
    let otp = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      otp += charset[randomIndex];
    }
  
    return otp;
  }
  
  module.exports =generateOTP;