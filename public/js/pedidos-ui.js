window.PedidosUI = {
  produtos: [],

  async carregarProdutos(){
    const res = await fetch('/api/produtos', { cache:'no-store' });
    this.produtos = await res.json();
  },

  buscarProdutos(){
    const termo = String(document.getElementById('pedProdutoBusca').value || '').trim().toUpperCase();
    const box = document.getElementById('pedSugestoes');

    if (!termo) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }

    const lista = (this.produtos || []).filter(p => {
      const txt = `${p.codigo} ${p.nome}`.toUpperCase();
      return txt.includes(termo);
    }).slice(0, 8);

    if (!lista.length) {
      box.innerHTML = `<div class="suggest-item">Nenhum produto encontrado</div>`;
      box.classList.remove('hidden');
      return;
    }

    box.innerHTML = lista.map(p => `
      <div class="suggest-item" onclick="PedidosUI.selecionarProduto('${p.codigo.replace(/'/g, "\\'")}', '${String(p.nome).replace(/'/g, "\\'")}')">
        <strong>${p.codigo}</strong> - ${p.nome}
      </div>
    `).join('');

    box.classList.remove('hidden');
  },

  selecionarProduto(codigo, nome){
    document.getElementById('pedProdutoCodigo').value = `${codigo} - ${nome}`;
    document.getElementById('pedProdutoBusca').value = nome;
    document.getElementById('pedSugestoes').classList.add('hidden');
    document.getElementById('pedSugestoes').innerHTML = '';
    document.getElementById('pedProdutoCodigo').dataset.codigo = codigo;
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
    const codigoSelecionado = document.getElementById('pedProdutoCodigo').dataset.codigo || '';

    const payload = {
      numero: document.getElementById('pedNumero').value,
      cliente: document.getElementById('pedCliente').value,
      produtoCodigo: codigoSelecionado,
      quantidade: document.getElementById('pedQtd').value
    };

    const res = await fetch('/api/pedidos', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    document.getElementById('pedMsg').textContent = data.ok
      ? 'Pedido salvo com sucesso.'
      : (data.msg || 'Cliente, produto e quantidade são obrigatórios.');

    if (data.ok) {
      ['pedNumero','pedCliente','pedProdutoBusca','pedProdutoCodigo','pedQtd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      delete document.getElementById('pedProdutoCodigo').dataset.codigo;
      document.getElementById('pedSugestoes').classList.add('hidden');
      document.getElementById('pedSugestoes').innerHTML = '';
      this.carregarPedidos();
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await PedidosUI.carregarProdutos();
  await PedidosUI.carregarPedidos();
});
