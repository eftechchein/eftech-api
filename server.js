const express = require("express");
const cors = require("cors");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

const SUPABASE_URL = "https://jbskwrdhyohtkvllxzpe.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impic2t3cmRoeW9odGt2bGx4enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTkxNTMyOSwiZXhwIjoyMDk1NDkxMzI5fQ.kD6uHOC48GX4qUrlAfJ6RN50PRVRnL80qj-YRCp6VtI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

// 🟢 HOME
app.get("/", (req, res) => {
  res.send("API EFTech funcionando con Supabase");
});

// 🛡️ PANEL ADMIN
app.get("/admin.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// 📺 LISTAR CANALES
app.get("/api/channels", async (req, res) => {
  const { data, error } = await supabase
    .from("channels")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({
      error: "Error leyendo canales",
      details: error.message
    });
  }

  res.json(data);
});

// 📂 CATEGORÍAS
app.get("/api/categories", async (req, res) => {
  const { data, error } = await supabase
    .from("channels")
    .select("category");

  if (error) {
    return res.status(500).json({
      error: "Error leyendo categorías",
      details: error.message
    });
  }

  const categories = [
    ...new Set(data.map(channel => channel.category))
  ].sort();

  res.json(categories);
});

// ➕ AGREGAR CANAL
app.post("/api/add-channel", requireAdmin, async (req, res) => {
  const { name, category, logo, stream_url } = req.body;

  if (!name || !category || !stream_url) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos obligatorios"
    });
  }

  const { data, error } = await supabase
    .from("channels")
    .insert([
      {
        name,
        category,
        logo: logo || "https://via.placeholder.com/150",
        stream_url
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error agregando canal",
      details: error.message
    });
  }

  res.json({
    success: true,
    channel: data
  });
});

// ✏️ EDITAR CANAL
app.put("/api/channel/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, logo, stream_url } = req.body;

  const { data, error } = await supabase
    .from("channels")
    .update({
      name,
      category,
      logo,
      stream_url
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error editando canal",
      details: error.message
    });
  }

  res.json({
    success: true,
    channel: data
  });
});

// ❌ BORRAR CANAL
app.delete("/api/channel/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error borrando canal",
      details: error.message
    });
  }

  res.json({ success: true });
});

// 👤 LISTAR USUARIOS
app.get("/api/users", requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error leyendo usuarios",
      details: error.message
    });
  }

  res.json(data);
});

// ➕ AGREGAR USUARIO
app.post("/api/add-user", requireAdmin, async (req, res) => {
  const { username, password, active, expires } = req.body;

  if (!username || !password || !expires) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos obligatorios"
    });
  }

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        username,
        password,
        active: active === true,
        expires
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error agregando usuario",
      details: error.message
    });
  }

  res.json({
    success: true,
    user: data
  });
});

// ✏️ EDITAR USUARIO
app.put("/api/user/:username", requireAdmin, async (req, res) => {
  const username = req.params.username;
  const { password, active, expires } = req.body;

  const updateData = {};

  if (password) updateData.password = password;
  if (typeof active === "boolean") updateData.active = active;
  if (expires) updateData.expires = expires;

  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("username", username)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error editando usuario",
      details: error.message
    });
  }

  res.json({
    success: true,
    user: data
  });
});

// ❌ BORRAR USUARIO
app.delete("/api/user/:username", requireAdmin, async (req, res) => {
  const username = req.params.username;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("username", username);

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Error borrando usuario",
      details: error.message
    });
  }

  res.json({ success: true });
});

// 🔐 LOGIN APK
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !user) {
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
  console.log(`API EFTech con Supabase funcionando en puerto ${PORT}`);
});