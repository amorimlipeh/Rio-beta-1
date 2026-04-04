window.PedidosUI = {
  async carregarProdutos(){
    const res = await fetch('/api/produtos', { cache:'no-store' });
    const lista = await res.json();
    document.getElementById('pedProduto').innerHTML = (lista || []).map(p => `
      <option value="${p.codigo}">${p.codigo} - ${p.nome}</option>
    `).join('');
  },

  async carregarPedidos(){
    const res = await fetch('/api/pedidos', { cache:'no-store' });
    const lista = await res.json();
    document.getElementById('pedLista').innerHTML = (lista || []).map(p => `
      <div class="item">
        <strong>${p.numero}</strong><br>
        Cliente: ${p.cliente}<br>
        Produto: ${p.produtoCodigo}<br>
        Quantidade: ${p.quantidade}<br>
        Status: ${p.status}
      </div>
    `).join('') || '<div class="item">Sem pedidos.</div>';
  },

  async salvar(){
    const payload = {
      numero: document.getElementById('pedNumero').value,
      cliente: document.getElementById('pedCliente').value,
      produtoCodigo: document.getElementById('pedProduto').value,
      quantidade: document.getElementById('pedQtd').value
    };

    const res = await fetch('/api/pedidos', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('pedMsg').textContent = data.ok ? 'Pedido salvo com sucesso.' : (data.msg || 'Falha ao salvar pedido.');
    if (data.ok) {
      ['pedNumero','pedCliente','pedQtd'].forEach(id => document.getElementById(id).value = '');
      this.carregarPedidos();
    }
  }
};
document.addEventListener('DOMContentLoaded', async () => {
  await PedidosUI.carregarProdutos();
  await PedidosUI.carregarPedidos();
});
