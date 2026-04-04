window.Separacao = {
  pedidos: [],
  produtos: [],

  async carregar(){
    const [peds, prods] = await Promise.all([
      fetch('/api/pedidos', { cache: 'no-store' }).then(r=>r.json()),
      fetch('/api/produtos', { cache: 'no-store' }).then(r=>r.json())
    ]);

    this.pedidos = Array.isArray(peds) ? peds : [];
    this.produtos = Array.isArray(prods) ? prods : [];

    this.render();
  },

  normalizarPedido(p){
    return {
      numero: p.numero || p.id || 'Sem número',
      produtoCodigo: p.produtoCodigo || p.codigo || p.produto || 'Sem código',
      quantidade: p.quantidade ?? p.qtd ?? p.qtde ?? 0,
      cliente: p.cliente || 'Sem cliente',
      status: p.status || 'aberto'
    };
  },

  render(){
    const el = document.getElementById('sepLista');
    if (!el) return;

    const lista = this.pedidos.map(raw => {
      const p = this.normalizarPedido(raw);

      const prod = this.produtos.find(x =>
        String(x.codigo || '').toUpperCase() === String(p.produtoCodigo || '').toUpperCase()
      ) || {};

      return `
        <div class="item">
          <strong>Pedido:</strong> ${p.numero}<br>
          <strong>Produto:</strong> ${p.produtoCodigo}<br>
          <strong>Nome:</strong> ${prod.nome || 'Sem nome'}<br>
          <strong>Endereço:</strong> ${prod.endereco || 'Não definido'}<br>
          <strong>Quantidade:</strong> ${p.quantidade}
        </div>
      `;
    });

    el.innerHTML = lista.join('') || '<div class="item">Sem pedidos</div>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Separacao.carregar();
});
