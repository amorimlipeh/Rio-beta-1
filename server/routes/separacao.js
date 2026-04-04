const express = require('express');
const router = express.Router();

const fs = require('fs');

function load(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

router.get('/', (req, res) => {
  try {
    const pedidos = load('./data/pedidos.json');
    const produtos = load('./data/produtos.json');

    const fila = [];

    pedidos.forEach(p => {
      const codigo =
        p.produto ||
        p.produtoCodigo ||
        p.codigo ||
        p.item;

      const quantidade =
        p.quantidade ||
        p.qtd ||
        p.q ||
        0;

      const cliente =
        p.cliente ||
        p.loja ||
        'Cliente';

      const prod = produtos.find(x => x.codigo === codigo);

      if (!prod) return;

      fila.push({
        pedido: p.numero || p.id || 'SEM_NUMERO',
        produtoCodigo: prod.codigo,
        nome: prod.nome,
        endereco: prod.endereco,
        quantidade,
        cliente,
        estoque: prod.estoque
      });
    });

    res.json(fila);

  } catch (e) {
    res.status(500).json({ erro: 'Erro separação', detalhe: e.message });
  }
});

router.post('/confirmar', (req, res) => {
  try {
    const { codigo, quantidade } = req.body;

    const produtos = load('./data/produtos.json');
    const prod = produtos.find(p => p.codigo === codigo);

    if (!prod) {
      return res.json({ ok:false, msg:'Produto não encontrado' });
    }

    if (prod.estoque < quantidade) {
      return res.json({ ok:false, msg:'Estoque insuficiente' });
    }

    prod.estoque -= quantidade;

    fs.writeFileSync('./data/produtos.json', JSON.stringify(produtos,null,2));

    res.json({ ok:true, estoque: prod.estoque });

  } catch (e) {
    res.json({ ok:false, msg:'Erro confirmar' });
  }
});

module.exports = router;
