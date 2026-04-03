
async function carregar(){
 const r = await fetch('/api/dashboard');
 const d = await r.json();
 document.getElementById('dash').innerHTML =
 `📦 Produtos: ${d.totalProdutos}<br>
  📊 Estoque: ${d.totalEstoque}<br>
  📋 Pedidos: ${d.pedidosAbertos}`;
}
carregar();
