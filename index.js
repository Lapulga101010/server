const express = require("express");
const http = require('http');
const mysql = require("mysql2");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require('bcryptjs');
const socketIo = require('socket.io');
const nodemailer = require("nodemailer");
const app = express();
app.use(cookieParser());
app.use(express.json());

const server = http.createServer(app);

app.use(cors({
    origin:["http://localhost:3000"],
    methods : ["POST, GET, DELETE"],
    credentials : true
}
));


const db = mysql.createConnection({
  host: "89.116.38.84",
  user: "Metagroupe2",
  password: "Metagroupe@1997",
  database: "tensikde",
});

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST","DELETE"]
  }
});



io.on('connection', (socket) => {
  console.log('Nouvelle connexion socket');
  socket.on('exampleEvent', (data) => {
    console.log(data);
  });
});





app.get('/vider', (req, res) => {
  const dossierUpload = 'upload'; // Remplacez par le chemin réel

  // Récupérez la liste des fichiers dans le dossier "upload"
  const fichiersDansLeDossier = fs.readdirSync(dossierUpload);

  // Récupérez la liste des fichiers dans la base de données
  const query = 'SELECT file FROM messages';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Erreur lors de la récupération des fichiers depuis la base de données:', err);
      res.status(500).send('Erreur du serveur');
    } else {
      const fichiersDansLaBase = result.map((row) => row.file);

      // Comparez les deux listes de fichiers
      const fichiersNonReferencies = fichiersDansLeDossier.filter(
        (fichier) => !fichiersDansLaBase.includes(fichier)
      );

      // Supprimez les fichiers non référencés
      fichiersNonReferencies.forEach((fichier) => {
        const cheminFichier = path.join(dossierUpload, fichier);
        fs.unlinkSync(cheminFichier);
        console.log(`Fichier supprimé : ${fichier}`);
      });

      res.send('Fichiers supprimés avec succès');
    }
  });
});


app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'upload', filename);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Set appropriate headers for the response
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    // Pipe the file stream to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    // File not found
    res.status(404).send('File not found');
  }
});



app.get('/messages', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    console.log('Token is undefined or not present in the cookies');
    return res.status(401).json({ Message: 'Token is missing' });
  }

  jwt.verify(token, 'metagroupe', (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ Message: 'Auth error' });
    }

    const user = decoded.name;
    const id = decoded.id;

    const sql = `
      SELECT * 
      FROM tensikde.messages 
      INNER JOIN etab ON tensikde.messages.usernameA = etab.CODETAB 
      WHERE tensikde.messages.id_r = ? 
        AND del_m = 0 
        AND (formulaire != 2 OR formulaire IS NULL) 
      ORDER BY date DESC;
    `;

    db.query(sql, [id], (err, data) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ Message: 'Database error' });
      }

      return res.json(data || []); // Retourne les données ou un tableau vide
    });
  });
});



const fs = require('fs'); // Importez le module 'fs'

// Route pour supprimer un fichier

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'upload/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Route pour gérer l'upload de fichiers
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Aucun fichier uploadé.');
  }
  res.send('Fichier uploadé avec succès.');
});

const path = require('path');
app.use(express.json());
const filePath = path.join(__dirname, 'upload/');

app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'upload/', filename);
console.log(filePath);
  // Supprimez le fichier du système de fichiers
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Erreur lors de la suppression du fichier:', err);
      return res.status(500).send(`Erreur lors de la suppression du fichier: ${err.message}`);
    }
    res.send('Fichier supprimé avec succès.');
  });
})





app.post("/send", upload.single("file"), (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Authentification erreur" });
    } else {
      // Extracted variables from the request
      req.name = decoded.name;
      req.id = decoded.id;
      const usertt = req.name;
      const id = req.id;
      const { data } = req.body;
      const { users, groupes, noms, value1, value2, file } = JSON.parse(data);
      const nn = noms.map((nom) => nom.name);
      const role = noms.map((nom) => nom.role);

      // Database queries
      const query =
        "INSERT INTO tensikde.messages (role, de, id_r, username, id_u, usernameA, nom, objet, message, grou_m, file) SELECT role ,?,?,?,?,?,?,?,?,?,? FROM user where id = ?";
      const values = users.map((user) => [
        id,
        user.id,
        user.username,
        id,
        usertt,
        user.nom,
        value1,
        value2,
        null,
        file,
        id
      ]);

      const queryGroupe =
        "INSERT INTO tensikde.messages (username, id_r, id_u, usernameA, objet, message, grou_m, nom, groupe, file) SELECT username, id, ?, ?, ?, ?, ?, ?, ?, ? FROM `user_group_relationship` WHERE group_id = ?";
      const queryGroupe2 =
        "INSERT INTO tensikde.groupe_m (messs) VALUES (?)";

      let groupesProcessed = false;
      let usersProcessed = false;

      function sendResponse() {
        if (groupesProcessed && usersProcessed) {
          res.sendStatus(200);
        }
      }

      // Handling groupes
      if (groupes && groupes.length > 0) {
        db.query(queryGroupe2, id, (error, results) => {
          if (error) {
            console.error(
              "Une erreur s'est produite lors de l'insertion des données :",
              error
            );
            res.sendStatus(500);
          } else {
            const dernierId = results.insertId;
            const valuesG = groupes.map((groupe) => [
              id,
              usertt,
              value1,
              value2,
              dernierId,
              groupe.name,
              groupe.id,
              file,
              groupe.id
            ]);

            db.query(queryGroupe, valuesG.flat(), (error, results) => {
              if (error) {
                console.error(
                  "Une erreur s'est produite lors de l'insertion des données :",
                  error
                );
                groupesProcessed = true;
                sendResponse();
              } else {
                console.log("Données insérées avec succès.");
                io.emit('nouvelUtilisateur');
                groupesProcessed = true;
                sendResponse();
              }
            });
          }
        });
      } else {
        groupesProcessed = true;
        sendResponse();
      }

      // Handling users
      if (users && users.length > 0) {
        db.query(query, values.flat(), (error, results) => {
          if (error) {
            console.error(
              "Une erreur s'est produite lors de l'insertion des données :",
              error
            );
            usersProcessed = true;
            sendResponse();
          } else {
            console.log("Données insérées avec succès.");
            io.emit('form&Sends', { idu: users.map((user) => user.id) }, () => {
              // Le code ici s'exécute lorsque l'événement est émis
            });
            usersProcessed = true;
            sendResponse();
          }
        });
      } else {
        usersProcessed = true;
        sendResponse();
      }
    }
  });
});



const verifyUser = (req,res,next) =>{
    const token = req.cookies.token;

    if(!token){
        return res.json({Message : "Provaide tokken please"});
    }else{
        jwt.verify(token,"metagroupe",(err , decoded)=>{
            if(err){
        return res.json({Message : "Auth err"});
            }
            else{
                req.name = decoded.name;
                next();
            }
        })
    }
}




app.get('/',verifyUser,(req,res)=>{
    return res.json({Status :"Success" ,name:req.name});
})

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
  }else{
    console.log('Connexion à la base de données réussie');
  }

});




app.get('/info',(req,res)=>{
    const token = req.cookies.token;

    if(!token){
        return res.json({Message : "Provaide tokken please"});
    }else{
        jwt.verify(token,"metagroupe",(err , decoded)=>{
            if(err){
        return res.json({Message : "Auth err"});
            }
            else{
                req.name = decoded.name;
                req.id = decoded.id;
            }
        })
    }
    const user = req.name;
    const id = req.id;
    const sql="SELECT * FROM user WHERE id !=?";
    db.query(sql,[id],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })
})

app.get('/ListeStat',(req,res)=>{

  const sql="SELECT * FROM SuiviStat";
  db.query(sql,(err,data)=>{
      if(err) return res.json(data);
      return res.json(data) || [];
      
  })
})

app.get('/ListeStatA',(req,res)=>{

  const sql="SELECT * FROM SuiviStatA";
  db.query(sql,(err,data)=>{
      if(err) return res.json(data);
      return res.json(data) || [];
      
  })
})

app.get('/ListeCantine',(req,res)=>{

  const sql="SELECT * FROM cantine";
  db.query(sql,(err,data)=>{
      if(err) return res.json(data);
      return res.json(data) || [];
  })
})




            

