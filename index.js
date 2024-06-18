const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST","DELETE"]
  }
});

const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3001', // Assurez-vous que cela pointe vers votre frontend
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true // Autorise l'envoi de cookies avec les requêtes
}));

// Configuration de la session avec express-mysql-session
const sessionStore = new MySQLStore({
  host: "89.116.38.84",
  user: "Metagroupe2",
  password: "Metagroupe@1997",
  database: 'session_store', // Nom de votre base de données pour stocker les sessions
  schema: {
    tableName: 'sessions' // Nom de la table de sessions
  }
});

app.use(session({
  key: "userId",
  secret: "secret",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 24 * 1000 // Durée de vie du cookie de session en millisecondes (1 jour ici)
  }
}));

// Connexion à la base de données MySQL
const db = mysql.createConnection({
  host: "89.116.38.84",
  user: "Metagroupe2",
  password: "Metagroupe@1997",
  database: 'app'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Middleware pour vérifier l'authentification de l'admin
const isAdmin = (req, res, next) => {
  console.log("Session Admin: ", req.session.admin);
  if (req.session.admin) {
    next();
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
};

// Route pour l'enregistrement d'un utilisateur
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    const sql = 'INSERT INTO user (username, password) VALUES (?, ?)';
    db.query(sql, [username, hash], (err, result) => {
      if (err) throw err;
      res.send({ message: 'User registered' });
    });
  });
});

// Route pour l'authentification d'un utilisateur
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM user WHERE username = ?';
  db.query(sql, [username], (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, response) => {
        if (response) {
          req.session.user = result[0]; // Stocker l'utilisateur dans la session
          res.send({ loggedIn: true, user: result[0] });
        } else {
          res.send({ loggedIn: false, message: 'Wrong username/password combination!' });
        }
      });
    } else {
      res.send({ loggedIn: false, message: 'User doesn\'t exist' });
    }
  });
});

// Route pour l'authentification d'un administrateur
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM admin WHERE username = ?';
  db.query(sql, [username], (err, result) => {
    if (err) {
      console.error('Error retrieving admin:', err);
      res.status(500).send({ loggedIn: false, message: 'Internal server error' });
      return;
    }
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (err, response) => {
        if (response) {
          req.session.admin = result[0]; // Stocker l'admin dans la session
          console.log('Admin logged in:', result[0].username);
          res.send({ loggedIn: true, admin: result[0] });
        } else {
          console.log('Invalid username/password combination for admin:', username);
          res.send({ loggedIn: false, message: 'Wrong username/password combination!' });
        }
      });
    } else {
      console.log('Admin not found:', username);
      res.send({ loggedIn: false, message: 'Admin doesn\'t exist' });
    }
  });
});

// Route pour la déconnexion d'un administrateur
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.send({ loggedOut: true });
});

// Route pour récupérer l'état de l'authentification d'un utilisateur
app.get('/login', (req, res) => {
  if (req.session.user || req.session.admin) {
    // Si l'utilisateur ou l'admin est connecté, renvoyer les détails de l'utilisateur/admin
    if (req.session.user) {
      res.send({ loggedIn: true, user: req.session.user });
    } else if (req.session.admin) {
      res.send({ loggedIn: true, admin: req.session.admin });
    }
  } else {
    // Aucun utilisateur ou admin n'est connecté
    res.send({ loggedIn: false });
  }
});

// Route pour récupérer tous les programmes
app.get('/programme', (req, res) => {
  const sql = 'SELECT * FROM programme';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});
// Route pour récupérer tous les programmes
app.get('/abs', (req, res) => {
  const sql = 'SELECT * FROM abs';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});
// Route pour créer un programme
app.post('/programme', isAdmin, (req, res) => {
  const { cours, jour, heure, min } = req.body;
  const sql = 'INSERT INTO programme (cours, jour, heure, min) VALUES (?, ?, ?, ?)';
  db.query(sql, [cours, jour, heure, min], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Programme created' });
  });
});

// Route pour mettre à jour un programme
app.put('/programme/:id', isAdmin, (req, res) => {
  const programmeId = req.params.id;
  const { cours, jour, heure, min } = req.body;
  const sql = 'UPDATE programme SET cours = ?, jour = ?, heure = ?, min = ? WHERE id = ?';
  db.query(sql, [cours, jour, heure, min, programmeId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Programme updated' });
  });
});

// Route pour supprimer un programme
app.delete('/programme/:id', isAdmin, (req, res) => {
  const programmeId = req.params.id;
  const sql = 'DELETE FROM programme WHERE id = ?';
  db.query(sql, [programmeId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Programme deleted' });
  });
});
app.get('/EleveA', (req, res) => {

  const sql = 'SELECT * FROM eleve where id_p = ?';
  const user =req.session.user.id;
  console.log(user);
  db.query(sql,[user],(err, results) => {
  if (err) throw err;
  res.send(results);
  });
  });
