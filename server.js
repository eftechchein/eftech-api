const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 📺 CANALES
const channels = [
  {
    id: 1,
    name: "Canal Demo",
    category: "Prueba",
    logo: "https://via.placeholder.com/150",
    stream_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: 2,
    name: "Canal Demo 2",
    category: "Prueba",
    logo: "https://via.placeholder.com/150",
    stream_url: "https://test-streams.mux.dev/test_001/stream.m3u8"
  }
];

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
  res.json(channels);
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