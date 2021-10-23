const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 3000;
const sql = require("./sql/sql");
const flash = require("express-flash");
const session = require("express-session");
app.use(flash());
app.use(
  session({
    key: "userId",
    secret: "VeryBigSecret",
    resave: false,
    saveUninitialized: false,
  })
);
// import winston to write application logs to file
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, prettyPrint } = format;

// format the log and specify the path to write the log
const logger = createLogger({
  format: combine(timestamp(), prettyPrint()),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/app.log" }),
  ],
});

// setting view engine to ejs
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var path = require("path");
const { rootCertificates } = require("tls");
// set path so html/css and other static contents can be imported
var dir = path.join(__dirname, "views/");
app.use(express.static(dir));

/*
when a request comes to root
checking whether there is an active session
if there is an active session, check the authorization level and redirect to relevant home pages
if not redirect to login page
*/
app.get("/", (req, res) => {
  if (req.session.user) {
    if (req.session.user[0].isAdmin === 0) {
      res.render("user_index.ejs", {
      });
      logger.log(
        "info",
        `user ${req.session.user[0].userid} logged in session id: ${req.session.id}`
      );
    } else {
      res.render("admin_index.ejs", {
      });
      logger.log(
        "info",
        `user ${req.session.user[0].userID} logged in. session id: ${req.session.id}`
      );
    }
  } else {
    res.redirect("/Login");
    logger.log("info", `no active session. redirect to login`);
  }
});

/*
when a login request comes to login page,
if the user is not available in the session
redirects to login page with an error msg
if user available, redirect to root
*/

app.get("/Login", (req, res) => {
  if (!req.session.user) {
    res.render("login", { error_msg: "" });
  } else {
    res.redirect("/");
  }
});

/* 
if a request comes to /signp
if there is no any active session, redirect to register pageXOffset. 
else redirect to rootCertificates
*/
app.get("/signup", (req, res) => {
  if (!req.session.user) {
    res.render("register", { error_msg: "" });
  } else {
    res.redirect("/");
  }
});

/*
Registering a new user
*/

app.post("/signup", (req, res) => {
  // get values from the request
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const country = req.body.country;
  const ainterest = req.body.ainterest;
  const email = req.body.email;
  const password = req.body.password;
  const isadmin = req.body.isadmin;

  // Checking if the email is already available
  sql.query("SELECT * FROM users WHERE email = ?;", [email], (err, result) => {
    // returning an error if the sql fails
    if (err) {
      res.render("register.ejs", { error_msg: err });
    }

    //if email available, redirects to register page with the given error msg
    if (result.length > 0) {
      res.render("register.ejs", { error_msg: "User Exist Try to Login" });

      // if email is unique, proceed with creating a hash password 
    } else {
      bcrypt.hash(password, 10, (err, data) => {
        if (err) console.error(err);
        sql.query(
          `INSERT INTO users ( email , password, isAdmin ) VALUES ('${email}', '${data}', '${isadmin}')`,
          (err) => {
            if (err) console.log(err);
          }
        );
        logger.log("info", `user ${firstname} registered.`);
        //re-validating the email inserted
        sql.query(
          "SELECT * FROM users WHERE email = ?;",
          [email],
          (err, result) => {
            if (err) {
              res.render("register.ejs", { error_msg: err });
            }
            //re-validating the hashed password and proceed with inserting into personalinfo
            if (result.length > 0) {
              bcrypt.compare(password, result[0].password, (err, response) => {
                if (response) {
                  req.session.user = result;
                  sql.query(
                    `INSERT INTO personalinfo ( userid, firstname , lastname, ainterest, country ) VALUES ('${result[0].userid}', '${firstname}', '${lastname}', '${ainterest}', '${country}')`,
                    (err) => {
                      if (err) console.log(err);
                    }
                  );
                  res.redirect("/");
                } else {
                  res.render("register.ejs", {
                    error_msg:
                      "Something Went Wrong Try Creating A New Account",
                  });
                  logger.log("error", `can not insert to sql database`);
                }
              });
            } else {
              res.render("register.ejs", {
                error_msg: "Something Went Wrong Try Creating A New Account",
              });
              logger.log("error", `can not insert to sql database`);
            }
          }
        );
      });
    }
  });
});

/*
when a user tries to login
email and password validation
*/

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  sql.query("SELECT * FROM users WHERE email = ?;", [email], (err, result) => {
    if (err) {
      res.render("login.ejs", { error_msg: err });
    }
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, response) => {
        if (response) {
          req.session.user = result;
          console.log(req.session.user[0].isAdmin);
          res.redirect("/");
        } else {
          res.render("login.ejs", { error_msg: "Invalid Credentials !" });
          logger.log(
            "error",
            `unsuccessful login attempt invalid cresentials for ${email}.`
          );
        }
      });
    } else {
      res.render("login.ejs", { error_msg: "User Does Not Exist" });
      logger.log(
        "error",
        `unsuccessful login attempt email ${email} does not exist.`
      );
    }
  });
});



app.get("/LogOut", (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) console.log(err);
      res.redirect("/Login");
    });
  } else {
    res.redirect("/Login");
  }
});

app.listen(PORT);
logger.log("info", `application start on port ${PORT}`);