app.get('/getSuiviStat', (req, res) => {
  const token = req.cookies.token;

  if(!token){
      return res.json({Message : "Provaide tokken please"});
  }else{
      jwt.verify(token,"metagroupe",(err , decoded)=>{
          if(err){
      return res.json({Message : "Auth err"});
          }
          else{
              req.name = decoded.name;
              req.id = decoded.id;
          }
      })
  }
  const user = req.name;
  const id = req.id;

  // Récupérez les données existantes de la table SuiviStat depuis votre base de données
  const sql = 'SELECT * FROM SuiviStat where CODETAB = ?'; // Vous pouvez personnaliser votre requête SQL ici

  db.query(sql,[user], (err, data) => {
    if (err) {
      console.error('Erreur lors de la récupération des données SuiviStat :', err);
      res.status(500).send('Erreur lors de la récupération des données SuiviStat');
    } else {
      res.json(data || []);
    }
  });
});

app.get('/getSuiviStatA', (req, res) => {
  const token = req.cookies.token;

  if(!token){
      return res.json({Message : "Provaide tokken please"});
  }else{
      jwt.verify(token,"metagroupe",(err , decoded)=>{
          if(err){
      return res.json({Message : "Auth err"});
          }
          else{
              req.name = decoded.name;
              req.id = decoded.id;
          }
      })
  }
  const user = req.name;
  const id = req.id;

  // Récupérez les données existantes de la table SuiviStat depuis votre base de données
  const sql = 'SELECT * FROM SuiviStatA where CODETAB = ?'; // Vous pouvez personnaliser votre requête SQL ici

  db.query(sql,[user], (err, data) => {
    if (err) {
      console.error('Erreur lors de la récupération des données SuiviStat :', err);
      res.status(500).send('Erreur lors de la récupération des données SuiviStat');
    } else {
      res.json(data || []);
    }
  });
});





app.post('/updateSuiviStat', (req, res) => {
  const token = req.cookies.token;

  if(!token){
      return res.json({Message : "Provaide tokken please"});
  }else{
      jwt.verify(token,"metagroupe",(err , decoded)=>{
          if(err){
      return res.json({Message : "Auth err"});
          }
          else{
              req.name = decoded.name;
              req.id = decoded.id;
          }
      })
  }
  const user = req.name;
  const id = req.id;

  const { balance, cashBalance, total, note } = req.body;

  const sql = 'UPDATE SuiviStat SET SOLDC = ?, SOLD2 = ?, TOT = ?, NOTE = ? WHERE CODETAB = ?';

  db.query(sql, [balance, cashBalance, total, note ,user], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde des données :', err);
      res.status(500).send('Erreur lors de la sauvegarde des données');
    } else {
      console.log('Données sauvegardées avec succès');
      res.sendStatus(200);
    }
  });
});






app.post('/updateSuiviStatA', (req, res) => {
  const token = req.cookies.token;

  if(!token){
      return res.json({Message : "Provaide tokken please"});
  }else{
      jwt.verify(token,"metagroupe",(err , decoded)=>{
          if(err){
      return res.json({Message : "Auth err"});
          }
          else{
              req.name = decoded.name;
              req.id = decoded.id;
          }
      })
  }
  const user = req.name;
  const id = req.id;

  const { compte511, compte512, compte513, total } = req.body;

  const sql = 'UPDATE SuiviStatA SET COMPTE511 = ?, COMPTE512 = ?, COMPTE513 = ?, TOT = ? WHERE CODETAB = ?';

  db.query(sql, [compte511, compte512,compte513, total,user], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde des données :', err);
      res.status(500).send('Erreur lors de la sauvegarde des données');
    } else {
      console.log('Données sauvegardées avec succès');
      res.sendStatus(200);
    }
  });
});





app.post('/cantine', (req, res) => {
  const token = req.cookies.token;

  if(!token){
      return res.json({Message : "Provaide tokken please"});
  }else{
      jwt.verify(token,"metagroupe",(err , decoded)=>{
          if(err){
      return res.json({Message : "Auth err"});
          }
          else{
              req.name = decoded.name;
              req.id = decoded.id;
          }
      })
  }
  const user = req.name;
  const id = req.id;

  const { values,communes} = req.body;

  console.log(values.compte511 ,communes);

  const sql = "INSERT INTO cantine (NeleveCantJ, CODETAB, Commune)VALUES (?, ?, ?)";

  db.query(sql, [values.compte511,user,communes], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde des données :', err);
      res.status(500).send('Erreur lors de la sauvegarde des données');
    } else {
      console.log('Données sauvegardées avec succès');
      res.sendStatus(200);
    }
  });
});




app.post('/updatecantine', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Message: "Provide token please" });
  } else {
    jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
        return res.json({ Message: "Auth error" });
      } else {
        req.name = decoded.name;
        req.id = decoded.id;
      }
    });
  }
  const user = req.name;
  const id = req.id;

  const { compte511 } = req.body;

  // Get today's date as a string in the format 'YYYY-MM-DD'
  const today = new Date().toISOString().split('T')[0];

  const sql = 'UPDATE cantine SET NeleveCantJ = ? WHERE CODETAB = ? and date = ?';

  db.query(sql, [compte511,user ,today], (err, result) => {
    if (err) {
      console.error('Erreur lors de la sauvegarde des données :', err);
      res.status(500).send('Erreur lors de la sauvegarde des données');
    } else {
      console.log('Données sauvegardées avec succès');
      res.sendStatus(200);
    }
  });
});




app.get('/daira', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });


  const user = req.name;
  const id = req.id;
  const sql = "SELECT * FROM Dairas";
  db.query(sql , (err, data) => {
    if (err) {
      return res.json({ Message: "Error retrieving data from the database" });
    }



    return res.json(data) || [];
  });
});


app.get('/etab', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });


  const user = req.name;
  const id = req.id;
  const sql = "SELECT * FROM etab";
  db.query(sql , (err, data) => {
    if (err) {
      return res.json({ Message: "Error retrieving data from the database" });
    }



    return res.json(data) || [];
  });
});

app.get('/commune', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });


  const user = req.name;
  const id = req.id;
  const sql = "SELECT * FROM Communes";
  db.query(sql , (err, data) => {
    if (err) {
      return res.json({ Message: "Error retrieving data from the database" });
    }



    return res.json(data) || [];
  });
});





app.get('/parametre', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });


  const user = req.name;
  const id = req.id;
  const sql = "SELECT * FROM user INNER JOIN etab ON user.username = etab.CODETAB WHERE user.id = ? ";
  db.query(sql, [id], (err, data) => {
    if (err) {
      return res.json({ Message: "Error retrieving data from the database" });
    }



    return res.json(data) || [];
  });
});










app.get('/abs',(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });


  const user = req.name;
  const sql="SELECT * FROM abcences WHERE PRIMAIRE = ?";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})

app.get('/abs_down',(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });


  const user = req.name;

  const sql="SELECT * FROM abcences ";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})

app.get('/note_down',(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });


  const user = req.name;

  const sql="SELECT * FROM note ";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})

app.post('/up', (req, res) => {

  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });
  const user = req.name;
  const id = req.id;
  const { nom, prenom, telephone } = req.body;

  // Update user data in the MySQL database
  const sql = 'UPDATE user SET nom=?, prenom=?, telephone=? WHERE id=?';

  db.query(sql, [nom, prenom, telephone, id], (err, results) => {
    if (err) {
      console.error('Error updating user data: ' + err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User data updated successfully' });
  });
});


app.post('/updateEtablissement', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });

  const user = req.name;
  const id = req.id;
  const { sante, fax, commune, daira, email, telFix, cantine, typer ,LIBETAB,LIBETABA } = req.body; // Include "cantine" and "typer" fields

  // Update etablissement data in the MySQL database
  const sql = 'UPDATE etab SET sente=?, fax=?, commune=?, daira=?, email=?, tel_fix=?, cantine=?, typer=? ,LIBETAB = ? ,LIBETABA = ? WHERE CODETAB=?';

  db.query(sql, [sante, fax, commune, daira, email, telFix, cantine, typer ,LIBETAB,LIBETABA, user], (err, results) => {
    if (err) {
      console.error('Error updating etablissement data: ' + err.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Etablissement not found' });
    }

    return res.status(200).json({ message: 'Etablissement data updated successfully' });
  });
});






