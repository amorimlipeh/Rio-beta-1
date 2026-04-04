const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

function ensureDir(dir){
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function fileOf(name){
  ensureDir(DATA_DIR);
  return path.join(DATA_DIR, name);
}
function ensureJson(name, fallback){
  const f = fileOf(name);
  if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(fallback, null, 2));
}
function readJson(name, fallback=[]){
  ensureJson(name, fallback);
  return JSON.parse(fs.readFileSync(fileOf(name), 'utf8') || JSON.stringify(fallback));
}
function writeJson(name, data){
  fs.writeFileSync(fileOf(name), JSON.stringify(data, null, 2));
}

function normalizeProduct(p){
  return {
    id: p.id || Date.now(),
    codigo: p.codigo || p.cod || 'SEM-COD',
    nome: p.nome || p.descricao || 'Produto sem nome',
    estoque: Number(p.estoque ?? p.quantidade ?? 0),
    endereco: p.endereco || 'Não definido'
  };
}

(function seed(){
  ensureJson('produtos.json', [
    {"id":1,"codigo":"ARZ001","nome":"Arroz 5kg","estoque":120,"endereco":"05-001-3-1"},
    {"id":2,"codigo":"FEJ002","nome":"Feijão Preto 1kg","estoque":80,"endereco":"05-002-3-1"},
    {"id":3,"codigo":"MAC003","nome":"Macarrão Espaguete","estoque":65,"endereco":"05-003-3-1"}
  ]);
  ensureJson('pedidos.json', [
    {"id":"PED001","numero":"PED-001","cliente":"Mercado Central","produtoCodigo":"ARZ001","quantidade":10,"status":"aberto"}
  ]);
  ensureJson('movimentos.json', []);
  ensureJson('wms.json', [
    {"endereco":"05-001-3-1","status":"ocupado","produto":"ARZ001"},
    {"endereco":"05-002-3-1","status":"ocupado","produto":"FEJ002"},
    {"endereco":"05-003-3-1","status":"ocupado","produto":"MAC003"},
    {"endereco":"05-004-3-1","status":"livre","produto":""},
    {"endereco":"05-005-3-1","status":"bloqueado","produto":""}
  ]);
})();

app.get('/ping', (req,res)=> res.status(200).send('OK'));
app.get('/health', (req,res)=> res.status(200).json({ ok:true, app:'RIOBETA1', time:new Date().toISOString() }));

app.get('/api/dashboard', (req,res)=>{
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const pedidos = readJson('pedidos.json', []);
  const movimentos = readJson('movimentos.json', []);
  res.json({
    totalProdutos: produtos.length,
    totalEstoque: produtos.reduce((a,p)=> a + Number(p.estoque || 0), 0),
    pedidosAbertos: pedidos.filter(p => String(p.status || '').toLowerCase() === 'aberto').length,
    ultimosMovimentos: movimentos.slice(0, 5)
  });
});

app.get('/api/produtos', (req,res)=>{
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  res.json(produtos);
});

app.post('/api/produtos', (req,res)=>{
  const { codigo, nome, endereco } = req.body || {};
  if (!codigo || !nome) return res.status(400).json({ ok:false, msg:'Código e nome são obrigatórios.' });

  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  if (produtos.some(p => String(p.codigo).toUpperCase() === String(codigo).toUpperCase())) {
    return res.status(409).json({ ok:false, msg:'Código já existe.' });
  }

  const novo = normalizeProduct({
    id: Date.now(),
    codigo: String(codigo).trim().toUpperCase(),
    nome: String(nome).trim(),
    estoque: 0,
    endereco: String(endereco || 'Não definido').trim() || 'Não definido'
  });

  produtos.unshift(novo);
  writeJson('produtos.json', produtos);
  res.json({ ok:true, item: novo });
});

app.put('/api/produtos/:codigo', (req,res)=>{
  const codigo = String(req.params.codigo || '').toUpperCase();
  const { nome, endereco } = req.body || {};
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const idx = produtos.findIndex(p => String(p.codigo).toUpperCase() === codigo);
  if (idx === -1) return res.status(404).json({ ok:false, msg:'Produto não encontrado.' });

  produtos[idx].nome = nome ? String(nome).trim() : produtos[idx].nome;
  produtos[idx].endereco = endereco ? String(endereco).trim() : produtos[idx].endereco;
  writeJson('produtos.json', produtos);
  res.json({ ok:true, item: produtos[idx] });
});

