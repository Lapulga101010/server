const express = require("express");
const http = require('http');
const mysql = require("mysql2");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const bcrypt = require('bcryptjs');

const app = express();
app.use(cookieParser());
app.use(express.json());



app.use(cors({
  origin:"https://de06.net",
  methods : ["POST, GET"],
  credentials : true
}
));

const db = mysql.createConnection({
  host: "80.246.1.157",
  port:"3306",
  user: "yvzmfbmz_yvzmfbmz",
  password: "Metagroupe@",
  database: "yvzmfbmz_de06",
});



const fs = require('fs'); // Importez le module 'fs'

// Route pour supprimer un fichier



app.use(express.json());

// Configure multer to handle file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/upload/"); // Specify the directory where uploaded files will be stored
  },
  filename: function (req, file, cb) {
    // Generate a unique name for the uploaded file
    cb(null,file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(express.json());



app.get('/messages', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    console.log('Token is undefined or not present in the cookies');
    res.json({ Message: 'Token is missing' });
    return;
  }

  jwt.verify(token, 'metagroupe', (err, decoded) => {
    if (err) {
      console.log(err);
      res.json({ Message: 'Auth error' });
    } else {
      const user = decoded.name;
      const id = decoded.id;
      const sql =
        'SELECT messages.id_m,messages.message,messages.id_r,messages.nom,messages.usernameA,messages.username,messages.lu,messages.formulaire,messages.groupe,messages.im,messages.date,messages.objet,etab.LIBETAB,etab.LIBETABA,etab.CODETAB FROM messages INNER JOIN etab ON messages.usernameA = etab.CODETAB WHERE messages.id_r = ? ORDER BY date DESC ';

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders();

      const sendMessages = () => {
        if (res.finished) {
          console.log('Connection is closed');
          clearInterval(intervalId);
          res.end();
          return;
        }

        db.query(sql, [id], (err, results) => {
          if (err) {
            console.error('Erreur lors de la récupération des messages : ' + err);
            return;
          }

          const messages = JSON.stringify(results);
          res.write(`data: ${messages}\n\n`);
        });
      };

      // Première exécution immédiate de sendMessages
      sendMessages();

      // Ensuite, démarrez l'intervalle
      const intervalId = setInterval(sendMessages, 5000);

      req.on('close', () => {
        clearInterval(intervalId);
        res.end();
      });
    }
  });
});





app.get('/upload/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'upload/', filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(404).send('Fichier non trouvé');
    }
  });
});


app.post("/send", upload.single("file"), (req, res) => {
  
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    
    if (err) {
      return res.json({ Message: "Authentification erreur" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;

      console.log();
      const usertt = req.name;
      const id = req.id;
      const { data } = req.body;
      const { users, groupes, noms, value1, value2,file } = JSON.parse(data); 
      const nn = noms.map((nom) => nom.name);

      // Insérer les données dans la base de données
      const query =
        "INSERT INTO messages (de, id_r, username, id_u, usernameA, nom, objet, message, grou_m, file) VALUES ?";
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
        file, // Access the uploaded file's name here
      ]);

      const queryGroupe =
        "INSERT INTO messages (username, id_r, id_u, usernameA, objet, message, grou_m, nom, groupe,file) SELECT username, id, ?, ?, ?, ?, ?, ?, ? ,?  FROM `user_group_relationship` WHERE group_id = ?";
      const queryGroupe2 = "INSERT INTO groupe_m (messs) VALUES (?)";

      let groupesProcessed = false;
      let usersProcessed = false;

      function sendResponse() {
        if (groupesProcessed && usersProcessed) {
          res.sendStatus(200);
        }
      }

      if (groupes && groupes.length > 0) {
        console.log('groupe');
        db.query(queryGroupe2, id, (error, results) => {
          if (error) {
            console.error(
              "Une erreur s'est produite lors de l'insertion des données :",
              error
            );
            res.sendStatus(500);
          } else {
            console.log("Données insérées avec succès.");
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
            groupes.forEach((groupe) => console.log(groupe.id));
            db.query(queryGroupe, valuesG.flat(), (error, results) => {
              if (error) {
                console.error(
                  "Une erreur s'est produite lors de l'insertion des données :",
                  error
                );
                // Only set groupesProcessed flag, do not send the response here
                groupesProcessed = true;
                sendResponse();
              } else {
                console.log("Données insérées avec succès.");
                groupesProcessed = true;
                sendResponse(); // Send the response here
              }
            });
          }
        });
      } else {
        groupesProcessed = true;
        sendResponse(); // Send the response here
      }

      if (users && users.length > 0) {
        console.log("user");
        db.query(query, [values], (error, results) => {
          if (error) {
            console.error(
              "Une erreur s'est produite lors de l'insertion des données :",
              error
            );
            // Only set usersProcessed flag, do not send the response here
            usersProcessed = true;
            sendResponse();
          } else {
            console.log("Données insérées avec succès.");
            usersProcessed = true;
            sendResponse(); // Send the response here
          }
        });
      } else {
        usersProcessed = true;
        sendResponse(); // Send the response here
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





app.post('/deleteFile', (req, res) => {
  const { filename } = req.body;
console.log(filename);
  // Chemin complet vers le fichier que vous souhaitez supprimer
  const filePath = path.join(__dirname, 'uploads', filename);

  // Vérifiez si le fichier existe avant de le supprimer
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // Supprimez le fichier
    res.status(200).send('Fichier supprimé avec succès');
  } else {
    res.status(404).send('Le fichier n\'existe pas');
  }
});

app.delete('/upload/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'upload/', filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Erreur lors de la suppression du fichier');
    } else {
      console.log(`Fichier ${filename} supprimé avec succès.`);
      res.status(200).send('Fichier supprimé avec succès');
    }
  });
});








