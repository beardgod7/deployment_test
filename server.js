const { configDotenv } = require('dotenv')
const {scheduleTask} =require('./utils/cronjob')
const user = require('./routes/user')
const sequelize = require('./database/config/pgconfig'); 
const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const cors = require("cors");
app= express()

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "auth-token, Origin, X-Requested-With, Content-Type, Accept");
  next();
});


if (process.env.NODE_ENV !== "PRODUCTION") {
    require('dotenv').config({
      path: "privacy/.env",
    });
  }
 
    async function syncDatabase() {
      try {
        await sequelize.sync();
        console.log('Database synchronized.');
      } catch (error) {
        console.error('Database synchronization failed:', error);
      }
    }

  syncDatabase();
  scheduleTask();

  app.use(express.json());
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" })); 

//Welcome route
app.get("/api/v2/user/welcome", (req,res) => {
  res.status(200).send({message: "Welcome to the MEN-REST-API"});
}); 

app.use("/api/v2/user", user)
app.listen(process.env.PORT,()=>{
    console.log( `app is running on http://localhost:${process.env.PORT}`) 
})

module.exports = app