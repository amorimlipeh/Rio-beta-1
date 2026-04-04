(async function(){
  const [prodRes, pedRes] = await Promise.all([
    fetch('/api/produtos?v=' + Date.now(), { cache:'no-store' }),
    fetch('/api/pedidos?v=' + Date.now(), { cache:'no-store' })
  ]);

  const produtos = await prodRes.json();
  const pedidos = await pedRes.json();

  const totalEstoque = (produtos || []).reduce((a,p) => a + Number(p.estoque || 0), 0);
  const abertos = (pedidos || []).filter(p => String(p.status || '').toLowerCase() === 'aberto').length;

  document.getElementById('dashHero').innerHTML = `
    <div class="metric">Produtos<strong>${(produtos || []).length}</strong></div>
    <div class="metric">Estoque<strong>${totalEstoque}</strong></div>
    <div class="metric">Pedidos abertos<strong>${abertos}</strong></div>
    <div class="metric">Sistema<strong>OK</strong></div>
  `;

  document.getElementById('dashInfo').innerHTML = `
    <div class="item">Base consolidada com módulos visíveis.</div>
    <div class="item">Produtos conectados ao estoque pelo mesmo registro.</div>
    <div class="item">Pedidos já podem cair na fila de separação.</div>
  `;
})();
