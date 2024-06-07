const express = require('express');
const session = require('express-session');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Connexion à la base de données MySQL
const db = mysql.createConnection({
  host: 'sql7.freesqldatabase.com',
  user: 'sql7712441',
  password: '5tFX2gy6vL',
  database: 'sql7712441'
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});



// Route de connexion
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, result) => {
    if (err) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    } else if (result.length === 1) {
      req.session.user = result[0];
      res.status(200).json({ success: true, message: 'Login successful', user: result[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  });
});

// Route de vérification de la session
app.get('/checkSession', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ success: true, user: req.session.user });
  } else {
    res.status(401).json({ success: false, message: 'User not logged in' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