app.get('/note',(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });


  const user = req.name;

  const sql="SELECT * FROM note WHERE primaire = ?";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})


app.post('/abs_update', (req, res) => {
  const token = req.cookies.token;

  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      const id = decoded.id; // Move the ID extraction inside the else block
      const data = req.body;

      data.forEach(item => {
        const { VMAT, ABS, MAL, GREVE } = item;
        const updateQuery = `UPDATE abcences SET ABS = ${ABS}, MAL = ${MAL}, GREVE = ${GREVE} WHERE VMAT = '${VMAT}';`;
        db.query(updateQuery, (err, result) => {
          if (err) {
            console.error('Erreur lors de la mise à jour des données:', err);
          } else {
            console.log('Données mises à jour avec succès !');
          }
        });
      });

      // Update user's 'abs' field to '1'
      const updateUserQuery = `UPDATE user SET abs = '1' , r_abs= 0 WHERE id = ${id};`;
      db.query(updateUserQuery, (err, result) => {
        if (err) {
          console.error('Erreur lors de la mise à jour de l\'absence de l\'utilisateur:', err);
        } else {
          console.log('Champ "abs" de l\'utilisateur mis à jour avec succès !');
        }
      });

      res.json({ message: 'Mise à jour réussie' });
    }
  });
});



app.post('/statut_abs', (req, res) => {
  const abs = req.body.note; // Accéder à la note à partir du corps de la requête
  const updateQuery = 'UPDATE statut_abs_note SET abs = ?';

  db.query(updateQuery, [abs], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des données :', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    } else {
      console.log('Données mises à jour avec succès !');
      // Émettre un événement "abs" via Socket.IO
      io.emit('abs', { message: 'Données mises à jour', abs });
      res.json({ message: 'Mise à jour réussie' });
    }
  });
});



app.post('/statut_suivi', (req, res) => {

  const abs = req.body.abs; // Access the 'abs' value from the request body
  const updateQuery = 'UPDATE statut_suivi_suiviA SET suivi = ?';

  db.query(updateQuery, [abs], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des données :', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    } else {
      console.log('Données mises à jour avec succès !');
      res.json({ message: 'Mise à jour réussie' });
    }
  });
});

app.post('/statut_suiviA', (req, res) => {

  const abs = req.body.abs; // Access the 'abs' value from the request body
  const updateQuery = 'UPDATE statut_suivi_suiviA SET suiviA = ?';

  db.query(updateQuery, [abs], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des données :', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    } else {
      console.log('Données mises à jour avec succès !');
      res.json({ message: 'Mise à jour réussie' });
    }
  });
});


app.post('/Reset_suivi', (req, res) => {

  const abs = req.body.abs; // Access the 'abs' value from the request body
  const updateQuery = 'UPDATE SuiviStat SET SOLDC = 0 , SOLD2 = 0 , TOT = 0 , NOTE= " " ';

  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des données :', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    } else {
      console.log('Données mises à jour avec succès !');
      res.json({ message: 'Mise à jour réussie' });
    }
  });
});

app.post('/Reset_abs', (req, res) => {
  const updateQuery = 'UPDATE abcences SET ABS = 0, MAL = 0, GREVE = 0;';

  db.beginTransaction(function (err) {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Error starting transaction' });
    }

    db.query(updateQuery, function (err, result) {
      if (err) {
        return db.rollback(function () {
          console.error('Error updating abcences:', err);
          res.status(500).json({ error: 'Error updating abcences' });
        });
      }

      const updateUserQuery = 'UPDATE user SET abs = 0;';

      db.query(updateUserQuery, function (err, result) {
        if (err) {
          return db.rollback(function () {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Error updating user' });
          });
        }

        db.commit(function (err) {
          if (err) {
            return db.rollback(function () {
              console.error('Error committing transaction:', err);
              res.status(500).json({ error: 'Error committing transaction' });
            });
          }

          console.log('Transaction Complete.');
          res.json({ message: 'Mise à jour réussie' });
        });
      });
    });
  });
});


app.post('/Reset_note', (req, res) => {
  const updateQuery = 'UPDATE note SET ABS = 0, NOTE = 0;';

  db.beginTransaction(function (err) {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Error starting transaction' });
    }

    db.query(updateQuery, function (err, result) {
      if (err) {
        return db.rollback(function () {
          console.error('Error updating note:', err);
          res.status(500).json({ error: 'Error updating note' });
        });
      }

      const updateUserQuery = 'UPDATE user SET note = 0;';

      db.query(updateUserQuery, function (err, result) {
        if (err) {
          return db.rollback(function () {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Error updating user' });
          });
        }

        db.commit(function (err) {
          if (err) {
            return db.rollback(function () {
              console.error('Error committing transaction:', err);
              res.status(500).json({ error: 'Error committing transaction' });
            });
          }

          console.log('Transaction Complete.');
          res.json({ message: 'Mise à jour réussie' });
        });
      });
    });
  });
});


app.post('/Reset_suiviA', (req, res) => {

  const abs = req.body.abs; // Access the 'abs' value from the request body
  const updateQuery = 'UPDATE SuiviStatA SET COMPTE511 = 0 , COMPTE512 = 0 , TOT = 0 , COMPTE513= " " ';

  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des données :', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    } else {
      console.log('Données mises à jour avec succès !');
      res.json({ message: 'Mise à jour réussie' });
    }
  });
});



app.post('/statut_note', (req, res) => {
  const note = req.body.note; // Access the 'abs' value from the request body
  const updateQuery = 'UPDATE statut_abs_note SET note = ?';

  db.query(updateQuery, [note], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour des données :', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    } else {
      console.log('Données mises à jour avec succès !');
      io.emit('abs', { message: 'Données mises à jour', note });
      res.json({ message: 'Mise à jour réussie' });
    }
  });
});

app.post('/updateUser', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });


  
  const id = req.id;
  const { nom, prenom, telephone_portable,emailP } = req.body;

  const updateUserQuery = `
    UPDATE user SET
    nom = ?,
    prenom = ?,
    telephone = ?,
    emailP = ?,
    ft = 1
    WHERE id = ?;
  `;

  db.query(updateUserQuery, [nom, prenom, telephone_portable,emailP, id], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur : ', err);
      res.status(500).send('Erreur lors de la mise à jour de l\'utilisateur');
    } else {
      console.log('Utilisateur mis à jour avec succès');
      res.status(200).send('Utilisateur mis à jour avec succès');
    }
  });
});


// Mettre à jour l'établissement
app.post('/updateEtab', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });


  const user = req.name;
  const id = req.id;
  const {appertenace_sente, email, telephone_fixe,Daira,commune,fax,cant,typer,Neleve,NeveleCant, statuscant} = req.body;

  const updateEtabQuery = `
    UPDATE etab SET
    sente = ?,
    email = ?,
    tel_fix = ?,
    daira = ?,
    commune= ?,
    fax = ?,
    cantine = ?,
    typer = ?,
    Neleve = ? ,
    NeveleCantE = ?,
    statuscant = ?
    WHERE CODETAB = ?;
  `;

  db.query(updateEtabQuery, [appertenace_sente, email, telephone_fixe,Daira,commune,fax, cant,typer,Neleve,NeveleCant, statuscant,user], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de l\'établissement : ', err);
      res.status(500).send('Erreur lors de la mise à jour de l\'établissement');
    } else {
      console.log('Établissement mis à jour avec succès');
      res.status(200).send('Établissement mis à jour avec succès');
    }
  });
});

app.post('/note_update', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.id = decoded.id;
    }
  });

  const id = req.id;
  const data = req.body; // Move this line outside of the forEach loop
  
  data.forEach(item => {
    const { VMAT, NOTE, ABS } = item;

    // Update note table
    const updateNoteQuery = `UPDATE note SET NOTE = ${NOTE}, ABS = ${ABS} WHERE VMAT = '${VMAT}'`;
    db.query(updateNoteQuery, (err, result) => {
      if (err) {
        console.error('Erreur lors de la mise à jour des données dans la table note:', err);
      } else {
        console.log('Données mises à jour dans la table note avec succès !');
      }
    });

    // Update user table to set 'abs' field to '1'
    const updateUserQuery = `UPDATE user SET note='1',r_note=0 WHERE id = ${id}`;
    db.query(updateUserQuery, (err, result) => {
      if (err) {
        console.error('Erreur lors de la mise à jour des données dans la table user:', err);
      } else {
        console.log('Données mises à jour dans la table user avec succès !');
      }
    });
  });

  res.json({ message: 'Mise à jour réussie' });
});


