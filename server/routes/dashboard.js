
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}

router.get('/kpis', (req, res) => {
  const produtos = readJSON(path.join(dataDir, 'produtos.json'), []);
  const pedidos = readJSON(path.join(dataDir, 'pedidos.json'), []);
  const movimentos = readJSON(path.join(dataDir, 'movimentos.json'), []);
  const notificacoes = readJSON(path.join(dataDir, 'notificacoes.json'), []);

  const hoje = new Date().toISOString().slice(0, 10);
  const movHoje = movimentos.filter(m => String(m.data || '').slice(0, 10) === hoje).length;

  res.json({
    totalProdutos: produtos.length,
    estoqueTotal: produtos.reduce((a, p) => a + Number(p.estoque || p.quantidade || 0), 0),
    pedidosAbertos: pedidos.filter(p => p.status === 'aberto' || p.status === 'separacao').length,
    pedidosConcluidos: pedidos.filter(p => p.status === 'concluido').length,
    movimentacoesHoje: movHoje,
    alertas: notificacoes.slice(0, 8)
  });
});

router.get('/atividade', (req, res) => {
  const pedidos = readJSON(path.join(dataDir, 'pedidos.json'), []);
  const movimentos = readJSON(path.join(dataDir, 'movimentos.json'), []);
  const notificacoes = readJSON(path.join(dataDir, 'notificacoes.json'), []);

  const feed = [];

  pedidos.slice(0, 10).forEach(p => {
    feed.push({
      tipo: 'pedido',
      titulo: `Pedido ${p.numero || p.id}`,
      detalhe: `${p.cliente || 'Sem cliente'} • status: ${p.status || 'aberto'}`,
      data: p.data || new Date().toISOString()
    });
  });

  movimentos.slice(0, 10).forEach(m => {
    feed.push({
      tipo: 'movimento',
      titulo: `${m.codigo || '-'} ${m.nome || ''}`.trim(),
      detalhe: `Movimento: ${m.quantidade > 0 ? '+' : ''}${m.quantidade || 0} • estoque final: ${m.estoqueFinal ?? '-'}`,
      data: m.data || new Date().toISOString()
    });
  });

  notificacoes.slice(0, 10).forEach(n => {
    feed.push({
      tipo: n.tipo || 'info',
      titulo: 'Notificação',
      detalhe: n.msg || n.texto || '-',
      data: n.data || new Date().toISOString()
    });
  });

  feed.sort((a, b) => new Date(b.data) - new Date(a.data));
  res.json(feed.slice(0, 20));
});

module.exports = router;
