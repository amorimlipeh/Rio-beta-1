
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const pedidosFile = path.join(dataDir, 'pedidos.json');
const estoqueFile = path.join(dataDir, 'estoque.json');
const notificacoesFile = path.join(dataDir, 'notificacoes.json');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}
function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Lista pedidos abertos
router.get('/pedidos-abertos', (req, res) => {
  const pedidos = readJSON(pedidosFile, []);
  res.json(pedidos.filter(p => p.status === 'aberto'));
});

// Iniciar separação
router.post('/iniciar/:id', (req, res) => {
  const pedidos = readJSON(pedidosFile, []);
  const idx = pedidos.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pedido não encontrado' });
  pedidos[idx].status = 'separacao';
  writeJSON(pedidosFile, pedidos);
  res.json({ ok: true });
});

// Confirmar retirada (baixa estoque)
router.post('/confirmar', (req, res) => {
  const { produto, quantidade } = req.body || {};
  if (!produto || !quantidade) return res.status(400).json({ error: 'Dados inválidos' });

  const estoque = readJSON(estoqueFile, []);
  const item = estoque.find(i => i.codigo === produto);
  if (!item) return res.status(404).json({ error: 'Produto não encontrado no estoque' });

  item.quantidade = Math.max(0, (item.quantidade || 0) - Number(quantidade));
  writeJSON(estoqueFile, estoque);

  const notas = readJSON(notificacoesFile, []);
  notas.unshift({ tipo: 'separacao', msg: `Saída de ${quantidade} do produto ${produto}`, data: new Date().toISOString() });
  writeJSON(notificacoesFile, notas);

  res.json({ ok: true, estoque: item.quantidade });
});

// Concluir pedido
router.post('/concluir/:id', (req, res) => {
  const pedidos = readJSON(pedidosFile, []);
  const idx = pedidos.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pedido não encontrado' });
  pedidos[idx].status = 'concluido';
  writeJSON(pedidosFile, pedidos);

  const notas = readJSON(notificacoesFile, []);
  notas.unshift({ tipo: 'pedido', msg: `Pedido ${req.params.id} concluído`, data: new Date().toISOString() });
  writeJSON(notificacoesFile, notas);

  res.json({ ok: true });
});

module.exports = router;
