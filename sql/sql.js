const mysql = require("mysql");
const sql = mysql.createConnection({
  host: "localhost",
  user: "reader",
  password: "123456",
  database: "wiley_library",
});
sql.connect((err) => {
  if (err) console.log(err);
});
module.exports = sql;
