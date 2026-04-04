const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function ensureJson(file, fallback) {
  ensureDir(DATA_DIR);
  const full = path.join(DATA_DIR, file);
  if (!fs.existsSync(full)) {
    fs.writeFileSync(full, JSON.stringify(fallback, null, 2), 'utf8');
  }
}

function readJson(file, fallback = []) {
  ensureJson(file, fallback);
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  } catch (e) {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf8');
}

function normalizeProduct(p) {
  return {
    id: p.id || Date.now(),
    codigo: String(p.codigo || '').trim().toUpperCase(),
    nome: String(p.nome || 'Produto sem nome').trim(),
    endereco: String(p.endereco || 'Não definido').trim() || 'Não definido',
    estoque: Number(p.estoque ?? 0),
    imagem: p.imagem || '',
    fator: Number(p.fator ?? 1)
  };
}

ensureJson('produtos.json', []);
ensureJson('pedidos.json', []);
ensureJson('movimentos.json', []);
ensureJson('wms.json', []);

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.json({ ok: true, app: 'RIOBETA1' });
});

app.get('/api/produtos', (req, res) => {
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  res.json(produtos);
});

app.get('/api/produto/:codigo', (req, res) => {
  const codigo = String(req.params.codigo || '').trim().toUpperCase();
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const item = produtos.find(p => p.codigo === codigo);

  if (!item) {
    return res.json({ erro: true, msg: 'Produto não encontrado' });
  }

  res.json(item);
});

app.post('/api/produtos', (req, res) => {
  const { codigo, nome, endereco, imagem, fator, estoque } = req.body || {};

  if (!codigo || !nome) {
    return res.status(400).json({ ok: false, msg: 'Código e nome são obrigatórios.' });
  }

  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const cod = String(codigo).trim().toUpperCase();

  if (produtos.some(p => p.codigo === cod)) {
    return res.status(409).json({ ok: false, msg: 'Código já existe.' });
  }

  const novo = normalizeProduct({
    id: Date.now(),
    codigo: cod,
    nome,
    endereco,
    imagem,
    fator,
    estoque: Number(estoque || 0)
  });

  produtos.unshift(novo);
  writeJson('produtos.json', produtos);

  res.json({ ok: true, item: novo });
});

app.get('/api/pedidos', (req, res) => {
  const pedidos = readJson('pedidos.json', []);
  res.json(pedidos);
});

app.post('/api/pedidos', (req, res) => {
  const { numero, cliente, produtoCodigo, quantidade } = req.body || {};

  if (!cliente || !produtoCodigo || !quantidade) {
    return res.status(400).json({
      ok: false,
      msg: 'Cliente, produto e quantidade são obrigatórios.'
    });
  }

  const pedidos = readJson('pedidos.json', []);
  const novo = {
    id: 'PED' + Date.now(),
    numero: numero ? String(numero).trim() : 'PED-' + String(Date.now()).slice(-6),
    cliente: String(cliente).trim(),
    produtoCodigo: String(produtoCodigo).trim().toUpperCase(),
    quantidade: Number(quantidade),
    status: 'aberto',
    criadoEm: new Date().toISOString()
  };

  pedidos.unshift(novo);
  writeJson('pedidos.json', pedidos);

  res.json({ ok: true, item: novo });
});

app.get('/api/separacao', (req, res) => {
  const pedidos = readJson('pedidos.json', []).filter(p => String(p.status || '').toLowerCase() === 'aberto');
  const produtos = readJson('produtos.json', []).map(normalizeProduct);

  const fila = pedidos.map(p => {
    const prod = produtos.find(x => x.codigo === String(p.produtoCodigo || '').toUpperCase()) || {};
    return {
      pedido: p.numero || p.id,
      produtoCodigo: p.produtoCodigo || 'Sem código',
      nome: prod.nome || 'Sem nome',
      endereco: prod.endereco || 'Não definido',
      quantidade: Number(p.quantidade || 0),
      estoque: Number(prod.estoque || 0),
      cliente: p.cliente || 'Sem cliente'
    };
  });

  res.json(fila);
});

app.get('/api/wms', (req, res) => {
  const wms = readJson('wms.json', []);
  res.json(wms);
});

app.post('/api/baixa', (req, res) => {
  try {
    const { codigo, quantidade } = req.body || {};
    const produtos = readJson('produtos.json', []).map(normalizeProduct);
    const idx = produtos.findIndex(p => p.codigo === String(codigo || '').trim().toUpperCase());

    if (idx === -1) {
      return res.json({ erro: true, msg: 'Produto não encontrado' });
    }

    const qtd = Number(quantidade || 1);

    if (produtos[idx].estoque < qtd) {
      return res.json({ erro: true, msg: 'Sem estoque' });
    }

    produtos[idx].estoque -= qtd;
    writeJson('produtos.json', produtos);

    res.json({ ok: true, estoque: produtos[idx].estoque });
  } catch (e) {
    res.json({ erro: true, msg: 'Erro interno' });
  }
});

app.get('/modules-list', (req, res) => {
  try {
    const pasta = path.join(__dirname, 'public/modules');
    const arquivos = fs.readdirSync(pasta).filter(f => f.endsWith('.html'));
    res.json(arquivos.map(f => f.replace('.html', '')));
  } catch (e) {
    res.json([]);
  }
});

app.use(express.static(PUBLIC_DIR, { etag: false, maxAge: 0 }));

app.get('*', (req, res) => {
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return res.status(200).send('RIOBETA1 ONLINE');
});



// =============================
// ROTA BUSCA PRODUTOS (FIX)
// =============================
app.get('/api/produtos/busca', (req, res) => {
  try {
    const termo = String(req.query.q || '').toUpperCase().trim();

    const produtos = readJson('produtos.json', []);

    if (!termo) return res.json([]);

    const encontrados = produtos.filter(p => {
      const codigo = String(p.codigo || '').toUpperCase();
      const nome = String(p.nome || '').toUpperCase();
      return codigo.includes(termo) || nome.includes(termo);
    });

    res.json(encontrados.slice(0, 10));

  } catch (err) {
    console.error("ERRO BUSCA PRODUTOS:", err);
    res.status(500).json([]);
  }
});

// ROTA_BUSCA_PRODUTOS_OK

app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor rodando na porta ' + PORT);
});
