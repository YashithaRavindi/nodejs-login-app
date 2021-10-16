const express = require('express')
const app = express()
const bcrypt = require("bcrypt")

const users = []

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false}))

app.get('/', (req, res) => {
    res.render('index.ejs', {name: 'Yashitha'})
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.get('/register', (req, res) => {
    res.render('register.ejs')
})

app.post('/register', async(req, res) => {
    try{
       const hashedPassword = bcrypt.hash(req.body.password, 10)
    }
       catch{

       }
    res.body.email
})

app.listen(3000)