app.get('/messagesL' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;

  const sql="SELECT * FROM messages WHERE username = ? AND lu = 0 ";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})




app.get('/del_m' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  });
  const id = req.id;

const user = req.name;

  const sql="SELECT * FROM messages INNER JOIN etab ON messages.usernameA = etab.CODETAB WHERE messages.id_r = ? and del_m=1 order by date DESC";
  db.query(sql,[id],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})

app.get('/save_m' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
          req.id = decoded.id;

         
      }
  })
const user = req.name;
const id = req.id;
console.log(id);
  const sql="SELECT * FROM save_m INNER JOIN etab ON save_m.usernameA = etab.CODETAB WHERE save_m.id_r = ? order by date DESC ";
  db.query(sql,[id],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})

app.get('/messagesS', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
          return res.json({ Message: "Auth err" });
      } else {
          req.id = decoded.id;
      }
  });

  const user = req.id;
  const sql = `
      SELECT 
          messages.*, 
          etab.*, 
          user.role 
      FROM 
          messages 
      INNER JOIN 
          etab 
          ON messages.username = etab.CODETAB 
      INNER JOIN 
          user 
          ON messages.id_r = user.id 
      WHERE 
          messages.id_u = ? 
          AND messages.formulaire IS NULL 
      ORDER BY 
          messages.date DESC
  `;

  db.query(sql, [user], (err, data) => {
      if (err) {
          return res.json({ error: err.message });
      }
      return res.json(data || []);
  });
});


app.get('/forms' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;
  const sql="SELECT * FROM `messages` INNER JOIN etab ON messages.username = etab.CODETAB WHERE messages.usernameA = ? and  messages.formulaire != 0 order by date DESC ";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.post('/deleteGroups', (req, res) => {
  const groupIDsToDelete = req.body.groups;
console.log(groupIDsToDelete);
  if (!groupIDsToDelete || !Array.isArray(groupIDsToDelete)) {
    return res.status(400).json({ error: 'Invalid data' });
  }
console.log(groupIDsToDelete);
  const deleteGroupQuery = "DELETE FROM `groups` WHERE id IN (?)";
  const deleteUserGroupRelationshipQuery = `DELETE FROM user_group_relationship WHERE group_id IN (?)`;

  db.query(deleteUserGroupRelationshipQuery, [groupIDsToDelete], (err, result) => {
    if (err) {
      console.error('Error deleting user-group relationships:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    db.query(deleteGroupQuery, [groupIDsToDelete], (err, result) => {
      if (err) {
        console.error('Error deleting groups:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      console.log('Groups deleted successfully');
      return res.json({ message: 'Groups deleted successfully' });
    });
  });
});



app.get('/form_down/:id', (req, res) => {
  const token = req.cookies.token;

  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
          return res.status(401).json({ Message: "Authentication error" });
      }

      const user = decoded.name; // Extraire le nom d'utilisateur du token
      const userId = req.params.id; // Récupérer l'ID du paramètre d'URL
      const sql = `
          SELECT * 
          FROM messages
          INNER JOIN etab ON messages.username = etab.CODETAB
          INNER JOIN valform ON messages.id_m = valform.id_m
          WHERE messages.usernameA = ? AND valform.id_m = ?
          ORDER BY id_f ASC
      `;

      // Exécuter la requête SQL
      db.query(sql, [user, userId], (err, data) => {
          if (err) {
              console.error("Erreur lors de l'exécution de la requête SQL :", err);
              return res.status(500).json({ Message: "Erreur serveur" });
          }

          console.log("Données récupérées :", data);
          return res.json(data || []);
      });
  });
});




app.get('/form_downG/:id', (req, res) => {
  const token = req.cookies.token;

  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
          return res.status(401).json({ Message: "Authentication error" });
      }

      const user = decoded.name; // Extraire le nom d'utilisateur du token
      const userId = req.params.id; // Récupérer l'ID du paramètre d'URL
      const sql = `
          SELECT * 
         FROM valform
          INNER JOIN etab ON valform.username = etab.CODETAB
          WHERE valform.id_gm = ?
          ORDER BY id_f ASC
      `;

      // Exécuter la requête SQL
      db.query(sql, [userId], (err, data) => {
          if (err) {
              console.error("Erreur lors de l'exécution de la requête SQL :", err);
              return res.status(500).json({ Message: "Erreur serveur" });
          }

          console.log("Données récupérées :", data);
          return res.json(data || []);
      });
  });
});


app.get('/gr' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;
  const sql="SELECT * FROM user INNER JOIN groupes ON user.groupe = groupes.id WHERE user.username = ?";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.post("/updateAbs", (req, res) => {
  const VMAT = req.body.VMAT;

  const query = "UPDATE user SET abs = 1 WHERE VMAT = ?";

    db.query(query, [VMAT], (err, result) => {
    if (err) {
      console.error("Error updating ABS:", err);
      res.status(500).json({ error: "Error updating ABS" });
    } else {
      console.log("ABS updated successfully!");
      res.json({ success: true });
    }
  });
});

app.get('/statut' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;
  const sql="SELECT * FROM `statut_abs_note`";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.get('/statutSuivi' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;
  const sql="SELECT * FROM `statut_suivi_suiviA`";
  db.query(sql,(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.get('/statutSuiviA' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;
  const sql="SELECT * FROM `statut_suivi_suiviA`";
  db.query(sql,(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.get('/mes/:id_m' ,(req,res)=>{
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
           
        }
    })
    const userId = req.params.id_m;

const user = req.name;

    const sql="SELECT * FROM messages INNER JOIN etab ON messages.usernameA = etab.CODETAB WHERE id_m = ? or grou_m = ? and username = ?";

    db.query(sql,[userId,userId,user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data)|| [];
        
    })
})

app.get('/forval/:id_m' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
  const userId = req.params.id_m;

const user = req.name;

  const sql="SELECT * FROM valform INNER JOIN etab ON valform.username = etab.CODETAB WHERE id_m = ?";

  db.query(sql,[userId],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.get('/forvalG/:id_m' ,(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
  const userId = req.params.id_m;

const user = req.name;

  const sql="SELECT * FROM valform INNER JOIN etab ON valform.username = etab.CODETAB WHERE grou_m = ?";

  db.query(sql,[userId],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

app.get('/for/:id_m' ,(req,res)=>{
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
           
        }
    })
    const userId = req.params.id_m;

const user = req.name;

    const sql="SELECT * FROM `form_data` INNER JOIN messages ON  form_data.id_m=messages.id_m WHERE form_data.id_m= ? or form_data.groupe= ?  ";

    db.query(sql,[userId,userId],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data)|| [];
        
    })
})

app.post('/val/:id_m', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      const requestData = req.body;
      const formValues = requestData.formValues;
      const inputs = requestData.inputs;
      const userId = req.params.id_m;
      const user = req.name;

      const sql = "INSERT INTO valform (id_m, nom, valeur, username) VALUES ?";

      const values = [];

      formValues.forEach((form) => {
        form.forEach((fo, index) => {
          const input = inputs[index];
          values.push([userId, input.name, fo, user]);
        });
      });

      // Execute the INSERT INTO statement
      db.query(sql, [values], (err, result) => {
        if (err) {
          console.error("Error inserting data: ", err);
          return res.json({ Message: "Error inserting data" });
        }

        // Execute the UPDATE statement
        const updateSql = "UPDATE `messages` SET formulaire = '2' where id_m = ?";
        db.query(updateSql, [userId], (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating data: ", updateErr);
            return res.json({ Message: "Error updating data" });
          }

          // Both the INSERT and UPDATE queries were successful
          io.emit('valForm', { idu: userId }, () => {
            // Le code ici s'exécute lorsque l'événement est émis
        
          });
          return res.json({ Message: "Data inserted and updated successfully" });
        });
      });
    }
  });
});
app.post('/valG/:id_m', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      const requestData = req.body;
      const formValues = requestData.formValues;
      const inputs = requestData.inputs;
      const id = requestData.id_gm;
      const userId = req.params.id_m;
      const user = req.name;

      const sql = "INSERT INTO valform (id_gm, nom, valeur, username) VALUES ?";

      const values = [];

      formValues.forEach((form) => {
        form.forEach((fo, index) => {
          const input = inputs[index];
          values.push([userId, input.name, fo, user]);
        });
      });

      // Execute the INSERT INTO statement
      db.query(sql, [values], (err, result) => {
        if (err) {
          console.error("Error inserting data: ", err);
          return res.json({ Message: "Error inserting data" });
        }

        // Execute the UPDATE statement
        const updateSql = "UPDATE `messages` SET formulaire = '2' where id_m = ?";
        db.query(updateSql, [id], (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating data: ", updateErr);
            return res.json({ Message: "Error updating data" });
          }

          // Both the INSERT and UPDATE queries were successful
          io.emit('valForm', { idu: userId }, () => {
            // Le code ici s'exécute lorsque l'événement est émis
        
          });
          return res.json({ Message: "Data inserted and updated successfully" });
        });
      });
    }
  });
});

