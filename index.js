// server.js

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Configuration de MySQL
const connection = mysql.createConnection({
    host: 'sql7.freesqldatabase.com',
    user: 'sql7712441',
    password: '5tFX2gy6vL',
    database: 'sql7712441'
});

connection.connect();

// Middleware pour parser le corps des requêtes
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware pour gérer les sessions
app.use(session({
  secret: 'your_secret_key',
  resave: true,
  saveUninitialized: true
}));

// Endpoint de connexion
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  connection.query('SELECT * FROM user WHERE username = ?', [username], (error, results) => {
    if (error) throw error;
    
    if (results.length > 0) {
      const user = results[0];
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
          req.session.user = user;
          res.send({ success: true, message: 'Authentication successful' });
        } else {
          res.send({ success: false, message: 'Incorrect username or password' });
        }
      });
    } else {
      res.send({ success: false, message: 'User not found' });
    }
  });
});

// Vérifier l'état de la session
app.get('/checkSession', (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});
// server.js

// Endpoint pour récupérer les informations de l'utilisateur connecté
app.get('/getUserInfo', (req, res) => {
    if (req.session.user) {
      res.send({ user: req.session.user });
    } else {
      res.status(401).send({ message: 'User not logged in' });
    }
  });
  
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
