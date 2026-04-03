const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PUBLIC_DIR = path.join(__dirname, 'public');

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    app: 'RIOBETA1',
    time: new Date().toISOString()
  });
});

app.get('/api/dashboard', (req, res) => {
  try {
    const produtos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'produtos.json'), 'utf8'));
    const pedidos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'pedidos.json'), 'utf8'));

    const totalProdutos = Array.isArray(produtos) ? produtos.length : 0;
    const totalEstoque = Array.isArray(produtos)
      ? produtos.reduce((acc, p) => acc + Number(p.quantidade || p.estoque || 0), 0)
      : 0;
    const pedidosAbertos = Array.isArray(pedidos)
      ? pedidos.filter(p => (p.status || '').toLowerCase() === 'aberto').length
      : 0;

    return res.json({ totalProdutos, totalEstoque, pedidosAbertos });
  } catch (err) {
    return res.json({ totalProdutos: 0, totalEstoque: 0, pedidosAbertos: 0 });
  }
});

if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, { etag: false, maxAge: 0 }));
}

app.get('*', (req, res) => {
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return res.status(200).send('RIOBETA1 ONLINE');
});

const PORT = process.env.PORT || 3000;
app.post('/salvar-wms', (req, res) => {  require('fs').writeFileSync('data/wms.json', JSON.stringify(req.body, null, 2));  res.send({ ok: true });});
app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta ' + PORT);
});