app.post('/mes_del/:id_m', (req, res) => {

  
  const userId = req.params.id_m;
  const insertQuery = 'INSERT INTO del_m (id_m) SELECT id_m FROM messages WHERE id_m IN (?)';
  const deleteQuery = 'DELETE FROM messages WHERE id_m IN (?)';

  db.query(insertQuery, [userId], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      db.query(deleteQuery, [userId], (deleteErr, deleteResults) => {
        if (deleteErr) {
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.sendStatus(204);
        }
      });
    }
  });

});

app.post('/deleteMebre', (req, res) => {

  const groupIDsToDelete = req.body.groups;
  const Id = req.body.id;
  const deleteUserGroupRelationshipQuery = `DELETE FROM user_group_relationship WHERE group_id = (?) and id=(?)`;

  db.query(deleteUserGroupRelationshipQuery, [groupIDsToDelete,Id], (err, result) => {
    if (err) {
      console.error('Error deleting user-group relationships:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

      
      console.log('Groups deleted successfully');
      return res.json({ message: 'Groups deleted successfully' });
    });
  
});

app.post('/deleteMebre2', (req, res) => {
  const groupIDsToDelete = req.body.groups;
  const userId = req.body.id;

  // Query to delete user-group relationships
  const deleteUserGroupRelationshipQuery = `DELETE FROM user_group_relationship WHERE group_id = ? AND id = ?`;

  // Query to delete the group
  const deleteGroupQuery = "DELETE FROM `groups` WHERE id = ?";

  db.query(deleteUserGroupRelationshipQuery, [groupIDsToDelete, userId], (err, result) => {
    if (err) {
      console.error('Error deleting user-group relationships:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Proceed to delete the group
    db.query(deleteGroupQuery, [groupIDsToDelete], (err, result) => {
      if (err) {
        console.error('Error deleting group:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      console.log('Group and relationships deleted successfully');
      return res.json({ message: 'Group and relationships deleted successfully' });
    });
  });
});



app.post('/mes_save/:id_m', (req, res) => {
  const userId = req.params.id_m;
  console.log(userId);
  console.log('rere');
  const insertQuery = 'INSERT INTO sav_m (id_m) SELECT id_m FROM messages WHERE id_m IN (895);';
  const deleteQuery = 'DELETE FROM messages WHERE id_m IN (?)';

  db.query(insertQuery, [userId], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      db.query(deleteQuery, [userId], (deleteErr, deleteResults) => {
        if (deleteErr) {
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          res.sendStatus(204);
        }
      });
    }
  });
});

app.post('/lu/:id_m', (req, res) => {

  const token = req.cookies.token;

  
  jwt.verify(token,"metagroupe",(err , decoded)=>{
    if(err){
return res.json({Message : "Auth err"});
    }
    else{
        req.id = decoded.id;
    }
})
const id = req.id;
const userId = req.params.id_m;
  const sql = "UPDATE `messages` SET `lu`='1', im = 0 WHERE id_m= ? ";

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Une erreur s\'est produite lors de l\'insertion des données:', error);
      res.sendStatus(500);
    } else {
      io.emit('lu', { idu: id }, () => {
      console.log('lu');
      });     
      res.sendStatus(200);
    }
  });
});

app.post('/changePassword', async (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Authentification échouée" });
    }

    const user = decoded.name;
    const id = decoded.id;
    const { currentPassword, newPassword,confirmPassword } = req.body;
    const sql = 'SELECT * FROM user WHERE id = ?';

    db.query(sql, [id], async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur du serveur lors de la récupération des données de l\'utilisateur' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      const user = results[0];
      let sql2 = '';

      if (user.role == 'Econome') {
        sql2 = 'UPDATE user SET password2 = ? WHERE username = ?';
      } else {
        sql2 = 'UPDATE user SET password = ? WHERE username = ?';
      }

      // Vérification du mot de passe actuel
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect',PW:1 });
      }
      else{ 
        console.log(newPassword,'/',confirmPassword)
        if (newPassword === confirmPassword) {

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Mise à jour du mot de passe dans la base de données
        db.query(sql2, [newPasswordHash, user.username], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Erreur du serveur lors de la mise à jour du mot de passe' });
          }
   else {
            return res.json({ message: 'Mot de passe mis à jour avec succès' });
          }
        });
      }
      else{
        return res.status(500).json({ message: 'le Nouveau mot de passe et la Confirmation sont différents' });
      }
      }


    });
  });
});

const transporter = nodemailer.createTransport({
  service: "gmail", // Par exemple, Gmail
  auth: {
    user: "moh101999@gmail.com",
    pass: "bxxx hlxb mkag mrws", // Attention : utilisez des mots de passe d'application si nécessaire
  },
});


app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // Vérification de l'existence de l'email
  const sql = "SELECT * FROM user WHERE emailP = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error("Erreur lors de la recherche de l'utilisateur :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email" });
    }
    const user = results[0];
      let sql2 = '';

      if (user.role == 'Econome') {
        sql2 = "UPDATE user SET password2 = ? WHERE email = ?";
      } else {
        sql2 ="UPDATE user SET password = ? WHERE email = ?";
      }
    // Générer un nouveau mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8); // Mot de passe de 8 caractères
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Mettre à jour le mot de passe dans la base de données
    const updateSql = 
    db.query(sql2, [hashedPassword, email], (updateErr) => {
      if (updateErr) {
        console.error("Erreur lors de la mise à jour du mot de passe :", updateErr);
        return res.status(500).json({ message: "Erreur lors de la mise à jour du mot de passe" });
      }

      // Envoyer un email avec le mot de passe temporaire
      const mailOptions = {
        from: "Tensikde",
        to: email,
        subject: "Tensikde : Réinitialisation de votre mot de passe",
        text: `Votre nouveau mot de passe temporaire est : ${tempPassword}`,
      };

      transporter.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          console.error("Erreur lors de l'envoi de l'email :", mailErr);
          return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
        }

        res.json({ message: "Un nouveau mot de passe a été envoyé à votre adresse email" });
      });
    });
  });
});


app.get('/user',(req,res)=>{
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
           
        }
    })

    const user = req.name;
    const sql="SELECT * FROM tensikde.user INNER JOIN etab ON user.username = etab.CODETAB WHERE username !=?";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

});

app.get('/show_user',(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })

  const user = req.name;
  const sql="SELECT * FROM user_group_relationship INNER JOIN etab ON user_group_relationship.username = etab.CODETAB";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data) || [];
      
  })

});

app.get('/user_p', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });

  const user = req.name;
  const sql = "SELECT * FROM user INNER JOIN etab ON user.username = etab.CODETAB WHERE username != ? AND etab.type = 'PRIMAIRE' ORDER BY abs DESC";
  
  db.query(sql, [user], (err, data) => {
    if (err) {
      return res.json({ Message: "Error executing query" });
    }
    return res.json(data || []);
  });
});

app.get('/user_pn', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });

  const user = req.name;
  const sql = "SELECT * FROM user INNER JOIN etab ON user.username = etab.CODETAB WHERE username != ? AND etab.type = 'PRIMAIRE' ORDER BY note DESC";
  
  db.query(sql, [user], (err, data) => {
    if (err) {
      return res.json({ Message: "Error executing query" });
    }
    return res.json(data || []);
  });
});

