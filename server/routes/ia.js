
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const produtosFile = path.join(dataDir, 'produtos.json');

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch(e) { return def; }
}

router.get('/resumo', (req, res) => {
  const produtos = readJSON(produtosFile, []);
  const baixo = produtos.filter(p => Number(p.estoque || 0) < 20);
  const parado = produtos.filter(p => Number(p.estoque || 0) > 100);

  res.json({
    sugestoes: [
      `Produtos com estoque baixo: ${baixo.length}`,
      `Produtos com estoque alto/parado: ${parado.length}`,
      baixo.length ? `Repor primeiro: ${baixo.map(x => x.codigo).join(', ')}` : 'Sem urgência de reposição.',
      parado.length ? `Avaliar giro de: ${parado.map(x => x.codigo).slice(0,5).join(', ')}` : 'Sem excesso relevante.'
    ]
  });
});

module.exports = router;