const { fileURLToPath } = require('url');
const path = require('path');

app.post("/send2", upload.single("file"), (req, res) => {});
// Serve uploaded files statically
app.use("/upload", express.static(path.join(__dirname, "uploads")));






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

  const sql="SELECT * FROM note WHERE affect = ?";
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
  const abs = req.body.abs; // Access the 'abs' value from the request body
  const updateQuery = 'UPDATE statut_abs_note SET abs = ?';

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
  const { nom, prenom, telephone_portable } = req.body;

  const updateUserQuery = `
    UPDATE user SET
    nom = ?,
    prenom = ?,
    telephone = ?,
    ft = 1
    WHERE id = ?;
  `;

  db.query(updateUserQuery, [nom, prenom, telephone_portable, id], (err, result) => {
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

  const sql="SELECT * FROM del_m  INNER JOIN etab ON del_m.usernameA = etab.CODETAB WHERE del_m.id_r = ? order by date DESC";
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
         
      }
  })
const user = req.name;

  const sql="SELECT * FROM save_m INNER JOIN etab ON save_m.usernameA = etab.CODETAB WHERE save_m.username = ? order by date DESC ";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);

      return res.json(data)|| [];
      
  })
})



app.get('/messagesS' ,(req,res)=>{
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.id = decoded.id;
           
        }
    })
const user = req.id;
    const sql="SELECT * FROM `messages` INNER JOIN etab ON messages.username = etab.CODETAB WHERE messages.id_u = ? and  messages.formulaire = 0 order by date DESC ";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data)|| [];
        
    })
})



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

  if (!groupIDsToDelete || !Array.isArray(groupIDsToDelete)) {
    return res.status(400).json({ error: 'Invalid data' });
  }
console.log(groupIDsToDelete);
  const deleteGroupQuery = `DELETE FROM groups WHERE id IN (?)`;
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