app.post('/relance/:id', (req, res) => {
  const messageId = parseInt(req.params.id);

  const token = req.cookies.token;
const specificId = req.body.id;
  console.log(specificId);
  jwt.verify(token,"metagroupe",(err , decoded)=>{
    if(err){
return res.json({Message : "Auth err"});
    }
    else{
        req.id = decoded.id;
    }
})
const id = req.id;
  // Update the message status in the database
  const query = 'UPDATE messages SET im = 1 , lu = 0,del_m=0,date = NOW() WHERE id_m= ? or grou_m = ? ';

  db.query(query, [messageId,messageId], (error, results) => {
    if (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      io.emit('send', { idu: specificId }, () => {
        // Le code ici s'exécute lorsque l'événement est émis

      });
      res.status(200).json({ message: 'Message status updated successfully' });
    }
  });
});

app.post('/updateRabs', (req, res) => {
  const userId = req.params.userId;
  const updateQuery = `UPDATE user SET r_abs = 1 WHERE r_abs =0 `;

  db.query(updateQuery, [userId], (err, result) => {
      if (err) {
          console.error(err);
          res.status(500).send("Erreur lors de la mise à jour de r_abs");
      } else {
          res.status(200).send("r_abs mis à jour avec succès");
      }
  });
});

app.post('/updateRNote', (req, res) => {
  const updateQuery = `UPDATE user SET r_note = 1 WHERE r_note = 0 AND role != 'Chef de Service'`;

  db.query(updateQuery, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("Erreur lors de la mise à jour de r_abs");
    } else {
      res.status(200).send("r_abs mis à jour avec succès");
    }
  });
});

app.post('/form', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
        req.name = decoded.name;
        req.id = decoded.id;

  
      }
  })
  const usertt = req.name;
  const id = req.id;
  const specificId = req.body.id;
  console.log(specificId);
  const { groupes, users, noms, fields,value1 } = req.body;
  const nn = noms.map((nom) => nom.name);
  const queryGroupe = 'INSERT INTO messages (role,id_r,username,id_u,usernameA,formulaire,objet)  SELECT role ,?,?,?,?,?,? FROM user where id = ?';
  const queryGroupe3 = 'INSERT INTO messages (username, id_r ,id_u, usernameA ,formulaire, grou_m,objet,groupe) SELECT username, id,?, ?, ?, ?, ?,? FROM `user_group_relationship` WHERE  group_id = ?';
  const queryGroupe2 = 'INSERT INTO groupe_m (messs) VALUES (?)';
  const values = users.map((user) => [user.id,user.username,id,usertt,'1',value1,id]);
  const valuesG2 = groupes.map((groupe) => [usertt,groupe.id,'1', groupe.id]);
  let groupesProcessed = false;
  let usersProcessed = false;
  function sendResponse() {
    if (groupesProcessed && usersProcessed) {
      res.sendStatus(200);
    }
  }
  console.log(groupes.length);
if (groupes && groupes.length > 0) {
      db.query(queryGroupe2,  usertt, (error, results) => {
        if (error) {
          console.error("Une erreur s'est produite lors de l'insertion des données :", error);
          res.sendStatus(500);
        } else {
          console.log('Données insérées avec succès.');
     
          const dernierId = results.insertId;
          const valuesG = groupes.map((groupe) => [id, usertt,'1', dernierId,value1 ,groupe.name, groupe.id,groupe.id,groupe.id]);
          db.query(queryGroupe3, valuesG.flat(), (error, results) => {
            if (error) {
              console.error('Une erreur s\'est produite lors de l\'insertion des données :', error);
              res.sendStatus(500);
            } else {
              fields.forEach((field) => {
                const sql2 = 'INSERT INTO form_data (id_m, name, type, options,groupe) VALUES (?, ?, ?, ?, ?)';
                const dernierId2 = results.insertId;
                const values = [dernierId2, field.name, field.fieldType, field.fieldOptions,dernierId];
      
                insertions.push(
                  new Promise((resolve, reject) => {
                    db.query(sql2, values, (error, results) => {
                      if (error) {
                        console.error("Erreur lors de l'insertion des données :", error);
                        reject(error);
                      } else {

                        console.log('Données insérées avec succès dans la base de données.');
                        io.emit('form&Sends', { idu: users.map((user) => user.id) }, () => {
                          // Le code ici s'exécute lorsque l'événement est émis
                        });
                        resolve();
                      }
                    });
                  })
                );
              });
   
              groupesProcessed = true;


              sendResponse();
            }
          });
          const insertions = [];
    


        }
      });
    } else {
      groupesProcessed = true;
    }

    if (users && users.length > 0) {


    db.query(queryGroupe, values.flat(), (error, results) => {
      if (error) {
        console.error("Une erreur s'est produite lors de l'insertion des données :", error);
        res.sendStatus(500);
      } else {
        console.log('Données insérées avec succès.');
  
        const dernierId = results.insertId;
        console.log(results.insertId);
  
        const insertions = [];
  
          fields.forEach((field) => {
            const sql2 = 'INSERT INTO form_data (id_m, name, type, options) VALUES (?, ?, ?, ?)';
            const values = [dernierId, field.name, field.fieldType, field.fieldOptions];
  
            insertions.push(
              new Promise((resolve, reject) => {
                db.query(sql2, values, (error, results) => {
                  if (error) {
                    console.error("Erreur lors de l'insertion des données :", error);
                    reject(error);
                  } else {
                    io.emit('form&Sends', { idu: users.map((user) => user.id) }, () => {
                      // Le code ici s'exécute lorsque l'événement est émis
                    });
                    console.log('Données insérées avec succès dans la base de données.');
                    resolve();
                  }
                });
              })
            );
          });


      }
    });
  } else {
    console.log('vide G');
  }
  

   

  
  res.sendStatus(200);

});

app.post('/trash/:id_m', (req, res) => {
  const token = req.cookies.token;

  
  jwt.verify(token,"metagroupe",(err , decoded)=>{
    if(err){
return res.json({Message : "Auth err"});
    }
    else{
        req.id = decoded.id;
       
    }
})

const id = req.id;
const userId = req.params.id_m;
  const sql = "UPDATE `messages` SET del_m='1' WHERE id_m= ? ";

  const insertQuery = 'INSERT INTO del_m SELECT * FROM messages WHERE id_m = ?';
  const deleteQuery = 'DELETE FROM messages WHERE id_m = ?';

  db.query(sql, [userId], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      io.emit('sup', { idu: id }, () => {
        console.log('Événement "sup" émis pour l\'utilisateur ID:', id);
      });

    }
  });
});

app.post('/trash_sup', (req, res) => {
  const token = req.cookies.token;

  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.status(403).json({ Message: "Auth error" });
    }

    req.name = decoded.name;
    req.id = decoded.id;

    const id = req.id;

    // Mise à jour des éléments dans la table "messages"
    const deleteQuery = 'DELETE messages WHERE del_m = 1 and in_u=?';

    db.query(deleteQuery, [id], (deleteErr, deleteResults) => {
      if (deleteErr) {
        console.error('Erreur lors de la mise à jour de la table "messages" :', deleteErr);
        return res.status(500).json({ error: 'Erreur serveur' });
      } else {
        // Émission de l'événement via socket.io
        io.emit('sup', { idu: id }, () => {
          console.log('Événement "sup" émis pour l\'utilisateur ID:', id);
        });

        // Retourner un statut HTTP 204 (aucun contenu)
        return res.sendStatus(204);
      }
    });
  });
});
app.post('/trash', (req, res) => {
  const token = req.cookies.token;

  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.status(403).json({ Message: "Auth error" });
    }

    req.name = decoded.name;
    req.id = decoded.id;

    const id = req.id;
    const checkedItemIds = req.body; // Les ID des éléments à supprimer

    // Mise à jour des éléments dans la table "messages"
    const deleteQuery = 'UPDATE messages SET del_m = 1 WHERE id_m IN (?)';

    db.query(deleteQuery, [checkedItemIds], (deleteErr, deleteResults) => {
      if (deleteErr) {
        console.error('Erreur lors de la mise à jour de la table "messages" :', deleteErr);
        return res.status(500).json({ error: 'Erreur serveur' });
      } else {
        // Émission de l'événement via socket.io
        io.emit('sup', { idu: id }, () => {
          console.log('Événement "sup" émis pour l\'utilisateur ID:', id);
        });

        // Retourner un statut HTTP 204 (aucun contenu)
        return res.sendStatus(204);
      }
    });
  });
});

