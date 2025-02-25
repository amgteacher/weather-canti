// Importamos las dependencias necesarias
const express = require("express");
const sqlite3 = require("sqlite3").verbose(); // Para trabajar con SQLite
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

// Creamos una instancia de Express
const app = express();

// Configuramos el puerto
const PORT = process.env.PORT || 3000;

// Usamos CORS para permitir peticiones (en caso de que el front-end y back-end estén en dominios distintos)
app.use(cors());

// Configuramos el middleware para parsear JSON en las peticiones
app.use(bodyParser.json());

// Servimos archivos estáticos de la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

// Abrimos (o creamos) la base de datos SQLite
const db = new sqlite3.Database("db.sqlite", (err) => {
  if (err) {
    console.error("Error al abrir la base de datos:", err.message);
  } else {
    console.log("Conectado a la base de datos SQLite.");
  }
});

// Creamos la tabla 'searches' si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    city TEXT,
    search_type TEXT,
    result TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Endpoint para guardar una búsqueda
app.post("/api/search", (req, res) => {
  // Obtenemos los datos enviados desde el cliente
  const { search_type, city, result } = req.body;
  // Obtenemos la IP del cliente. En entornos reales podría estar detrás de un proxy.
  const ip = req.ip || req.connection.remoteAddress;
  
  // Insertamos el registro en la tabla "searches"
  const sql = `INSERT INTO searches (ip, city, search_type, result) VALUES (?, ?, ?, ?)`;
  const params = [ip, city, search_type, result];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error("Error al insertar la búsqueda:", err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Búsqueda guardada correctamente.", id: this.lastID });
    }
  });
});

// Endpoint para obtener el historial de búsquedas para la IP del usuario
app.get("/api/history", (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Se consultan los registros de búsquedas para la IP solicitante, ordenados por fecha descendente
  const sql = `SELECT * FROM searches WHERE ip = ? ORDER BY timestamp DESC`;
  db.all(sql, [ip], (err, rows) => {
    if (err) {
      console.error("Error al obtener el historial:", err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Iniciamos el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
