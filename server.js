const express = require('express');
const app = express();
const bcrypt = require('bcrypt')
const PORT = process.env.PORT || 3000;
const sql = require('./sql/sql');
const flash = require('express-flash')
const session = require('express-session');
app.use(flash())
app.use(session({
    key: 'userId',
    secret: 'VeryBigSecret',
    resave: false,
    saveUninitialized: false,

}))

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended: true})); 
app.use(express.json());
var path = require('path');
var dir = path.join(__dirname, 'views/');
app.use(express.static(dir));

app.get('/', (req,res) => {
  if(req.session.user) {
    if(req.session.user[0].isAdmin === 0){ 
      res.render('index', {
        name: req.session.user[0].name

    }
      
      )}

      else{
        res.render('index2', {
          name: req.session.user[0].name
  
      }
        )}
  } else {
      res.redirect('/Login')
  }
})


app.get('/Login', (req, res) => {
    if(!req.session.user) {
        res.render('login', {error_msg:""})
    } else {
        res.redirect('/')
    }
})

app.get('/signup', (req, res) => {
    if(!req.session.user) {
        res.render('register',{error_msg: ""})
    } else {
        res.redirect('/')
    }
})

app.post('/signup', (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const country = req.body.country;
    const ainterest = req.body.ainterest;
    const email = req.body.email;
    const password = req.body.password;
    const isadmin = req.body.isadmin;


    // Checking if the email is already available
    sql.query('SELECT * FROM users WHERE email = ?;',[email], (err, result) => {
      if(err) {
        res.render("register.ejs", { error_msg: err})
      }
      if(result.length > 0) {
        res.render("register.ejs", { error_msg: "User Exist Try to Login"})
      } else {
        bcrypt.hash(password, 10,(err, data) => {
          if(err) console.error(err)
          sql.query(`INSERT INTO users ( email , password, isAdmin ) VALUES ('${email}', '${data}', '${isadmin}')`, (err) => {
              if(err) console.log(err)
          })
        /*  
         
        */
          sql.query('SELECT * FROM users WHERE email = ?;',[email], (err, result) => {
            if(err) {
              res.render("register.ejs", { error_msg: err})
            }
            if(result.length > 0) {
              bcrypt.compare(password,result[0].password, (err,response) => {
                if(response) {
                  req.session.user = result;
                  res.redirect('/')
                } else {
                  res.render("register.ejs", { error_msg: "Something Went Wrong Try Creating A New Account"})
                }
              })
            } else {
              res.render("register.ejs", { error_msg: "Something Went Wrong Try Creating A New Account"})
            }
          }
        ) 
      })
      sql.query(`INSERT INTO personalinfo ( firstname , lastname, ainterest, country ) VALUES ('${firstname}', '${lastname}', '${ainterest}', '${country}')`, (err) => {
        if(err) console.log(err)
    }) 
      }
    }
  )
})

app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    sql.query('SELECT * FROM users WHERE email = ?;',[email], (err, result) => {
        if(err) {
          res.render("login.ejs", { error_msg: err})
        }
        if(result.length > 0) {
          bcrypt.compare(password,result[0].password, (err,response) => {
            if(response) {
              req.session.user = result;
              console.log(req.session.user[0].isAdmin)
              res.redirect('/')
            } else {
              res.render("login.ejs", { error_msg: "Credentials Are Invalid"})
            }
          })
        } else {
          res.render("login.ejs", { error_msg: "User Does Not Exist"})
        }
      }
    )
})


app.get('/LogOut', (req, res) => {
  if(req.session.user) {
    req.session.destroy(err => {
      if(err) console.log(err)
      res.redirect('/Login')
    });
  } else {
    res.redirect('/Login')
  }
})

app.listen(PORT, () => console.log(`listening on ${PORT}`))