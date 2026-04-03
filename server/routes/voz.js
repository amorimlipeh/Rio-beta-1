
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const pedidosFile = path.join(dataDir, 'pedidos.json');
const produtosFile = path.join(dataDir, 'produtos.json');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}

router.get('/fila', (req, res) => {
  const pedidos = readJSON(pedidosFile, []);
  const produtos = readJSON(produtosFile, []);
  const itens = [];

  pedidos.filter(p => p.status === 'aberto' || p.status === 'separacao').forEach(p => {
    (p.itens || []).forEach(i => {
      const prod = produtos.find(x => x.codigo === i.codigo) || {};
      itens.push({
        pedido: p.numero || p.id,
        codigo: i.codigo,
        nome: prod.nome || i.codigo,
        endereco: prod.endereco || '-',
        quantidade: i.quantidade || 0
      });
    });
  });

  res.json(itens);
});

module.exports = router;
