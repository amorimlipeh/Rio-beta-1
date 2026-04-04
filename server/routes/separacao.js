const express = require('express');
const router = express.Router();
const fs = require('fs');

const produtosPath = './data/produtos.json';
const pedidosPath = './data/pedidos.json';

// GET FILA DE SEPARAÇÃO
router.get('/', (req, res) => {
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
    console.error(e);
    res.status(500).json({ erro: 'erro separacao' });
  }
});

// CONFIRMAR COLETA
router.post('/confirmar', (req, res) => {
  try {
    const { codigo, quantidade } = req.body;

    const produtos = JSON.parse(fs.readFileSync(produtosPath));
    const pedidos = JSON.parse(fs.readFileSync(pedidosPath));

    const prod = produtos.find(p => p.codigo === codigo);

    if (!prod) return res.json({ ok:false, msg:'Produto não encontrado' });

    if (prod.estoque < quantidade) {
      return res.json({ ok:false, msg:'Estoque insuficiente' });
    }

    // baixa estoque
    prod.estoque -= quantidade;

    // fecha pedido
    const pedido = pedidos.find(p => p.produto === codigo && p.status === 'aberto');
    if (pedido) pedido.status = 'separado';

    fs.writeFileSync(produtosPath, JSON.stringify(produtos, null, 2));
    fs.writeFileSync(pedidosPath, JSON.stringify(pedidos, null, 2));

    res.json({ ok:true });

  } catch (e) {
    console.error(e);
    res.json({ ok:false });
  }
});

module.exports = router;
