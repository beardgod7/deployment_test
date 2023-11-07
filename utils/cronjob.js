const cron = require('node-cron')
const userOTP = require('../database/models/userOTP')
const { Op } = require('sequelize');

// Define a function that schedules a task
function scheduleTask() {
    cron.schedule('*/1 * * * *', async () => {
        try {
          const currentDate = new Date();
          const expirationTime = new Date(currentDate);
          expirationTime.setMinutes(currentDate.getMinutes() - 3);
          await userOTP.destroy({
            where: {
              expiresAt: { [Op.lt]:  expirationTime },
            },
          });
          console.log('Expired OTP records have been cleaned up.');
        } catch (error) {
          console.error('Error while cleaning up expired OTP records:', error);
        }
      });
}

// Export the function
module.exports = { scheduleTask };


