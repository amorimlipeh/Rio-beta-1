
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

(function seed(){
  ensureJson('produtos.json', [
    {"codigo":"ARZ001","nome":"Arroz 5kg","estoque":120,"endereco":"05-001-3-1"},
    {"codigo":"FEJ002","nome":"Feijão Preto 1kg","estoque":80,"endereco":"05-002-3-1"},
    {"codigo":"MAC003","nome":"Macarrão Espaguete","estoque":65,"endereco":"05-003-3-1"}
  ]);
  ensureJson('pedidos.json', [
    {"id":"PED001","numero":"PED-001","cliente":"Mercado Central","status":"aberto"}
  ]);
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
  const produtos = readJson('produtos.json', []);
  const pedidos = readJson('pedidos.json', []);
  res.json({
    totalProdutos: produtos.length,
    totalEstoque: produtos.reduce((a,p)=> a + Number(p.estoque || p.quantidade || 0), 0),
    pedidosAbertos: pedidos.filter(p => String(p.status || '').toLowerCase() === 'aberto').length
  });
});

app.get('/api/produtos', (req,res)=> res.json(readJson('produtos.json', [])));
app.get('/api/pedidos', (req,res)=> res.json(readJson('pedidos.json', [])));
app.get('/api/wms', (req,res)=> res.json(readJson('wms.json', [])));

app.use(express.static(PUBLIC_DIR, { etag:false, maxAge:0 }));

app.get('*', (req,res)=>{
  const indexFile = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  return res.status(200).send('RIOBETA1 ONLINE');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', ()=> {
  console.log('Servidor rodando na porta ' + PORT);
});