app.post('/save_del', (req, res) => {

  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
          req.id = decoded.id;
      }
  })

  const user = req.name;
  const id = req.id;


  const checkedItemIds = req.body;
  
  const insertQuery = 'UPDATE messages SET del_m=1 WHERE id_m IN (?)';
  const deleteQuery = 'DELETE FROM save_m WHERE id_m IN (?)';
  const updateQuery = 'UPDATE messages SET save=0 WHERE id_m IN (?)';

  db.query(insertQuery, [checkedItemIds,checkedItemIds], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {

      db.query(updateQuery, [checkedItemIds], (updateErr, deleteResults) => {
        if (updateErr) {
          
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {

          
      db.query(deleteQuery, [checkedItemIds], (deleteErr, deleteResults) => {
        if (deleteErr) {
          
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          io.emit('save_del', { idu: id }, () => {
            // Le code ici s'exécute lorsque l'événement est émis
        
          });
          res.sendStatus(204);
          
        }
      });
        }
      });

    }
  });
});
app.post('/save_del2/:id_m', (req, res) => {
  const token = req.cookies.token;

  
  jwt.verify(token,"metagroupe",(err , decoded)=>{
    if(err){
return res.json({Message : "Auth err"});
    }
    else{
        req.id = decoded.id;
       
    }
})

const id = req.id;
const userId = req.params.id_m;
  const sql = "UPDATE `messages` SET `lu`='1', im = 0 WHERE id_m= ? ";

  const insertQuery = 'DELETE FROM save_m WHERE id_m  = ?';
  const deleteQuery = 'UPDATE messages SET save=0 WHERE id_m = ?';

  db.query(insertQuery, [userId], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      db.query(deleteQuery, [userId], (deleteErr, deleteResults) => {
        if (deleteErr) {
          
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          io.emit('sup', { idu: id }, () => {
            // Le code ici s'exécute lorsque l'événement est émis
        
          });
          res.sendStatus(204);
          
        }
      });
    }
  });
});







app.post('/save/:id_m', (req, res) => {
  // Récupération du token JWT depuis les cookies
  const token = req.cookies.token;

  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
          return res.json({ Message: "Auth err" });
      } else {
          // Si le token est valide, l'ID décodé est attaché à la requête
          req.id = decoded.id;
      }
  });

  // Récupération des IDs de l'utilisateur et du message
  const id = req.id;
  const userId = req.params.id_m;

  const insertQuery = 'INSERT INTO save_m SELECT * FROM messages WHERE id_m = ?';
  const deleteQuery = 'UPDATE messages SET save = 1 WHERE id_m = ?';

  db.query(insertQuery, [userId], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      db.query(deleteQuery, [userId], (deleteErr, deleteResults) => {
        if (deleteErr) {
          
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          io.emit('save1', { idu: id }, () => {
            // Le code ici s'exécute lorsque l'événement est émis
        
          });
          res.sendStatus(204);
          
        }
      });
    }
  });
});



app.post('/Unsave/:id_m', (req, res) => {
  // Récupération du token JWT depuis les cookies
  const token = req.cookies.token;

  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
          return res.json({ Message: "Auth err" });
      } else {
          // Si le token est valide, l'ID décodé est attaché à la requête
          req.id = decoded.id;
      }
  });

  // Récupération des IDs de l'utilisateur et du message
  const id = req.id;
  const userId = req.params.id_m;

  const insertQuery = 'DELETE FROM save_m WHERE id_m IN (?)';
  const deleteQuery = 'UPDATE messages SET save = 0 WHERE id_m = ?';

  db.query(insertQuery, [userId], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      db.query(deleteQuery, [userId], (deleteErr, deleteResults) => {
        if (deleteErr) {
          
          console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
          res.status(500).json({ error: 'Erreur serveur' });
        } else {
          io.emit('save1', { idu: id }, () => {
            // Le code ici s'exécute lorsque l'événement est émis
        
          });
          res.sendStatus(204);
          
        }
      });
    }
  });
});

app.post('/save', (req, res) => {
  const token = req.cookies.token;
  const checkedItemIds = req.body;
  
  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
        return res.json({ Message: "Auth err" });
    } else {
        // Si le token est valide, l'ID décodé est attaché à la requête
        req.id = decoded.id;
    }
});

// Récupération des IDs de l'utilisateur et du message
const id = req.id;
  // Vérifie si le tableau est vide
  if (checkedItemIds.length !== 0) {
    const insertQuery = 'INSERT INTO save_m SELECT * FROM messages WHERE id_m IN (?)';
    const deleteQuery = 'UPDATE messages SET save = 1 WHERE id_m IN (?)';

    db.query(insertQuery, [checkedItemIds], (insertErr, insertResults) => {
      if (insertErr) {
        console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        db.query(deleteQuery, [checkedItemIds], (deleteErr, deleteResults) => {
          if (deleteErr) {
            
            console.error('Erreur lors de la suppression des éléments depuis la table "messages" :', deleteErr);
            res.status(500).json({ error: 'Erreur serveur' });
          } else {
            io.emit('nouvelUtilisateur', { idu: id }, () => {
              // Le code ici s'exécute lorsque l'événement est émis
          
            });
            res.sendStatus(204);
            
          }
        });
      }
    });
  } else {
    // Réponse si le tableau est vide
    res.sendStatus(204);
  }
});

app.post('/del', (req, res) => {
  const token = req.cookies.token;
  const checkedItemIds = req.body;
  
  // Vérification du token JWT
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
        return res.json({ Message: "Auth err" });
    } else {
        // Si le token est valide, l'ID décodé est attaché à la requête
        req.id = decoded.id;
    }
});
const id = req.id; // Vérifie si le tableau est vide

// Récupération des IDs de l'utilisateur et du message
console.log(checkedItemIds.length );
  if (checkedItemIds.length !== 0) {
 
    const query = `DELETE FROM messages WHERE id_m IN (?); `;
  db.query(query, [checkedItemIds], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression des éléments depuis la base de données :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      io.emit('del', { idu: id }, () => {
        // Le code ici s'exécute lorsque l'événement est émis
    
      });
      res.sendStatus(204);
    }
  });
}
});

app.post('/del_trash/:id_m', (req, res) => {
  const token = req.cookies.token;

  
  jwt.verify(token,"metagroupe",(err , decoded)=>{
    if(err){
return res.json({Message : "Auth err"});
    }
    else{
        req.id = decoded.id;
       
    }
})

const id = req.id;
const userId = req.params.id_m;
  const query = `DELETE FROM messages WHERE id_m IN (?); `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression des éléments depuis la base de données :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      io.emit('del', { idu: id }, () => {
        // Le code ici s'exécute lorsque l'événement est émis
    
      });
      res.sendStatus(204);
    }
  });
});

