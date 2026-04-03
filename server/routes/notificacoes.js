
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const file = path.join(dataDir, 'notificacoes.json');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  const list = readJSON(file, []);
  res.json(list.slice(0, 50));
});

router.post('/', (req, res) => {
  const { tipo, msg } = req.body || {};
  if (!msg) return res.status(400).json({ error: 'msg obrigatório' });
  const list = readJSON(file, []);
  list.unshift({ tipo: tipo || 'info', msg, data: new Date().toISOString() });
  writeJSON(file, list);
  res.json({ ok: true });
});

module.exports = router;
