window.PedidosUI = {
  produtos: [],

  async carregarProdutos() {
    try {
      const res = await fetch('/api/produtos?v=' + Date.now(), { cache: 'no-store' });
      const lista = await res.json();
      this.produtos = Array.isArray(lista) ? lista : [];
    } catch (e) {
      this.produtos = [];
    }
  },

  resolverProduto(texto) {
    const termo = String(texto || '').trim().toUpperCase();
    if (!termo) return null;

    return this.produtos.find(p =>
      String(p.codigo || '').toUpperCase().includes(termo) ||
      String(p.nome || '').toUpperCase().includes(termo)
    ) || null;
  },

  async carregarPedidos() {
    try {
      const res = await fetch('/api/pedidos?v=' + Date.now(), { cache: 'no-store' });
      const lista = await res.json();

      document.getElementById('pedLista').innerHTML = (Array.isArray(lista) ? lista : []).map(p => `
        <div class="item">
          <strong>${p.numero || p.id}</strong><br>
          Cliente: ${p.cliente}<br>
          Produto: ${p.produtoCodigo}<br>
          Quantidade: ${p.quantidade}
        </div>
      `).join('') || 'Sem pedidos';
    } catch {
      document.getElementById('pedLista').innerHTML = 'Erro ao carregar';
    }
  },

  async salvar() {
    const numero = document.getElementById('pedNumero').value;
    const cliente = document.getElementById('pedCliente').value;
    const quantidade = document.getElementById('pedQtd').value;
    const busca = document.getElementById('pedProdutoBusca').value;

    const produto = this.resolverProduto(busca);

    if (!cliente || !quantidade || !produto) {
      document.getElementById('pedMsg').textContent = 'Preencha tudo corretamente.';
      return;
    }

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero,
          cliente,
          produtoCodigo: produto.codigo,
          quantidade
        })
      });

      const data = await res.json();

      if (!data.ok) {
        document.getElementById('pedMsg').textContent = data.msg;
        return;
      }

      document.getElementById('pedMsg').textContent = 'Pedido salvo!';

      // limpa campos
      document.getElementById('pedNumero').value = '';
      document.getElementById('pedCliente').value = '';
      document.getElementById('pedProdutoBusca').value = '';
      document.getElementById('pedQtd').value = '';
      document.getElementById('pedProdutoCodigo').value = '';

      await this.carregarPedidos();

    } catch (e) {
      document.getElementById('pedMsg').textContent = 'Erro ao salvar';
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await PedidosUI.carregarProdutos();
  await PedidosUI.carregarPedidos();
});
