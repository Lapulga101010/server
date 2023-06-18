import express  from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser  from "cookie-parser";
import jwt  from "jsonwebtoken";
import multer from "multer";



const app = express();
app.use(cookieParser());
app.use(express.json());




app.use(cors({
    origin:"https://meta-groupe.net",
    methods : ["POST, GET"],
    credentials : true
}
));

const db = mysql.createConnection({
  host: "141.94.102.32",
  user: "wgmnwtfv_meta-groupe",
  password: "Metagroupe",
  database: "wgmnwtfv_Meta-groupe",
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





// Configuration de Multer pour spécifier le dossier de destination des fichiers téléchargés
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    },
  });
  
  // Créez un objet de chargement Multer
  const upload = multer({ storage: storage });
  
  // Endpoint pour gérer la demande de téléchargement de fichier
  app.post('/upload', upload.single('file'), (req, res) => {
    // Le fichier est accessible via req.file
    if (req.file) {
      // Fichier téléchargé avec succès
      res.json({ message: 'Fichier téléchargé avec succès' });
    } else {
      // Aucun fichier n'a été envoyé ou une erreur s'est produite lors du téléchargement
      res.status(400).json({ message: 'Erreur lors du téléchargement du fichier' });
    }
  });
  






app.get('/',verifyUser,(req,res)=>{

    return res.json({Status :"Success" ,name:req.name});

})
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
                
            }
        })
    }
    const user = req.name;
    const sql="SELECT * FROM user WHERE username !=?";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

   

})
app.get('/messages' ,(req,res)=>{
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
const groupe =req.body;
    const sql="SELECT * FROM messages WHERE  username = ?";
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
            req.name = decoded.name;
           
        }
    })
const user = req.name;
    const sql="SELECT * FROM messages WHERE usernameA = ?";
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

    const sql="SELECT * FROM messages WHERE id_m = ?";

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

    const sql="SELECT * FROM form_data WHERE id_m = ?";

    db.query(sql,[userId],(err,data)=>{
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
    }
  });
  
  const requestData = req.body;
  const formValues = requestData.formValues;
  const inputs = requestData.inputs;
  const userId = req.params.id_m;
  const user = req.name;

  const sql = "INSERT INTO liste_form (id_m, nom, valeur) VALUES ?";
  
  const values = [];

  formValues.forEach((form) => {
    form.forEach((fo, index) => {
      const input = inputs[index];
      values.push([userId, input.name, fo]);
    });
  });


  db.query(sql, [values], (error, results) => {
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
    const sql="SELECT id,username,name FROM user WHERE username !=?";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})
