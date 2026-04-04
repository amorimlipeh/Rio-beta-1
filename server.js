const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const produtosPath = './data/produtos.json';
const pedidosPath = './data/pedidos.json';

app.get('/api/separacao', (req, res) => {
  try {
    const pedidos = JSON.parse(fs.readFileSync(pedidosPath));
    const produtos = JSON.parse(fs.readFileSync(produtosPath));

    const fila = pedidos
      .filter(p => p.status === 'aberto')
      .map(p => {
        const prod = produtos.find(x => x.codigo === p.produto);
        return {
          pedido: p.id,
          cliente: p.cliente,
          produtoCodigo: p.produto,
          nome: prod ? prod.nome : 'Produto não encontrado',
          endereco: prod ? prod.endereco : '-',
          quantidade: p.quantidade
        };
      });

    res.json(fila);
  } catch (e) {
    console.log(e);
    res.status(500).json([]);
  }
});

app.post('/api/separacao/confirmar', (req, res) => {
  try {
    const { codigo, quantidade } = req.body;

    const produtos = JSON.parse(fs.readFileSync(produtosPath));
    const pedidos = JSON.parse(fs.readFileSync(pedidosPath));

    const prod = produtos.find(p => p.codigo === codigo);
    if (!prod) return res.json({ ok:false });

    if (prod.estoque < quantidade) {
      return res.json({ ok:false });
    }

    prod.estoque -= quantidade;

    const pedido = pedidos.find(p => p.produto === codigo && p.status === 'aberto');
    if (pedido) pedido.status = 'separado';

    fs.writeFileSync(produtosPath, JSON.stringify(produtos, null, 2));
    fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));

    res.json({ ok:true });

  } catch (e) {
    console.log(e);
    res.json({ ok:false });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor rodando...');
});

// ===============================
// SEPARAÇÃO (PICKING)
// ===============================

app.get('/api/separacao', (req, res) => {
  try {
    const fs = require('fs');

    const pedidos = JSON.parse(fs.readFileSync('data/pedidos.json', 'utf8') || '[]');
    const produtos = JSON.parse(fs.readFileSync('data/produtos.json', 'utf8') || '[]');
    const estoque = JSON.parse(fs.readFileSync('data/estoque.json', 'utf8') || '[]');

    const fila = pedidos
      .filter(p => p.status === 'aberto')
      .map(p => {
        const prod = produtos.find(pr => pr.codigo === p.produtoCodigo) || {};
        const est = estoque.find(e => e.codigo === p.produtoCodigo) || {};

        return {
          pedido: p.numero || p.id,
          cliente: p.cliente,
          produtoCodigo: p.produtoCodigo,
          nome: prod.nome || 'Produto',
          endereco: est.endereco || 'SEM ENDEREÇO',
          quantidade: p.quantidade
        };
      });

    res.json(fila);
  } catch (e) {
    console.log('ERRO /api/separacao:', e);
    res.json([]);
  }
});

app.post('/api/separacao/confirmar', (req, res) => {
  try {
    const fs = require('fs');
    const { codigo, quantidade } = req.body;

    let pedidos = JSON.parse(fs.readFileSync('data/pedidos.json', 'utf8') || '[]');
    let estoque = JSON.parse(fs.readFileSync('data/estoque.json', 'utf8') || '[]');

    const pedido = pedidos.find(p => p.produtoCodigo === codigo && p.status === 'aberto');

    if (!pedido) {
      return res.json({ ok: false });
    }

    pedido.status = 'separado';

    const itemEstoque = estoque.find(e => e.codigo === codigo);
    if (itemEstoque) {
      itemEstoque.estoque = Math.max(0, (itemEstoque.estoque || 0) - quantidade);
    }

    fs.writeFileSync('data/pedidos.json', JSON.stringify(pedidos, null, 2));
    fs.writeFileSync('data/estoque.json', JSON.stringify(estoque, null, 2));

    res.json({ ok: true });
  } catch (e) {
    console.log('ERRO confirmar:', e);
    res.json({ ok: false });
  }
});

