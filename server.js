const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const CHANNELS_FILE = path.join(__dirname, "channels.json");
const USERS_FILE = path.join(__dirname, "users.json");

// 🔐 ADMIN WEB
const ADMIN_USER = "admin";
const ADMIN_PASS = "eftech123";

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", "Basic realm='EFTech Admin'");
    return res.status(401).send("Acceso restringido");
  }

  const base64 = auth.split(" ")[1];
  const decoded = Buffer.from(base64, "base64").toString("utf8");
  const [user, pass] = decoded.split(":");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return next();
  }

  res.setHeader("WWW-Authenticate", "Basic realm='EFTech Admin'");
  return res.status(401).send("Usuario o contraseña incorrectos");
}

// 📺 CANALES
function getChannels() {
  const data = fs.readFileSync(CHANNELS_FILE, "utf8");
  return JSON.parse(data);
}

function saveChannels(channels) {
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
}

// 👤 USUARIOS
function getUsers() {
  const data = fs.readFileSync(USERS_FILE, "utf8");
  return JSON.parse(data);
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("API EFTech funcionando");
});

// 🛡️ PANEL ADMIN PROTEGIDO
app.get("/admin.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// 📺 LISTAR CANALES - APK
app.get("/api/channels", (req, res) => {
  try {
    res.json(getChannels());
  } catch (error) {
    res.status(500).json({ error: "Error leyendo channels.json" });
  }
});

// 📂 CATEGORÍAS - APK
app.get("/api/categories", (req, res) => {
  try {
    const channels = getChannels();

    const categories = [
      ...new Set(channels.map(channel => channel.category))
    ];

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Error leyendo categorías" });
  }
});

// ➕ AGREGAR CANAL - ADMIN
app.post("/api/add-channel", requireAdmin, (req, res) => {
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
      id: channels.length > 0 ? Math.max(...channels.map(c => c.id)) + 1 : 1,
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

// ✏️ EDITAR CANAL - ADMIN
app.put("/api/channel/:id", requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, category, logo, stream_url } = req.body;

    const channels = getChannels();
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

// ❌ BORRAR CANAL - ADMIN
app.delete("/api/channel/:id", requireAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const channels = getChannels();
    const filtered = channels.filter(channel => channel.id !== id);

    saveChannels(filtered);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error borrando canal"
    });
  }
});

// 👤 LISTAR USUARIOS - ADMIN
app.get("/api/users", requireAdmin, (req, res) => {
  try {
    res.json(getUsers());
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error leyendo usuarios"
    });
  }
});

// ➕ AGREGAR USUARIO - ADMIN
app.post("/api/add-user", requireAdmin, (req, res) => {
  try {
    const { username, password, active, expires } = req.body;

    if (!username || !password || !expires) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos obligatorios"
      });
    }

    const users = getUsers();

    const exists = users.find(user => user.username === username);

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "El usuario ya existe"
      });
    }

    const newUser = {
      username,
      password,
      active: active === true,
      expires
    };

    users.push(newUser);
    saveUsers(users);

    res.json({
      success: true,
      user: newUser
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error agregando usuario"
    });
  }
});

// ✏️ EDITAR USUARIO - ADMIN
app.put("/api/user/:username", requireAdmin, (req, res) => {
  try {
    const username = req.params.username;
    const { password, active, expires } = req.body;

    const users = getUsers();
    const index = users.findIndex(user => user.username === username);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    users[index] = {
      ...users[index],
      password: password || users[index].password,
      active: typeof active === "boolean" ? active : users[index].active,
      expires: expires || users[index].expires
    };

    saveUsers(users);

    res.json({
      success: true,
      user: users[index]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error editando usuario"
    });
  }
});

// ❌ BORRAR USUARIO - ADMIN
app.delete("/api/user/:username", requireAdmin, (req, res) => {
  try {
    const username = req.params.username;

    const users = getUsers();
    const filtered = users.filter(user => user.username !== username);

    saveUsers(filtered);

    res.json({ success: true });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error borrando usuario"
    });
  }
});

// 🔐 LOGIN APK
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