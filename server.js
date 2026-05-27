const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("API EFTech funcionando");
});

app.get("/api/channels", (req, res) => {
  res.json(channels);
});

app.listen(3000, () => {
  console.log("API EFTech funcionando en http://localhost:3000");
});