app.get('/form_down' ,(req,res)=>{
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
  const sql="SELECT * FROM `messages` INNER JOIN etab ON messages.username = etab.CODETAB INNER JOIN valform ON messages.id_m=valform.id_m WHERE messages.usernameA = ? and  messages.formulaire != 0 order by date DESC ";
  db.query(sql,[user],(err,data)=>{
      if(err) return res.json(data);
      return res.json(data)|| [];
      
  })
})

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
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Auth err" });
    } else {
      req.name = decoded.name;
    }
  });
  

  const userId = req.params.id_m;
  const user = req.name;

  const sql = "UPDATE `messages` SET `lu`='1', im = 0 WHERE id_m= ? ";

  db.query(sql, [userId], (error, results) => {
    if (error) {
      console.error('Une erreur s\'est produite lors de l\'insertion des données:', error);
      res.sendStatus(500);
    } else {
      console.log('Données insérées avec succès.');
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
    const { currentPassword, newPassword } = req.body;
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
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }

      // Hachage du nouveau mot de passe
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
    const sql="SELECT * FROM user INNER JOIN etab ON user.username = etab.CODETAB WHERE username !=?";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})






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

})

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

  // Update the message status in the database
  const query = 'UPDATE messages SET im = 1 , lu = 0 WHERE id_m= ? or grou_m = ?';

  db.query(query, [messageId,messageId], (error, results) => {
    if (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({ message: 'Internal server error' });
    } else {
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
  const { groupes, users, noms, fields,value1 } = req.body;
  const nn = noms.map((nom) => nom.name);
  const queryGroupe = 'INSERT INTO messages (id_r,username,id_u,usernameA,formulaire,objet) VALUES ?';
  const queryGroupe3 = 'INSERT INTO messages (username, id_r ,id_u, usernameA ,formulaire, grou_m,objet,groupe) SELECT username, id,?, ?, ?, ?, ?,? FROM `user_group_relationship` WHERE  group_id = ?';
  const queryGroupe2 = 'INSERT INTO groupe_m (messs) VALUES (?)';
  const values = users.map((user) => [user.id,user.username,id,usertt,'1',value1]);
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


    db.query(queryGroupe, [values], (error, results) => {
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

app.post('/trash', (req, res) => {
  const checkedItemIds = req.body;
  const insertQuery = 'INSERT INTO del_m SELECT * FROM messages WHERE id_m IN (?)';
  const deleteQuery = 'DELETE FROM messages WHERE id_m IN (?)';

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
          res.sendStatus(204);
        }
      });
    }
  });
});


app.post('/save', (req, res) => {
  const checkedItemIds = req.body;
  const insertQuery = 'INSERT INTO save_m SELECT * FROM messages WHERE id_m IN (?)';


  db.query(insertQuery, [checkedItemIds], (insertErr, insertResults) => {
    if (insertErr) {
      console.error('Erreur lors de l\'insertion des éléments dans la table "del_m" :', insertErr);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {

          res.sendStatus(204);
        }
      });
    });



app.post('/del', (req, res) => {
  const checkedItemIds = req.body;
  const query = `DELETE FROM del_m WHERE id_m IN (?); `;
  
  db.query(query, [checkedItemIds], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression des éléments depuis la base de données :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.sendStatus(204);
    }
  });
});


app.post('/save_del', (req, res) => {
  const checkedItemIds = req.body;
  const query = `DELETE FROM save_m WHERE id_m IN (?); `;
  
  db.query(query, [checkedItemIds], (err, results) => {
    if (err) {
      console.error('Erreur lors de la suppression des éléments depuis la base de données :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
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
      const insertGroupQuery = 'INSERT INTO groups (name) VALUES (?)';
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



  const password = 'gm'; // Remplacez 'motdepasse' par le mot de passe que vous souhaitez hacher.

  // Générez un sel aléatoire pour le hachage.
  const saltRounds = 10;
  
  // Utilisez la fonction 'hash' de bcrypt pour hacher le mot de passe.
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
          console.error('Erreur lors du hachage du mot de passe :', err);
      } else {
          console.log('Mot de passe haché :', hashedPassword);
      }
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
  
  res.cookie('token', token, { 
    httpOnly: true,
    secure: true,  // Assurez-vous que vous utilisez HTTPS
    sameSite: 'strict'
  });

  
      return res.json({ Status: 'Success' });
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

  res.cookie('token', token, { 
    httpOnly: true,
    secure: true,  // Assurez-vous que vous utilisez HTTPS
    sameSite: 'strict'
  });

  return res.json({ Status: 'Success' });
}
return res.json({ Message: 'incorect' });
            }
            )
          
              }
            });



          } else {
            if (data.length == 1) {
              const hashedPassword = data[0].password;
              console.log(3);

    

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
              
  res.cookie('token', token, { 
    httpOnly: true,
    secure: true,  // Assurez-vous que vous utilisez HTTPS
    sameSite: 'strict'
  });

              
                  return res.json({ Status: 'Success' });
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
    const sql="SELECT id,name FROM groups";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})

app.get('/logout',(req,res) => {
    res.clearCookie('token');
    return res.json({Status :"Success"});

})


app.listen(8081,()=> {
    console.log("Running new 5 .....");
})
