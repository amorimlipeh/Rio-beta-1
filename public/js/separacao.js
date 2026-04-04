window.Separacao = {
  pedidos: [],
  produtos: [],

  async carregar(){
    const [peds, prods] = await Promise.all([
      fetch('/api/pedidos').then(r=>r.json()),
      fetch('/api/produtos').then(r=>r.json())
    ]);

    this.pedidos = peds;
    this.produtos = prods;

    this.render();
  },

  render(){
    const el = document.getElementById('sepLista');

    const lista = this.pedidos.map(p => {
      const prod = this.produtos.find(x => x.codigo === p.produtoCodigo) || {};

      return `
        <div class="item">
          Pedido: ${p.numero}<br>
          Produto: ${p.produtoCodigo}<br>
          Nome: ${prod.nome || 'Sem nome'}<br>
          Endereço: ${prod.endereco || 'Não definido'}<br>
          Quantidade: ${p.quantidade}
        </div>
      `;
    });

    el.innerHTML = lista.join('') || 'Sem pedidos';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Separacao.carregar();
});