// Route pour récupérer tous les élèves
app.get('/eleve', isAdmin, (req, res) => {
  const sql = 'SELECT * FROM eleve';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// Route pour créer un élève
app.post('/eleve', isAdmin, (req, res) => {
  const { id_p, nom, prenom } = req.body;
  const sql = 'INSERT INTO eleve (id_p, nom, prenom) VALUES (?, ?, ?)';
  db.query(sql, [id_p, nom, prenom], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Eleve created' });
  });
});

// Route pour mettre à jour un élève
app.put('/eleve/:id', isAdmin, (req, res) => {
  const eleveId = req.params.id;
  const { id_p, nom, prenom,date_exp } = req.body;
  const sql = 'UPDATE eleve SET id_p = ?, nom = ?, prenom = ? ,date_exp = ? WHERE id = ?';
  db.query(sql, [id_p, nom, prenom,date_exp, eleveId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Eleve updated' });
  });
});

// Route pour supprimer un élève
app.delete('/eleve/:id', isAdmin, (req, res) => {
  const eleveId = req.params.id;
  const sql = 'DELETE FROM eleve WHERE id = ?';
  db.query(sql, [eleveId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Eleve deleted' });
  });
});

// Route pour créer un utilisateur (accessible uniquement par l'admin)
app.post('/users', isAdmin, (req, res) => {
  const { username, password, nom, prenom, email, telephone } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    const sql = 'INSERT INTO user (username, password, nom, prenom, email, tel) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, hash, nom, prenom, email, telephone], (err, result) => {
      if (err) throw err;
      res.send({ message: 'User created' });
    });
  });
});

// Route pour récupérer tous les utilisateurs (accessible uniquement par l'admin)
app.get('/users', isAdmin, (req, res) => {
  const sql = 'SELECT * FROM user';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// Route pour mettre à jour un utilisateur (accessible uniquement par l'admin)
app.put('/users/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  const { username, nom, prenom, email, telephone } = req.body;
  const sql = 'UPDATE user SET username = ?, nom = ?, prenom = ?, email = ?, telephone = ? WHERE id = ?';
  db.query(sql, [username, nom, prenom, email, telephone, userId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'User updated' });
  });
});

// Route pour supprimer un utilisateur (accessible uniquement par l'admin)
app.delete('/users/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  const sql = 'DELETE FROM user WHERE id = ?';
  db.query(sql, [userId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'User deleted' });
  });
});
app.get('/absences', (req, res) => {
  const sql = `
    SELECT abs.*, eleve.nom AS eleve_nom, eleve.prenom AS eleve_prenom
    FROM abs
    JOIN eleve ON abs.id_u = eleve.id`;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

app.post('/absences', (req, res) => {
  const { id_u, id_cours, date_abs,id_p } = req.body;
  console.log('id_p :' + id_p);
  const sql = 'INSERT INTO abs (id_u, id_cours, date_abs) VALUES (?, ?, ?)';
  db.query(sql, [id_u, id_cours, date_abs], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Absence ajoutée' });
    
    // Émettre un événement 'absenceAdded' à tous les clients connectés
    io.emit('absenceAdded', { id_u, id_cours, date_abs,id_p});
    console.log('Événement "absenceAdded" émis vers les clients');
  });
});

// Route pour mettre à jour une absence
app.put('/absences/:id', (req, res) => {
  const absenceId = req.params.id;
  const { id_u, cours, date_abs } = req.body;
  const sql = 'UPDATE abs SET id_u = ?, id_cours = ?, date_abs = ? WHERE id = ?';
  db.query(sql, [id_u, cours, date_abs, absenceId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Absence mise à jour' });
  });
});

// Route pour supprimer une absence
app.delete('/absences/:id', (req, res) => {
  const absenceId = req.params.id;
  const sql = 'DELETE FROM abs WHERE id = ?';
  db.query(sql, [absenceId], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Absence supprimée' });
  });
});

// Routes for abonnements
app.get('/abonnements', (req, res) => {
  const sql = `
    SELECT abb.*, eleve.nom AS eleve_nom, eleve.prenom AS eleve_prenom
    FROM abb
    JOIN eleve ON abb.id_u = eleve.id`;
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

app.post('/abonnements', (req, res) => {
  const { id_u, date_abb, date_exp } = req.body;

  // SQL query to insert into abb table
  const sql1 = 'INSERT INTO abb (id_u, date_abb, date_exp) VALUES (?, ?, ?)';
  // SQL query to update eleve table
  const sql2 = 'UPDATE eleve SET date_exp = ? WHERE id = ?';

  // Execute the first SQL query to insert into abb table
  db.query(sql1, [id_u, date_abb, date_exp], (err1, result1) => {
    if (err1) {
      // Handle error for first query
      throw err1;
    }

    // Execute the second SQL query to update eleve table
    db.query(sql2, [date_exp, id_u], (err2, result2) => {
      if (err2) {
        // Handle error for second query
        throw err2;
      }

      // Both queries executed successfully, send response
      res.send({ message: 'Abonnement ajouté' });
    });
  });
});


app.put('/abonnements/:id', (req, res) => {
  const { id } = req.params;
  const { id_u, date_abb, date_exp } = req.body;
  const sql = 'UPDATE abb SET id_u = ?, date_abb = ?, date_exp = ? WHERE id = ?';
  db.query(sql, [id_u, date_abb, date_exp, id], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Abonnement mis à jour' });
  });
});

app.delete('/abonnements/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM abb WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.send({ message: 'Abonnement supprimé' });
  });
});


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
