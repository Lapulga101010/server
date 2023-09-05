import express  from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser  from "cookie-parser";
import jwt  from "jsonwebtoken";
import multer from "multer";
import bcrypt from "bcrypt";


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
  user: "yvzmfbmz_yvzmfbmz",
  password: "Metagroupe",
  database: "yvzmfbmz_de06",
});



db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    throw err; // Vous pouvez gérer l'erreur ici de la manière qui vous convient
  }
  console.log('Connexion à la base de données réussie');
  // Vous pouvez exécuter des requêtes SQL ici
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


const upload = multer({ dest: 'upload/' }); // Indiquez le répertoire de destination pour stocker les fichiers

app.post('/upload', upload.single('file'), (req, res) => {
  // Le fichier est accessible via req.file
  // Vous pouvez manipuler le fichier ici (par exemple, le déplacer vers un autre emplacement, le renommer, etc.)

  res.sendStatus(200); // Envoyez une réponse réussie au client
});

app.get('/',verifyUser,(req,res)=>{

    return res.json({Status :"Success" ,name:req.name});

})



const hashedPassword = await bcrypt.hash('gm', 10);
console.log(hashedPassword);


app.post('/changePassword', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;
  const SELECT_QUERY = 'SELECT * FROM user WHERE username = ?';

  try {
    connection.query(SELECT_QUERY, [username], async (err, results) => {
      if (err) {
        console.error('Error fetching user from MySQL:', err);
        return res.status(500).json({ error: 'Internal server error.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const user = results[0];
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (isPasswordCorrect) {
        const newPasswordHash = await bcrypt.hash(newPassword, 10); // saltRounds = 10
        const UPDATE_QUERY = 'UPDATE users SET password = ? WHERE id = ?';
        connection.query(UPDATE_QUERY, [newPasswordHash, user.id], (err, result) => {
          if (err) {
            console.error('Error updating password in MySQL:', err);
            return res.status(500).json({ error: 'Internal server error.' });
          }
          res.status(200).json({ message: 'Password updated successfully.' });
        });
      } else {
        res.status(401).json({ error: 'Invalid current password.' });
      }
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error.' });
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
app.get('/messages', (req, res) => {
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
  const sql = "SELECT * FROM messages INNER JOIN etab ON messages.usernameA = etab.CODETAB WHERE messages.id_r = ? order by date DESC ";
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

  const sql="SELECT * FROM abcences WHERE affect = ?";
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
  const {appertenace_sente, email, telephone_fixe,Daira,commune } = req.body;

  const updateEtabQuery = `
    UPDATE etab SET
    senté = ?,
    email = ?,
    tel_fix = ?,
    daira = ?,
    commune= ?,
    WHERE CODETAB = ?;
  `;

  db.query(updateEtabQuery, [appertenace_sente, email, telephone_fixe,Daira,commune, user], (err, result) => {
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
  jwt.verify(token,"metagroupe",(err , decoded)=>{
      if(err){
  return res.json({Message : "Auth err"});
      }
      else{
          req.name = decoded.name;
         
      }
  })
const user = req.name;

  const sql="SELECT * FROM del_m INNER JOIN etab ON del_m.usernameA = etab.CODETAB WHERE del_m.username = ? order by date DESC ";
  db.query(sql,[user],(err,data)=>{
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
  const insertQuery = 'INSERT INTO del_m SELECT * FROM messages WHERE id_m IN (?)';
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
  const insertQuery = 'INSERT INTO save_m SELECT * FROM messages WHERE id_m IN (?)';
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




app.post('/relance/:id', (req, res) => {
  const messageId = parseInt(req.params.id);

  // Update the message status in the database
  const query = 'UPDATE messages SET im = 1 WHERE id_m= ? or grou_m = ?';

  db.query(query, [messageId,messageId], (error, results) => {
    if (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({ message: 'Internal server error' });
    } else {
      res.status(200).json({ message: 'Message status updated successfully' });
    }
  });
});






app.post('/send', (req, res) => {
  const token = req.cookies.token;
  jwt.verify(token, "metagroupe", (err, decoded) => {
    if (err) {
      return res.json({ Message: "Authentification erreur" });
    } else {
      req.name = decoded.name;
      req.id = decoded.id;
      const usertt = req.name;
      const id = req.id;

      const { groupes, users, noms, value1, value2 } = req.body;
      const nn = noms.map((nom) => nom.name);
      // Insérer les données dans la base de données
      const query = 'INSERT INTO messages (de, id_r, username, id_u, usernameA, nom, objet, message, grou_m) VALUES ?';
      const values = users.map((user) => [id, user.id, user.username, id, usertt, user.nom, value1, value2, null]);
      const queryGroupe = 'INSERT INTO messages (username, id_r, id_u, usernameA, objet, message, grou_m, nom,groupe) SELECT username, id, ?, ?, ?, ?, ?, ?,? FROM `user_group_relationship` WHERE  group_id = ?';
      const queryGroupe2 = 'INSERT INTO groupe_m (messs) VALUES (?)';

      let groupesProcessed = false;
      let usersProcessed = false;

      function sendResponse() {
        if (groupesProcessed && usersProcessed) {
          res.sendStatus(200);
        }
      }

      if (groupes && groupes.length > 0) {
        db.query(queryGroupe2, id, (error, results) => {
          if (error) {
            console.error('Une erreur s\'est produite lors de l\'insertion des données :', error);
            res.sendStatus(500);
          } else {
            console.log('Données insérées avec succès.');
            const dernierId = results.insertId;
            const valuesG = groupes.map((groupe) => [id, usertt, value1, value2, dernierId, groupe.name, groupe.id,groupe.id, groupe.id]);
            groupes.forEach((groupe) => console.log(groupe.id));
            db.query(queryGroupe, valuesG.flat(), (error, results) => {
              if (error) {
                console.error('Une erreur s\'est produite lors de l\'insertion des données :', error);
                // Only set groupesProcessed flag, do not send the response here
                groupesProcessed = true;
                sendResponse();
              } else {
                console.log('Données insérées avec succès.');
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
        db.query(query, [values], (error, results) => {
          if (error) {
            console.error('Une erreur s\'est produite lors de l\'insertion des données :', error);
            // Only set usersProcessed flag, do not send the response here
            usersProcessed = true;
            sendResponse();
          } else {
            console.log('Données insérées avec succès.');
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
  const { groupes, users, noms, fields } = req.body;
  const nn = noms.map((nom) => nom.name);
  const queryGroupe = 'INSERT INTO messages (id_r,username,id_u,usernameA,formulaire) VALUES ?';
  const queryGroupe3 = 'INSERT INTO messages (username, id_r ,id_u, usernameA ,formulaire, grou_m,groupe) SELECT username, id, ?, ?, ?, ?,? FROM `user_group_relationship` WHERE  group_id = ?';
  const queryGroupe2 = 'INSERT INTO groupe_m (messs) VALUES (?)';
  const values = users.map((user) => [user.id,user.username,id,usertt,'1']);
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
          const valuesG = groupes.map((groupe) => [id, usertt,'1', dernierId, groupe.name, groupe.id,groupe.id, groupe.id]);
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
  const insertQuery = 'INSERT INTO del_m SELECT id_m FROM messages WHERE id_m IN (?)';
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



  // ...
  // Lorsque vous créez un nouvel utilisateur ou mettez à jour son mot de passe :
  
  const plaintextPassword = 'gm'; // Remplacez par le mot de passe réel de l'utilisateur.
  
  // Utilisez la fonction hash pour hacher le mot de passe.



   app.post('/login', async (req, res) => {
    const { user, password } = req.body;

    const sql = 'SELECT * FROM user WHERE username = ?';

    db.query(sql, [user], async (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Server Side Error' });
        }
        if (data.length > 1) {
            const hashedPassword = data[0].password;
              console.log(1);
                const passwordMatch = await bcrypt.compare(password, hashedPassword);

                if (passwordMatch) {
                    const name = data[0].username;
                    const id = data[0].id;
                    const payload = { name, id };
                    const token = jwt.sign(payload, 'metagroupe', { expiresIn: '1d' });

                    res.cookie('token', token);

                    return res.json({ Status: 'Success' });
                }
            else{
              const hashedPassword2 = data[1].password2;
              console.log(2);
              const passwordMatch2 = await bcrypt.compare(password, hashedPassword2);

              if (passwordMatch2) {
                  const name = data[1].username;
                  const id = data[1].id;
                  const payload = { name, id };
                  const token = jwt.sign(payload, 'metagroupe', { expiresIn: '1d' });

                  res.cookie('token', token);

                  return res.json({ Status: 'Success' });
              }
            }
        }else{
          const hashedPassword = data[0].password;
          console.log(3);
            const passwordMatch = await bcrypt.compare(password, hashedPassword);

            if (passwordMatch) {
                const name = data[0].username;
                const id = data[0].id;
                const payload = { name, id };
                const token = jwt.sign(payload, 'metagroupe', { expiresIn: '1d' });

                res.cookie('token', token);

                return res.json({ Status: 'Success' });
        }
      }

        return res.json({ Message: 'No Records',First :'yes' });
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
    console.log("Running  .....");
})
