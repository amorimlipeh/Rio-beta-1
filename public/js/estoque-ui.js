(async function(){
  const res = await fetch('/api/produtos?v=' + Date.now(), { cache:'no-store' });
  const lista = await res.json();

  document.getElementById('estLista').innerHTML = (lista || []).map(p => `
    <div class="item">
      <strong>${p.codigo}</strong> - ${p.nome}<br>
      Estoque atual: ${p.estoque}<br>
      Endereço: ${p.endereco}
    </div>
  `).join('') || '<div class="item">Sem estoque.</div>';
})();
