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
