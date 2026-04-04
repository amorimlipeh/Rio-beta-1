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
    codigo: String(p.codigo || p.cod || '').trim().toUpperCase(),
    nome: String(p.nome || p.descricao || 'Produto sem nome').trim(),
    endereco: String(p.endereco || 'Não definido').trim() || 'Não definido',
    estoque: Number(p.estoque ?? p.quantidade ?? 0),
    imagem: p.imagem || '',
    fator: Number(p.fator ?? 1)
  };
}

(function seed(){
  ensureJson('produtos.json', [
    {"id":1,"codigo":"ARZ001","nome":"Arroz 5kg","estoque":120,"endereco":"05-001-3-1","imagem":"","fator":1},
    {"id":2,"codigo":"FEJ002","nome":"Feijão Preto 1kg","estoque":80,"endereco":"05-002-3-1","imagem":"","fator":1},
    {"id":3,"codigo":"MAC003","nome":"Macarrão Espaguete","estoque":65,"endereco":"05-003-3-1","imagem":"","fator":1},
    {"id":4,"codigo":"OLE004","nome":"Óleo de Soja 900ml","estoque":40,"endereco":"05-004-2-1","imagem":"","fator":1},
    {"id":5,"codigo":"CAF005","nome":"Café 500g","estoque":30,"endereco":"05-005-1-1","imagem":"","fator":1}
  ]);
  ensureJson('pedidos.json', []);
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

app.get('/api/produtos', (req,res)=>{
  try {
    res.json(readJson('produtos.json', []).map(normalizeProduct));
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/produto/:codigo', (req,res)=>{
  const codigo = String(req.params.codigo || '').trim().toUpperCase();
  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const item = produtos.find(p => p.codigo === codigo);
  if (!item) return res.json({ erro:true, msg:'Produto não encontrado' });
  res.json(item);
});

app.post('/api/produtos', (req,res)=>{
  const { codigo, nome, endereco } = req.body || {};
  if (!codigo || !nome) return res.status(400).json({ ok:false, msg:'Código e nome são obrigatórios.' });

  const produtos = readJson('produtos.json', []).map(normalizeProduct);
  const cod = String(codigo).trim().toUpperCase();

  if (produtos.some(p => p.codigo === cod)) {
    return res.status(409).json({ ok:false, msg:'Código já existe.' });
  }

  const novo = normalizeProduct({
    id: Date.now(),
    codigo: cod,
    nome,
    endereco,
    estoque: 0
  });

  produtos.unshift(novo);
  writeJson('produtos.json', produtos);
  res.json({ ok:true, item: novo });
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
    status: 'aberto',
    criadoEm: new Date().toISOString()
  };

  pedidos.unshift(novo);
  writeJson('pedidos.json', pedidos);
  res.json({ ok:true, item: novo });
});

app.get('/api/separacao', (req,res)=>{
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

app.get('/api/wms', (req,res)=>{
  res.json(readJson('wms.json', []));
});

app.post('/api/baixa', (req, res) => {
  try {
    const { codigo, quantidade } = req.body || {};
    const produtos = readJson('produtos.json', []).map(normalizeProduct);

    const idx = produtos.findIndex(p => p.codigo === String(codigo || '').trim().toUpperCase());
    if (idx === -1) return res.json({ erro:true, msg:'Produto não encontrado' });

    const qtd = Number(quantidade || 1);
    if (produtos[idx].estoque < qtd) return res.json({ erro:true, msg:'Sem estoque' });

    produtos[idx].estoque -= qtd;
    writeJson('produtos.json', produtos);

    res.json({ ok:true, estoque: produtos[idx].estoque });
  } catch (e) {
    res.json({ erro:true, msg:'Erro interno' });
  }
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
