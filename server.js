const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const DATA = './data';

function read(file, fallback = []) {
  try {
    return JSON.parse(fs.readFileSync(`${DATA}/${file}`));
  } catch {
    return fallback;
  }
}

// 🔥 NORMALIZAÇÃO (AQUI ESTAVA O ERRO)
function normalizarProdutos(lista) {
  return lista.map(p => ({
    codigo: p.codigo || p.cod || "SEM-COD",
    nome: p.nome || p.descricao || "Produto sem nome",
    estoque: p.estoque ?? p.quantidade ?? 0,
    endereco: p.endereco || "Não definido"
  }));
}

// DASHBOARD
app.get('/api/dashboard', (req, res) => {
  const produtos = normalizarProdutos(read('produtos.json'));
  const pedidos = read('pedidos.json');

  res.json({
    totalProdutos: produtos.length,
    totalEstoque: produtos.reduce((t, p) => t + p.estoque, 0),
    pedidosAbertos: pedidos.length
  });
});

// PRODUTOS
app.get('/api/produtos', (req, res) => {
  const produtos = normalizarProdutos(read('produtos.json'));
  res.json(produtos);
});

// ESTOQUE
app.get('/api/estoque', (req, res) => {
  const produtos = normalizarProdutos(read('produtos.json'));
  res.json(produtos);
});

// PEDIDOS
app.get('/api/pedidos', (req, res) => {
  res.json(read('pedidos.json'));
});

// WMS
app.get('/api/wms', (req, res) => {
  res.json(read('wms.json'));
});

// HEALTH
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// STATIC
app.use(express.static('public'));

app.get('*', (req, res) => {
  res.sendFile(path.resolve('public/index.html'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor rodando 🚀');
});
