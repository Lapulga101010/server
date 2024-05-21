// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const PORT = 3000;
const corsOptions = {
    origin: '*', 
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
  };
  app.use(cors(corsOptions));
// Configurer body-parser pour gérer les données POST
app.use(bodyParser.json());

// Configurer la connexion à la base de données MySQL
const db = mysql.createConnection({
    host: "89.116.38.84",
    user: "Metagroupe2",
    password: "Metagroupe@1997",
    database: "myapp",
});

db.connect(err => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connecté à la base de données MySQL');
  }
});
console.log(db.state);

// Route pour vérifier l'état du serveur
app.get('/check-server', (req, res) => {
  if (db.state === 'connected') {
    res.json({ status: 'connected' });
  } else {
    res.json({ status: 'not connected' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
