const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MySQL connection
const connection = mysql.createConnection({
    host: 'sql7.freesqldatabase.com',
    user: 'sql7712441',
    password: '5tFX2gy6vL',
    database: 'sql7712441'
});


connection.connect((err) => {
    if (err) {
      console.error('Error connecting to database:', err.stack);
      return;
    }
  
    console.log('Connected to database as id', connection.threadId);
  });
  
// JWT secret key
const secretKey = 'your_secret_key';

// API endpoints

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!result) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '1h' });

      res.json({ token });
    });
  });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  });
};

// Protected route example
app.get('/profile', verifyToken, (req, res) => {
  // Retrieve user profile based on userId from decoded token
  const userId = req.userId;

  // Query user profile from database using userId

  res.json({ userId });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
