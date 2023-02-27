const express = require("express");
const app = express();
const router = express.Router();

require("dotenv").config();

var path = require("path");

const bodyParser = require("body-parser");
const cors = require("cors");

var https = require("https");
var fs = require("fs");

const dbConn = require('./config/db.config');

const port = 5000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// for ip address
app.set('trust proxy', true)

const files = require("./route");
files(router);
app.use("/api", router);

app.get('/', (req, res) => {
  res.send("Welcome to the backend server of SocialHive!!!")
})

app.listen(port, () => {
  console.log(`SERVER IS RUNNING ON PORT ${port}`);
});