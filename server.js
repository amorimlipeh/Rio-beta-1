
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const fs = require('fs');

function readJSON(path){
  try { return JSON.parse(fs.readFileSync(path)); } catch(e){ return []; }
}

app.get('/api/dashboard', (req,res)=>{
  const produtos = readJSON('./data/produtos.json');
  const pedidos = readJSON('./data/pedidos.json');

  const totalProdutos = produtos.length;
  const totalEstoque = produtos.reduce((a,p)=>a+(p.quantidade||0),0);
  const pedidosAbertos = pedidos.filter(p=>p.status==='aberto').length;

  res.json({totalProdutos,totalEstoque,pedidosAbertos});
});

app.listen(3000, ()=> console.log('Servidor rodando na porta 3000'));
