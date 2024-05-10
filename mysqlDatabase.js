const mysql = require("mysql2");
require("dotenv");

const connection = mysql.createConnection({
  host: process.env.mysqlHost,
  user: process.env.mysqlUser,
  database: process.env.mysqlDatabase,

});

module.exports = connection;