app.get('/api/estoque', (req,res)=>{
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  res.json(produtos);
});

app.post('/api/estoque/movimento', (req,res)=>{
  const { codigo, quantidade, tipo } = req.body || {};
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const idx = produtos.findIndex(p => String(p.codigo).toUpperCase() === String(codigo || '').toUpperCase());
  if (idx === -1) return res.status(404).json({ ok:false, msg:'Produto não encontrado.' });

  const qtd = Number(quantidade || 0);
  if (!qtd) return res.status(400).json({ ok:false, msg:'Quantidade inválida.' });

  const delta = String(tipo || '').toLowerCase() === 'saida' ? -Math.abs(qtd) : Math.abs(qtd);
  const novoEstoque = Number(produtos[idx].estoque || 0) + delta;
  if (novoEstoque < 0) return res.status(400).json({ ok:false, msg:'Estoque não pode ficar negativo.' });

  produtos[idx].estoque = novoEstoque;
  writeJson('produtos.json', produtos);

  const movimentos = readJson('movimentos.json', []);
  movimentos.unshift({
    id: Date.now(),
    codigo: produtos[idx].codigo,
    nome: produtos[idx].nome,
    tipo: delta >= 0 ? 'entrada' : 'saida',
    quantidade: Math.abs(qtd),
    estoqueFinal: novoEstoque,
    data: new Date().toISOString()
  });
  writeJson('movimentos.json', movimentos.slice(0, 200));

  res.json({ ok:true, item: produtos[idx] });
});

app.get('/api/pedidos', (req,res)=>{
  res.json(readJson('pedidos.json', []));
});

app.post('/api/pedidos', (req,res)=>{
  const { numero, cliente, produtoCodigo, quantidade } = req.body || {};
  if (!cliente || !produtoCodigo || !quantidade) {
    return res.status(400).json({ ok:false, msg:'Cliente, produto e quantidade são obrigatórios.' });
  }

  const pedidos = readJson('pedidos.json', []);
  const novo = {
    id: 'PED' + Date.now(),
    numero: numero ? String(numero).trim() : 'PED-' + String(Date.now()).slice(-6),
    cliente: String(cliente).trim(),
    produtoCodigo: String(produtoCodigo).trim().toUpperCase(),
    quantidade: Number(quantidade),
    status: 'aberto'
  };

  pedidos.unshift(novo);
  writeJson('pedidos.json', pedidos);
  res.json({ ok:true, item: novo });
});

app.get('/api/wms', (req,res)=>{
  res.json(readJson('wms.json', []));
});

app.post('/api/wms/fixar', (req,res)=>{
  const { endereco, produto } = req.body || {};
  if (!endereco) return res.status(400).json({ ok:false, msg:'Endereço obrigatório.' });

  const wms = readJson('wms.json', []);
  const produtos = readJson('produtos.json', []).map(normalizeProduct);

  let idx = wms.findIndex(x => x.endereco === endereco);
  if (idx === -1) {
    wms.push({ endereco, status:'livre', produto:'' });
    idx = wms.length - 1;
  }

  wms[idx].produto = produto ? String(produto).trim().toUpperCase() : '';
  if (wms[idx].status !== 'bloqueado') {
    wms[idx].status = wms[idx].produto ? 'ocupado' : 'livre';
  }

  if (wms[idx].produto) {
    const pidx = produtos.findIndex(p => String(p.codigo).toUpperCase() === wms[idx].produto);
    if (pidx >= 0) {
      produtos[pidx].endereco = endereco;
      writeJson('produtos.json', produtos);
    }
  }

  writeJson('wms.json', wms);
  res.json({ ok:true, item: wms[idx] });
});

app.get('/modules-list', (req, res) => {
  try {
    const pasta = path.join(__dirname, 'public/modules');
    const arquivos = fs.readdirSync(pasta).filter(f => f.endsWith('.html'));
    res.json(arquivos.map(f => f.replace('.html','')));
  } catch (e) {
    res.json([]);
  }
});

app.use(express.static(PUBLIC_DIR, { etag:false, maxAge:0 }));

app.get('*', (req,res)=>{
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  return res.status(200).send('RIOBETA1 ONLINE');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', ()=> console.log('Servidor rodando na porta ' + PORT));
