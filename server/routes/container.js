
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const containerFile = path.join(dataDir, 'containers.json');
const notasFile = path.join(dataDir, 'notificacoes.json');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  const list = readJSON(containerFile, []);
  res.json(list.slice(0, 100));
});

router.post('/', (req, res) => {
  const { codigo, fornecedor, status, observacao } = req.body || {};
  const list = readJSON(containerFile, []);
  const item = {
    id: Date.now().toString(),
    codigo: codigo || ('CTN-' + Date.now().toString().slice(-6)),
    fornecedor: fornecedor || 'Fornecedor não informado',
    status: status || 'chegou',
    observacao: observacao || '',
    data: new Date().toISOString()
  };
  list.unshift(item);
  writeJSON(containerFile, list);

  const notas = readJSON(notasFile, []);
  notas.unshift({ tipo: 'container', msg: `Container ${item.codigo} criado com status ${item.status}`, data: new Date().toISOString() });
  writeJSON(notasFile, notas);

  res.json({ ok: true, item });
});

router.post('/status/:id', (req, res) => {
  const { status } = req.body || {};
  const list = readJSON(containerFile, []);
  const idx = list.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Container não encontrado' });

  list[idx].status = status || list[idx].status;
  writeJSON(containerFile, list);

  const notas = readJSON(notasFile, []);
  notas.unshift({ tipo: 'container', msg: `Container ${list[idx].codigo} alterado para ${list[idx].status}`, data: new Date().toISOString() });
  writeJSON(notasFile, notas);

  res.json({ ok: true });
});

module.exports = router;
