(async function(){
  const res = await fetch('/api/dashboard', { cache:'no-store' });
  const data = await res.json();

  document.getElementById('dashMetricas').innerHTML = `
    <div class="metric">Produtos<strong>${data.totalProdutos || 0}</strong></div>
    <div class="metric">Estoque<strong>${data.totalEstoque || 0}</strong></div>
    <div class="metric">Pedidos abertos<strong>${data.pedidosAbertos || 0}</strong></div>
    <div class="metric">Movimentos<strong>${(data.ultimosMovimentos || []).length}</strong></div>
  `;

  document.getElementById('dashMovimentos').innerHTML =
    (data.ultimosMovimentos || []).map(m => `
      <div class="item">
        <strong>${m.codigo}</strong> - ${m.nome}<br>
        Tipo: ${m.tipo}<br>
        Quantidade: ${m.quantidade}<br>
        Estoque final: ${m.estoqueFinal}
      </div>
    `).join('') || '<div class="item">Sem movimentos.</div>';
})();
