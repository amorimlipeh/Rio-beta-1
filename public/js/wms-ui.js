(async function(){
  const res = await fetch('/api/wms?v=' + Date.now(), { cache:'no-store' });
  const lista = await res.json();

  document.getElementById('wmsGrid').innerHTML = (lista || []).map(x => `
    <div class="wms-cell">
      <strong>${x.endereco}</strong><br>
      Status: ${x.status}<br>
      Produto: ${x.produto || '-'}
    </div>
  `).join('') || '<div class="item">Sem mapa WMS.</div>';
})();
