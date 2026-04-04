window.ProdutosUI = {
  async carregar(){
    const filtro = String(document.getElementById('prodBusca')?.value || '').trim().toUpperCase();
    const res = await fetch('/api/produtos', { cache:'no-store' });
    const lista = await res.json();

    const itens = (lista || []).filter(p => {
      const txt = `${p.codigo} ${p.nome}`.toUpperCase();
      return !filtro || txt.includes(filtro);
    });

    document.getElementById('prodCatalogo').innerHTML = itens.map(p => `
      <div class="item">
        <div class="image-box">${p.imagem ? `<img src="${p.imagem}" alt="${p.nome}">` : '<span class="text-muted">Sem imagem</span>'}</div>
        <strong>${p.codigo}</strong> - ${p.nome}<br>
        Estoque: ${p.estoque}<br>
        Endereço: ${p.endereco}<br>
        Fator: ${p.fator || 1}
      </div>
    `).join('') || '<div class="item">Nenhum produto encontrado.</div>';
  }
};
document.addEventListener('DOMContentLoaded', () => ProdutosUI.carregar());
