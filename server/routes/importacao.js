
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const importacoesFile = path.join(dataDir, 'importacoes.json');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  const list = readJSON(importacoesFile, []);
  res.json(list.slice(0, 50));
});

router.post('/simular', (req, res) => {
  const { nomeArquivo, linhas, observacao } = req.body || {};
  const list = readJSON(importacoesFile, []);
  list.unshift({
    id: Date.now().toString(),
    nomeArquivo: nomeArquivo || 'arquivo.xlsx',
    linhas: Number(linhas || 0),
    observacao: observacao || 'Pré-análise gerada',
    status: 'simulada',
    data: new Date().toISOString()
  });
  writeJSON(importacoesFile, list);
  res.json({ ok: true });
});

module.exports = router;
