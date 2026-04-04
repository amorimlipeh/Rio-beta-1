window.SeparacaoUI = {
  async carregar(){
    const res = await fetch('/api/separacao', { cache:'no-store' });
    const lista = await res.json();

    document.getElementById('sepLista').innerHTML = (lista || []).map((p, idx) => `
      <div class="item">
        <div class="badge">${idx === 0 ? 'Próximo' : 'Fila'}</div><br>
        <strong>Pedido:</strong> ${p.pedido}<br>
        <strong>Produto:</strong> ${p.produtoCodigo}<br>
        <strong>Nome:</strong> ${p.nome}<br>
        <strong>Endereço:</strong> ${p.endereco}<br>
        <strong>Quantidade:</strong> ${p.quantidade}<br>
        <strong>Estoque:</strong> ${p.estoque}<br>
        <strong>Cliente:</strong> ${p.cliente}<br><br>
        <button onclick='SeparacaoUI.falar(${JSON.stringify(JSON.stringify({
          nome: '',
          endereco: '',
          quantidade: 1
        })).replace(/"/g, '&quot;')})' style="display:none;"></button>
        <button onclick='SeparacaoUI.falarItem(${JSON.stringify({
          nome: '',
          endereco: '',
          quantidade: 1
        })})' style="display:none;"></button>
      </div>
    `).join('') || '<div class="item">Sem pedidos abertos.</div>';

    // re-render com botões corretos
    document.getElementById('sepLista').innerHTML = (lista || []).map((p, idx) => `
      <div class="item">
        <div class="badge">${idx === 0 ? 'Próximo' : 'Fila'}</div><br>
        <strong>Pedido:</strong> ${p.pedido}<br>
        <strong>Produto:</strong> ${p.produtoCodigo}<br>
        <strong>Nome:</strong> ${p.nome}<br>
        <strong>Endereço:</strong> ${p.endereco}<br>
        <strong>Quantidade:</strong> ${p.quantidade}<br>
        <strong>Estoque:</strong> ${p.estoque}<br>
        <strong>Cliente:</strong> ${p.cliente}<br><br>
        <button onclick='SeparacaoUI.falarDirecao("${String(p.nome).replace(/"/g,"&quot;")}","${String(p.endereco).replace(/"/g,"&quot;")}",${Number(p.quantidade || 1)})'>Falar picking</button>
      </div>
    `).join('') || '<div class="item">Sem pedidos abertos.</div>';
  },

  falarDirecao(nome, endereco, quantidade){
    if (window.RIOVOZ && typeof window.RIOVOZ.falarSeparacao === 'function') {
      window.RIOVOZ.falarSeparacao({ nome, endereco, quantidade });
    }
  }
};
document.addEventListener('DOMContentLoaded', () => SeparacaoUI.carregar());
