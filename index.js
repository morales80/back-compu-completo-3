const express = require("express");
const cors = require("cors");
const scrapearCompuTrabajo = require("./scrapearCompuTrabajo.js");
let fetch;
try {
  fetch = (...args) => import("node-fetch").then((mod) => mod.default(...args));
} catch (e) {
  console.error("No se pudo cargar node-fetch:", e);
}

const app = express();
const port = process.env.PORT || 3000;

// Usa el paquete oficial cors ANTES de cualquier ruta o middleware que responda
app.use(cors());

// Middleware para responder correctamente a OPTIONS con cabeceras explícitas
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    return res.status(200).end();
  }
  next();
});

// Middleware logger opcional
app.use((req, res, next) => {
  console.log(
    `Incoming ${req.method} request to ${req.url} from origin: ${req.headers.origin}`
  );
  next();
});

// Middleware para procesar JSON y otros datos
app.use(express.json());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use("/output", express.static("output"));

// Rutas de la API
app.post("/buscar", async (req, res) => {
  const { busqueda } = req.body;

  if (!busqueda || busqueda.length < 3) {
    return res
      .status(400)
      .json({ error: "La búsqueda debe tener al menos 3 caracteres" });
  }

  try {
    const resultados = await scrapearCompuTrabajo(busqueda);
    res.json({ cantidad: resultados.length, trabajos: resultados });
  } catch (err) {
    console.error("Error al hacer scraping:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.get("/geocode", async (req, res) => {
  const q = req.query.q;
  if (!q)
    return res.status(400).json({ error: "El parámetro q es obligatorio" });

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}`,
      {
        headers: {
          "User-Agent": "TuAppNombre/1.0 (tu-email@ejemplo.com)",
        },
      }
    );
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Error al obtener datos de geocodificación" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error en proxy geocoding:", error);
    res.status(500).json({ error: "Error interno en proxy geocoding" });
  }
});

app.get("/", (req, res) => {
  const htmlresponse = `
  <h1>API de back-computrabajo</h1>
  <p>Usa el endpoint <code>/buscar</code> con método POST y un cuerpo JSON como este:</p>
  <pre>
  {
    "busqueda": "tu palabra clave"
  }
  </pre>
  `;
  res.send(htmlresponse);
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
