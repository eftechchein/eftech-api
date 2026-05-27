const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// 📺 LEER CANALES DESDE channels.json
function getChannels() {
  const filePath = path.join(__dirname, "channels.json");
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

// 👤 USUARIOS
const users = [
  {
    username: "admin",
    password: "1234",
    active: true,
    expires: "2026-12-31"
  },
  {
    username: "cliente1",
    password: "1111",
    active: true,
    expires: "2026-12-31"
  },
  {
    username: "cliente2",
    password: "2222",
    active: false,
    expires: "2026-12-31"
  }
];

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("API EFTech funcionando");
});

// 📺 LISTA DE CANALES
app.get("/api/channels", (req, res) => {
  try {
    const channels = getChannels();
    res.json(channels);
  } catch (error) {
    res.status(500).json({
      error: "Error leyendo channels.json"
    });
  }
});

// 📂 CATEGORÍAS
app.get("/api/categories", (req, res) => {
  try {
    const channels = getChannels();

    const categories = [
      ...new Set(
        channels.map(channel => channel.category)
      )
    ];

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: "Error leyendo categorías"
    });
  }
});

// 🔐 LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Usuario o contraseña incorrectos"
    });
  }

  if (!user.active) {
    return res.status(403).json({
      success: false,
      message: "Usuario desactivado"
    });
  }

  const today = new Date();
  const expires = new Date(user.expires);

  if (expires < today) {
    return res.status(403).json({
      success: false,
      message: "Cuenta vencida"
    });
  }

  res.json({
    success: true,
    username: user.username,
    expires: user.expires
  });
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API EFTech funcionando en puerto ${PORT}`);
});