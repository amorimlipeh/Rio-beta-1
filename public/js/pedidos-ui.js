window.PedidosUI = {
  produtos: [],

  async carregarProdutos(){
    try {
      const res = await fetch('/api/produtos?v=' + Date.now(), { cache:'no-store' });
      const lista = await res.json();
      this.produtos = Array.isArray(lista) ? lista : [];
      console.log('produtos carregados', this.produtos);
    } catch (e) {
      console.log('erro ao carregar produtos', e);
      this.produtos = [];
    }
  },

  buscarProdutos(){
    const termo = String(document.getElementById('pedProdutoBusca')?.value || '').trim().toUpperCase();
    const box = document.getElementById('pedSugestoes');

    if (!box) return;

    if (!termo) {
      box.innerHTML = '';
      box.classList.add('hidden');
      return;
    }

    const encontrados = (this.produtos || []).filter(p => {
      const codigo = String(p.codigo || '').toUpperCase();
      const nome = String(p.nome || '').toUpperCase();
      return codigo.includes(termo) || nome.includes(termo);
    }).slice(0, 10);

    if (!encontrados.length) {
      box.innerHTML = `<div class="suggest-item">Nenhum produto encontrado</div>`;
      box.classList.remove('hidden');
      return;
    }

    box.innerHTML = encontrados.map(p => `
      <div class="suggest-item" onclick="PedidosUI.selecionarProduto('${String(p.codigo).replace(/'/g, "\\'")}', '${String(p.nome).replace(/'/g, "\\'")}')">
        <strong>${p.codigo}</strong> - ${p.nome}
      </div>
    `).join('');

    box.classList.remove('hidden');
  },

  selecionarProduto(codigo, nome){
    const campoBusca = document.getElementById('pedProdutoBusca');
    const campoSelecionado = document.getElementById('pedProdutoCodigo');
    const box = document.getElementById('pedSugestoes');

    if (campoBusca) campoBusca.value = `${codigo} - ${nome}`;
    if (campoSelecionado) {
      campoSelecionado.value = `${codigo} - ${nome}`;
      campoSelecionado.dataset.codigo = codigo;
    }

    if (box) {
      box.innerHTML = '';
      box.classList.add('hidden');
    }
  },

  async carregarPedidos(){
    try {
      const res = await fetch('/api/pedidos?v=' + Date.now(), { cache:'no-store' });
      const lista = await res.json();

      document.getElementById('pedLista').innerHTML = (Array.isArray(lista) ? lista : []).map(p => `
        <div class="item">
          <strong>${p.numero || p.id || 'Sem número'}</strong><br>
          Cliente: ${p.cliente || 'Sem cliente'}<br>
          Produto: ${p.produtoCodigo || 'Sem produto'}<br>
          Quantidade: ${p.quantidade || 0}<br>
          Status: ${p.status || 'aberto'}
        </div>
      `).join('') || '<div class="item">Sem pedidos.</div>';
    } catch (e) {
      document.getElementById('pedLista').innerHTML = '<div class="item">Erro ao carregar pedidos.</div>';
    }
  },

  async salvar(){
    const numero = document.getElementById('pedNumero')?.value || '';
    const cliente = document.getElementById('pedCliente')?.value || '';
    const quantidade = document.getElementById('pedQtd')?.value || '';
    const campoSelecionado = document.getElementById('pedProdutoCodigo');
    const produtoCodigo = campoSelecionado?.dataset?.codigo || '';

    if (!cliente || !produtoCodigo || !quantidade) {
      document.getElementById('pedMsg').textContent = 'Cliente, produto e quantidade são obrigatórios.';
      return;
    }

    try {
      const res = await fetch('/api/pedidos', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          numero,
          cliente,
          produtoCodigo,
          quantidade
        })
      });

      const data = await res.json();

      if (!data.ok) {
        document.getElementById('pedMsg').textContent = data.msg || 'Falha ao salvar pedido.';
        return;
      }

      document.getElementById('pedMsg').textContent = 'Pedido salvo com sucesso.';

      ['pedNumero','pedCliente','pedProdutoBusca','pedProdutoCodigo','pedQtd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      if (campoSelecionado && campoSelecionado.dataset) {
        delete campoSelecionado.dataset.codigo;
      }

      const box = document.getElementById('pedSugestoes');
      if (box) {
        box.innerHTML = '';
        box.classList.add('hidden');
      }

      await this.carregarPedidos();
    } catch (e) {
      console.log('erro ao salvar pedido', e);
      document.getElementById('pedMsg').textContent = 'Erro ao salvar pedido.';
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await PedidosUI.carregarProdutos();
  await PedidosUI.carregarPedidos();
});