app.post('/update_data', (req, res) => {
    const { code, nom, nomArabe } = req.body;
  console.log(nom);
    // Execute the query to update data in the database
    const query = `UPDATE etab SET LIBETAB = ?, LIBETABA = ? WHERE CODETAB = ?`;
    db.query(query, [nom, nomArabe, code], (err, result) => {
      if (err) {
        console.error('Error updating data:', err);
        return res.status(500).json({ error: 'Error updating data' });
      }
      console.log('Data updated successfully');
      res.json({ message: 'Data updated successfully' });
    });
  });

  app.post('/groups', async (req, res) => {
    try {
      const { name, users } = req.body;


      // Insert the group into the groups table
      const insertGroupQuery = 'INSERT INTO `groups` (name) VALUES (?)';
      db.query(insertGroupQuery, [name], (error, groupInsertResult) => {
        if (error) {
          console.error('Error creating group:', error);
          res.status(500).json({ error: 'An error occurred while creating the group' });
        } else {
          const groupId = groupInsertResult.insertId;
  
          // Insert selected users into the user_group_relationship table
          const insertUserToGroupQuery = 'INSERT INTO user_group_relationship (username ,group_id, id) SELECT username, ?, ? FROM user where id = ? ';
          const userInsertPromises = users.map((userId) =>
            new Promise((resolve, reject) => {
              db.query(insertUserToGroupQuery, [groupId, userId,userId], (userInsertError) => {
                if (userInsertError) {
                  reject(userInsertError);
                } else {
                  resolve();
                }
              });
            })
          );
  
          Promise.all(userInsertPromises)
            .then(() => {
              res.status(201).json({ message: 'Group created successfully', groupId });
            })
            .catch((userInsertErrors) => {
              console.error('Error inserting users into group:', userInsertErrors);
              res.status(500).json({ error: 'An error occurred while creating the group' });
            });
        }
      });
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ error: 'An error occurred while creating the group' });
    }
  });

  app.post('/addUser', (req, res) => {
    const { codeEtablissement, nomEtablissement } = req.body;

    const userQuery = 'INSERT INTO user (username, password,password2,role) VALUES (?, ?,"","Directeur"),(?,"",?,"Econome")';
    const userValues = [codeEtablissement, '$2b$10$LjMuZnKYfzRRerz34V6U2.S9tQWmiBzITXSOuWpPtxtxc.dtJoBu2',codeEtablissement,'$2b$10$ygyx1m2kyHvScuQ6KL1WsuqniJvjENmKE0qFLcNnRbD2G1o2S8EU2'];
  
    
    const etaQuery = 'INSERT INTO etab (CODETAB, LIBETAB) VALUES (?, ?)';
    const etaValues = [codeEtablissement, nomEtablissement];
  
    db.query({ sql: userQuery, values: userValues }, (userError, userResults) => {
      if (userError) {
        console.error('Error inserting user:', userError);
        res.status(500).json({ error: 'Error inserting user' });
      } else {
        db.query({ sql: etaQuery, values: etaValues }, (etaError, etaResults) => {
          if (etaError) {
            console.error('Error inserting eta:', etaError);
            res.status(500).json({ error: 'Error inserting eta' });
          } else {
            console.log('User and eta inserted successfully');
            res.json({ message: 'User and eta inserted successfully' });
          }
        });
      }
    });
  });

  app.post('/login', async (req, res) => {
    const { user, password } = req.body;

    const sql = 'SELECT * FROM user WHERE username = ?';

    db.query(sql, [user], async (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Server Side Error' });
        }

        if (data.length > 1) {
            const hashedPassword = data[0].password;

bcrypt.compare(password, hashedPassword, (err, result) => {
  if (err) {
      // Gestion des erreurs, par exemple, retournez une réponse d'erreur.
      return res.status(500).json({ error: 'Internal Server Error'+err });
  }

  if (result) {
    const name = data[0].username;
    const id = data[0].id;
    const payload = { name, id };
    const token = jwt.sign(payload, 'metagroupe', { expiresIn: '1d' });

    res.cookie('token',token, { httpOnly: true });

    const query = 'UPDATE `event` SET `date_c`=NOW() WHERE id = ?';
   
    
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Erreur lors de la conexion:', err);
        res.status(500).json({ message: 'Erreur lors de la conexion' });
      } else {
        return res.json({ Status: 'Success' });
      }
    });

  }

  // Le mot de passe correspond au mot de passe haché.
  // Maintenant, vous pouvez générer le jeton JWT et envoyer une réponse réussie.



            else {
console.log(2);

          const hashedPassword2 = data[1].password2;
          bcrypt.compare(password, hashedPassword2, (err, result) => {

if (result){
const name = data[1].username;
const id = data[1].id;
const payload = { name, id };
const token = jwt.sign(payload, 'metagroupe', { expiresIn: '1d' });

res.cookie('token', token);
const query = 'UPDATE `event` SET `date_c`=NOW() WHERE id = ?';
   
    
db.query(query, [id], (err, result) => {
  if (err) {
    console.error('Erreur lors de la conexion: :', err);
    res.status(500).json({ message: 'Erreur lors de la conexion' });
  } else {

    return res.json({ Status: 'Success' });
  }
});
}else{
  return res.json({ Message: 'incorect' });
}

          }
          
          )
          
            }
          
          });



        } else {
          if (data.length == 1) {
            const hashedPassword = data[0].password;
            console.log(password);
            console.log(3);
            bcrypt.compare(password, hashedPassword, (err, result) => {
              if (err) {
                  console.error('Erreur lors de la comparaison :', err);
              } else {
                  console.log('Résultat de bcrypt.compare :', result ,password); // true ou false
              }
          });
            bcrypt.compare(password, hashedPassword, (err, result) => {
              if (err) {
                  // Gestion des erreurs, par exemple, retournez une réponse d'erreur.
                  return res.status(500).json({ error: 'Internal Server Error' });
              }
          
              if (result) {
                const name = data[0].username;
                const id = data[0].id;
                const payload = { name, id };
                const token = jwt.sign(payload, 'metagroupe', { expiresIn: '1d' });
            
                res.cookie('token', token);
            
                const query = 'UPDATE `event` SET `date_c`=NOW() WHERE id = ?';
    
                db.query(query, [id], (err, result) => {
                  if (err) {
                    console.error('Erreur lors de l\'ajout des utilisateurs au groupe :', err);
                    res.status(500).json({ message: 'Erreur lors de l\'ajout des utilisateurs au groupe' });
                  } else {

                    return res.json({ Status: 'Success' });
                  }
                });
            
              }
              else{
                return res.json({ Message: 'incorect' });
              }
          
              // Le mot de passe correspond au mot de passe haché.
              // Maintenant, vous pouvez générer le jeton JWT et envoyer une réponse réussie.
          
          
    
                      });
                      
        }else{
          return res.json({ Message: 'incorect' });
        }
        }
    });
});

app.get('/info_u',(req,res)=>{
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
            req.id = decoded.id;
        }
    })

    const user = req.name;
    const id = req.id;

    const sql = "SELECT * FROM user INNER JOIN etab ON user.username = etab.CODETAB WHERE user.id = ? ";
    db.query(sql,[id],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})

app.get('/info_cant', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
    }
  })

  const user = req.name;
  const id = req.id;
  const todayDate = new Date().toISOString().slice(0, 10); // Obtenir la date d'aujourd'hui au format 'YYYY-MM-DD'
  
  const sql = "SELECT * FROM cantine WHERE CODETAB = ? AND date = ?";
  db.query(sql, [user, todayDate], (err, data) => {
    if (err) return res.json(data);
    return res.json(data) || [];
  })
});


app.get('/user/:idd',(req,res)=>{
  const token = req.cookies.token;
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
          req.id = decoded.id;
      }
  })

  const user = req.name;
  const id = req.id;
  const userId = req.params.idd;
  const sql = "SELECT * FROM user INNER JOIN etab ON user.username = etab.CODETAB WHERE user.id = ? ";
  db.query(sql,[userId],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data) || [];
      
  })

})

app.post('/utilisateurs_groupes', (req, res) => {
  const usersToAdd = req.body;
  const query = 'INSERT INTO utilisateurs_groupes (user_id, groupe_id) VALUES ?';
  const values = usersToAdd.map(({ user_id, groupe_id }) => [user_id, groupe_id]);
  
  db.query(query, [values], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout des utilisateurs au groupe :', err);
      res.status(500).json({ message: 'Erreur lors de l\'ajout des utilisateurs au groupe' });
    } else {
      console.log('Utilisateurs ajoutés au groupe avec succès');
      res.status(200).json({ message: 'Utilisateurs ajoutés au groupe avec succès' });
    }
  });
});

app.get('/groupeL',(req,res)=>{
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
           
        }
    })

    const user = req.name;
    const sql="SELECT * FROM tensikde.groups";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})

app.get('/logout',(req,res) => {

    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
            req.id = decoded.id;
        }
    })

    const id = req.id;
    const query = 'UPDATE `event` SET `date_d`=NOW() WHERE id = ?';
   
    
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'ajout des utilisateurs au groupe :', err);
        res.status(500).json({ message: 'Erreur lors de l\'ajout des utilisateurs au groupe' });
      } else {
        console.log('Utilisateurs ajoutés au groupe avec succès');
        res.clearCookie('token');
        return res.json({Status :"Success"});
      }
    });



})

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
