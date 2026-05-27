const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const CHANNELS_FILE = path.join(__dirname, "channels.json");
const USERS_FILE = path.join(__dirname, "users.json");

// 📺 CANALES
function getChannels() {
  const data = fs.readFileSync(CHANNELS_FILE, "utf8");
  return JSON.parse(data);
}

function saveChannels(channels) {
  fs.writeFileSync(
    CHANNELS_FILE,
    JSON.stringify(channels, null, 2)
  );
}

// 👤 USUARIOS
function getUsers() {
  const data = fs.readFileSync(USERS_FILE, "utf8");
  return JSON.parse(data);
}

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("API EFTech funcionando");
});

// 📺 LISTAR CANALES
app.get("/api/channels", (req, res) => {
  try {
    res.json(getChannels());
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
      ...new Set(channels.map(channel => channel.category))
    ];

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      error: "Error leyendo categorías"
    });
  }
});

// ➕ AGREGAR CANAL
app.post("/api/add-channel", (req, res) => {
  try {
    const { name, category, logo, stream_url } = req.body;

    if (!name || !category || !stream_url) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios"
      });
    }

    const channels = getChannels();

    const newChannel = {
      id: channels.length > 0
        ? Math.max(...channels.map(c => c.id)) + 1
        : 1,
      name,
      category,
      logo: logo || "https://via.placeholder.com/150",
      stream_url
    };

    channels.push(newChannel);
    saveChannels(channels);

    res.json({
      success: true,
      channel: newChannel
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error agregando canal"
    });
  }
});

// ✏️ EDITAR CANAL
app.put("/api/channel/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, logo, stream_url } = req.body;

    let channels = getChannels();

    const index = channels.findIndex(channel => channel.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Canal no encontrado"
      });
    }

    channels[index] = {
      ...channels[index],
      name: name || channels[index].name,
      category: category || channels[index].category,
      logo: logo || channels[index].logo,
      stream_url: stream_url || channels[index].stream_url
    };

    saveChannels(channels);

    res.json({
      success: true,
      channel: channels[index]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error editando canal"
    });
  }
});

// ❌ BORRAR CANAL
app.delete("/api/channel/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id);

    let channels = getChannels();

    const filtered =
      channels.filter(channel => channel.id !== id);

    saveChannels(filtered);

    res.json({
      success: true
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error borrando canal"
    });
  }
});

// 🔐 LOGIN
app.post("/api/login", (req, res) => {
  try {
    const { username, password } = req.body;

    const users = getUsers();

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

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error en login"
    });
  }
});

// 🚀 SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API EFTech funcionando en puerto ${PORT}`);
});