window.SeparacaoUI = {
  fila: [],

  async carregar(){
    const res = await fetch('/api/separacao', { cache:'no-store' });
    this.fila = await res.json();

    const proximo = this.fila[0];
    document.getElementById('sepProximo').innerHTML = proximo ? `
      <div class="item sucesso">
        <div class="badge">Próximo</div><br>
        <strong>Pedido:</strong> ${proximo.pedido}<br>
        <strong>Produto:</strong> ${proximo.produtoCodigo}<br>
        <strong>Nome:</strong> ${proximo.nome}<br>
        <strong>Endereço:</strong> ${proximo.endereco}<br>
        <strong>Quantidade:</strong> ${proximo.quantidade}<br>
        <strong>Estoque:</strong> ${proximo.estoque}<br>
        <strong>Cliente:</strong> ${proximo.cliente}<br><br>
        <button onclick='SeparacaoUI.falarProximo()'>Falar picking</button>
      </div>
    ` : '<div class="item">Sem pedidos abertos.</div>';

    document.getElementById('sepLista').innerHTML = (this.fila || []).map((p, idx) => `
      <div class="item">
        <div class="badge">${idx === 0 ? 'Próximo' : 'Fila'}</div><br>
        <strong>Pedido:</strong> ${p.pedido}<br>
        <strong>Produto:</strong> ${p.produtoCodigo}<br>
        <strong>Nome:</strong> ${p.nome}<br>
        <strong>Endereço:</strong> ${p.endereco}<br>
        <strong>Quantidade:</strong> ${p.quantidade}<br>
        <strong>Estoque:</strong> ${p.estoque}<br>
        <strong>Cliente:</strong> ${p.cliente}
      </div>
    `).join('') || '<div class="item">Sem pedidos abertos.</div>';
  },

  falarProximo(){
    const p = this.fila[0];
    if (!p) return;
    if (window.RIOVOZ && typeof window.RIOVOZ.falarSeparacao === 'function') {
      window.RIOVOZ.falarSeparacao({
        nome: p.nome,
        endereco: p.endereco,
        quantidade: p.quantidade
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => SeparacaoUI.carregar());
