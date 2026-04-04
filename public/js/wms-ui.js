(async function(){
  const res = await fetch('/api/wms?v=' + Date.now(), { cache:'no-store' });
  const lista = await res.json();

  const legenda = document.getElementById('wmsLegenda');
  const grid = document.getElementById('wmsGrid');

  legenda.innerHTML = `
    <div class="item" style="border-left:6px solid #1ec96b;">Livre</div>
    <div class="item" style="border-left:6px solid #d59a1a;">Ocupado</div>
    <div class="item" style="border-left:6px solid #d94a63;">Bloqueado</div>
  `;

  function getCor(status){
    const s = String(status || '').toLowerCase();
    if (s === 'livre') return '#1f7a47';
    if (s === 'bloqueado') return '#9b2942';
    return '#9a6919';
  }

  grid.innerHTML = (lista || []).map(x => `
    <div class="wms-cell" style="background:${getCor(x.status)};">
      <strong>${x.endereco}</strong><br>
      Status: ${x.status}<br>
      Produto: ${x.produto || '-'}
    </div>
  `).join('') || '<div class="item">Sem mapa WMS.</div>';
})();
