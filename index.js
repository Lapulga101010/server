import express from "express";
import mysql from "mysql";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import multer from "multer";

const app = express();
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: "https://meta-groupe.net",
    methods: ["POST", "GET"],
    credentials: true,
  })
);

const db = mysql.createConnection({
  host: "141.94.102.32",
  user: "wgmnwtfv_meta-groupe",
  password: "Metagroupe",
  database: "wgmnwtfv_Meta-groupe",
});

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) {
    return res.json({ Message: "Provide token, please" });
  } else {
    jwt.verify(token, "metagroupe", (err, decoded) => {
      if (err) {
        return res.json({ Message: "Auth error" });
      } else {
        req.name = decoded.name;
        next();
      }
    });
  }
};

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

app.get('/', verifyUser, (req, res) => {
  return res.json({ Status: "Success", name: req.name });
});

app.get('/info', verifyUser, (req, res) => {
  const user = req.name;
  const sql = "SELECT * FROM user WHERE username != ?";
  db.query(sql, [user], (err, data) => {
    if (err) return res.json(data);
    return res.json(data || []);
  });
});

app.get('/messages', verifyUser, (req, res) => {
  const user = req.name;
  const sql = "SELECT * FROM messages WHERE username = ?";
  db.query(sql, [user], (err, data) => {
    if (err) return res.json(data);
    return res.json(data || []);
  });
});

app.get('/messagesS', verifyUser, (req, res) => {
  const user = req.name;
  const sql = "SELECT * FROM messages WHERE usernameA = ?";
  db.query(sql, [user], (err, data) => {
    if (err) return res.json(data);
    return res.json(data || []);
  });
});

app.post('/login', (req, res) => {
  const { user, password } = req.body;
  const sql = "SELECT * FROM user WHERE username = ? AND password = ?";
  db.query(sql, [user, password], (err, data) => {
    if (err) return res.json({ success: false, error: err });
    if (data.length === 0) {
      return res.json({ success: false, message: "Invalid username or password" });
    } else {
      const token = jwt.sign({name:user}, "metagroupe", { expiresIn: "1d" });
      res.cookie("token", token, { httpOnly: true });
      return res.json({ success: true, message: "Login successful" });
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