app.post('/send', (req, res) => {

    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
           
        }
    })

    const usertt = req.name;

    const { groupes, users ,noms, value1, value2 } = req.body;
    


    const nn=noms.map((nom)=>nom.name);
    // Insérer les données dans la base de données
    const query = 'INSERT INTO messages (de,username,usernameA,nom, objet, message) VALUES ?';
  const queryGroupe= 'INSERT INTO messages (de,usernameA,objet,message,groupe,nom) VALUES ?';
    // Préparer les valeurs à insérer
    const values = users.map((user) => [nn,user.username,usertt,user.name, value1, value2]);
    const valuesG = groupes.map((groupe)=>[nn,usertt, value1, value2,groupe.id,groupe.nom_groupe]);
    

    if (groupes && groupes.length > 0) {
        db.query(queryGroupe, [valuesG], (error, results) => {
            if (error) {
              console.error('Une erreur s\'est produite lors de l\'insertion des données:', error);
              res.sendStatus(500);
            } else {
              console.log('Données insérées avec succès.');
              res.sendStatus(200);
            }
          });
      }else{
        console.log('vide')
      }
      if (users && users.length > 0){
    db.query(query, [values], (error, results) => {
      if (error) {
        console.error('Une erreur s\'est produite lors de l\'insertion des données:', error);
        res.sendStatus(500);
      } else {
        console.log('Données insérées avec succès.');
        res.sendStatus(200);
      }
    });
}
  });
  app.post('/form', (req, res) => {
    const token = req.cookies.token;
    jwt.verify(token,"metagroupe",(err , decoded)=>{
        if(err){
    return res.json({Message : "Auth err"});
        }
        else{
            req.name = decoded.name;
           
        }
    })

    const { groupes, users, noms, fields } = req.body;
    const nn = noms.map((nom) => nom.name);
    
    if (groupes && groupes.length > 0) {
      console.log(groupes.length);
      const usertt = req.name;
      const valuesG = groupes.map((groupe) => [usertt, groupe.id, groupe.nom_groupe, '1']);
      const queryGroupe = 'INSERT INTO messages (de, groupe, nom, formulaire) VALUES ?';
    
      db.query(queryGroupe, [valuesG], (error, results) => {
        if (error) {
          console.error("Une erreur s'est produite lors de l'insertion des données :", error);
          res.sendStatus(500);
        } else {
          console.log('Données insérées avec succès.');
    
          const dernierId = results.insertId;
          console.log(results.insertId);
    
          const insertions = [];
    
          groupes.forEach((groupe) => {
            fields.forEach((field) => {
              const sql2 = 'INSERT INTO form_data (id_m, groupe, name, type, options) VALUES (?, ?, ?, ?, ?)';
              const values = [dernierId, groupe.id, field.name, field.fieldType, field.fieldOptions];
    
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
          });

        }
      });
    } else {
      console.log('vide');
    }
    
    if (users && users.length > 0) {
      const usertt = req.name;
    
      users.forEach((user) => {
        const sql = 'INSERT INTO messages (nom, formulaire, de) VALUES (?, ?, ?)';
        const values2 = [user.username, '1', usertt];
    
        db.query(sql, values2, (error, results) => {
          if (error) {
            console.error("Erreur lors de l'insertion des données :", error);
          } else {
            console.log('Données insérées avec succès dans la base de données.');
            const dernierId = results.insertId;
            console.log(results.insertId);
    
            fields.forEach((field) => {
              const sql2 = 'INSERT INTO form_data (id_m, username, name, type, options) VALUES (?, ?, ?, ?, ?)';
              const values = [dernierId, user.username, field.name, field.fieldType, field.fieldOptions];
    
              db.query(sql2, values, (error, results) => {
                if (error) {
                  console.error("Erreur lors de l'insertion des données :", error);
                } else {
                  console.log('Données insérées avec succès dans la base de données.');
                }
              });
            });
          }
        });
      });
    
     
    }
    
    res.sendStatus(200);

  });
  

app.post('/login',(req,res)=>{

    const sql="SELECT * FROM user WHERE username = ? AND password = ?";
    
    db.query(sql,[req.body.user,req.body.password],(err,data)=>{
     
    if (err) return res.json({Message:"Server Side Error"});
        if(data.length > 0){
            const name = data[0].username;
            const token = jwt.sign({name},"metagroupe",{expiresIn:'1d'});
                        res.cookie('token', token,
                                   {
                maxAge: 24 * 60 * 60 * 1000, // Durée de validité du cookie (1 jour)
                httpOnly: true, // Le cookie ne peut être accédé que par le serveur
                secure: true, // Le cookie ne sera envoyé que via HTTPS en production
                sameSite: 'none' // Permet l'envoi du cookie depuis un domaine différent en production
            }
                                  );
            return res.json({Status :"Success"});
          
        }else{
            return res.json({Message : "identifiant incorrect"});
        }
    }) 
})


app.get('/info_u',(req,res)=>{
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
    const sql="SELECT * FROM user WHERE username =?";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})

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
    const sql="SELECT * FROM groupes ";
    db.query(sql,[user],(err,data)=>{
        if(err) return res.json(data);
        return res.json(data) || [];
        
    })

})

app.get('/logout',(req,res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: true
  });
    return res.json({Status :"Success"});

})
app.listen(8081, ()=> {
    console.log("Running 777887....");
})
