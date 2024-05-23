const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());
app.use(cors()); // Ajout du middleware CORS

// Configuration de la connexion MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'myapp'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Route d'inscription
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) throw err;
    res.json({ message: 'User registered' });
  });
});

// Route de connexion
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = results[0];
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id }, 'secret_key', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  });
});

// Middleware de vérification du token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided' });

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Route de déconnexion
app.post('/logout', authenticateToken, (req, res) => {
  // Invalider le token côté client
  res.json({ message: 'Logout successful' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
