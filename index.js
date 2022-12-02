//ligne permettant de référencer / importer le module Express
const express = require("express");

const path = require("path");

//référencer "sqlite3" en tête du programe "index.js"
// méthode ".verbose()" permet d'avoir plus d'informations en cas de problème
const sqlite3 = require("sqlite3").verbose();
const db_name = path.join(__dirname, "data", "apptest.db");
const db = new sqlite3.Database(db_name, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données 'apptest.db'");
});

// Create Table after connection to DB
const sql_create = `CREATE TABLE IF NOT EXISTS Livres (
  Livre_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Titre VARCHAR(100) NOT NULL,
  Auteur VARCHAR(100) NOT NULL,
  Commentaires TEXT
);`;


db.run(sql_create, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Création réussie de la table 'Livres'");
  // Alimentation de la table
  const sql_insert = `INSERT INTO Livres (Livre_ID, Titre, Auteur, Commentaires) VALUES
  (1, 'Mrs. Bridge', 'Evan S. Connell', 'Premier de la série'),
  (2, 'Mr. Bridge', 'Evan S. Connell', 'Second de la série'),
  (3, 'L''ingénue libertine', 'Colette', 'Minne + Les égarements de Minne');`;
  db.run(sql_insert, err => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Alimentation réussie de la table 'Livres'");
  });
});

//sert à instancier un serveur Express
const app = express();

//utiliser le moteur de template EJS
app.set("view engine", "ejs");

//Indiquer que les vues sont enregistrées dans le dossier "views"
app.set("views", __dirname + "/views");

//indiquer que les files statiques sont enregistrés dans dossier "public" et ses sous-rép
app.use(express.static(path.join(__dirname, "public")));

//serveur démarré, attend requêtes sur port 3000. 
//fonction callback: sert à afficher msg informatif lorsque serveur prêt à recevoir requêtes
app.listen(3000, () => {
  console.log("Serveur démarré (http://localhost:3000/) !");
});

//fonction pour répondre aux requêtes GET pointant sur la racine du site
app.get("/", (req, res) => {
  //res.send("Bonjour le monde...");
  res.render("index");
});

//fonction pour répondre à requête vers "/about" et renvoyer la vue "about.ejs" dans ce cas.
app.get("/about", (req, res) => {
  res.render("about");
});


//fonction à "index.js" pour :
//prendre en compte l'URL "/data"
//rendre la vue correspondante
//mais cette fois-ci en indiquant en plus l'objet à lui transmettre.
app.get("/data", (req, res) => {
  const test = {
    titre: "Test",
    items: ["un", "deux", "trois"]
  };
  res.render("data", { model: test });
});


app.get("/livres", (req, res) => {
  const sql = "SELECT * FROM Livres ORDER BY Titre";
  //function db.all :
  //1° paramètre : requête SQL à exécuter
  //2° paramètre : tableau avec variables nécessaires à requête. 
  //Ici, la valeur "[]" est employée car requête doesn't need variable
  //3° paramètre : fonction callback appelée après exécution requête SQL
  // (err, rows)" correspond aux paramètres passés à la fonction callback. 
  //"err" contient éventuellement un objet erreur
  //"rows" : tableau contenant liste des lignes renvoyées par le SELECT.

  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render("livres", { model: rows });
  });
});


// GET /edit/5
app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("edit", { model: row });
  });
});


// POST /edit/5
app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires, id];
  const sql = "UPDATE Livres SET Titre = ?, Auteur = ?, Commentaires = ? WHERE (Livre_ID = ?)";
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});

// Configuration du serveur
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false })); // <--- paramétrage du middleware


// GET /create
app.get("/create", (req, res) => {
  res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res) => {
  const sql = "INSERT INTO Livres (Titre, Auteur, Commentaires) VALUES (?, ?, ?)";
  const book = [req.body.Titre, req.body.Auteur, req.body.Commentaires];
  db.run(sql, book, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});

// GET /delete/5
app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM Livres WHERE Livre_ID = ?";
  db.get(sql, id, (err, row) => {
    // if (err) ...
    res.render("delete", { model: row });
  });
});

// POST /delete/5
app.post("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM Livres WHERE Livre_ID = ?";
  db.run(sql, id, err => {
    // if (err) ...
    res.redirect("/livres");
  });
});