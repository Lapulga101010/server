// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
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

// Connecter à la base de données
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Route pour vérifier l'état du serveur
app.get('/check-server', (req, res) => {
  
    res.json({ status: 'connected' });
  

});


// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
