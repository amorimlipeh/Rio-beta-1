window.PedidosUI = {
  async buscarProdutos() {
    const termo = String(document.getElementById('pedProdutoBusca')?.value || '').trim();
    const box = document.getElementById('pedSugestoes');
    if (!box) return;

    if (!termo) {
      box.innerHTML = '';
      box.classList.add('hidden');
      return;
    }

    try {
      const res = await fetch('/api/produtos/busca?q=' + encodeURIComponent(termo) + '&v=' + Date.now(), {
        cache: 'no-store'
      });
      const encontrados = await res.json();

      if (!Array.isArray(encontrados) || !encontrados.length) {
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
    } catch (e) {
      box.innerHTML = `<div class="suggest-item">Erro ao buscar produtos</div>`;
      box.classList.remove('hidden');
    }
  },

  selecionarProduto(codigo, nome) {
    const busca = document.getElementById('pedProdutoBusca');
    const selecionado = document.getElementById('pedProdutoCodigo');
    const box = document.getElementById('pedSugestoes');

    if (busca) busca.value = `${codigo} - ${nome}`;
    if (selecionado) {
      selecionado.value = `${codigo} - ${nome}`;
      selecionado.dataset.codigo = codigo;
    }
    if (box) {
      box.innerHTML = '';
      box.classList.add('hidden');
    }
  },

  async resolverProdutoNoBackend(texto) {
    const termo = String(texto || '').trim();
    if (!termo) return null;
    try {
      const res = await fetch('/api/produtos/busca?q=' + encodeURIComponent(termo) + '&v=' + Date.now(), {
        cache: 'no-store'
      });
      const encontrados = await res.json();
      return Array.isArray(encontrados) && encontrados.length ? encontrados[0] : null;
    } catch (e) {
      return null;
    }
  },

  async carregarPedidos() {
    try {
      const res = await fetch('/api/pedidos?v=' + Date.now(), { cache: 'no-store' });
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

  async salvar() {
    const numero = document.getElementById('pedNumero')?.value || '';
    const cliente = document.getElementById('pedCliente')?.value || '';
    const quantidade = document.getElementById('pedQtd')?.value || '';
    const busca = document.getElementById('pedProdutoBusca')?.value || '';
    const selecionado = document.getElementById('pedProdutoCodigo');

    let produtoCodigo = selecionado?.dataset?.codigo || '';

    if (!produtoCodigo) {
      const produto = await this.resolverProdutoNoBackend(busca);
      if (produto) {
        produtoCodigo = produto.codigo;
        if (selecionado) {
          selecionado.value = `${produto.codigo} - ${produto.nome}`;
          selecionado.dataset.codigo = produto.codigo;
        }
      }
    }

    if (!cliente || !produtoCodigo || !quantidade) {
      document.getElementById('pedMsg').textContent = 'Cliente, produto e quantidade são obrigatórios.';
      return;
    }

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, cliente, produtoCodigo, quantidade })
      });

      const data = await res.json();

      if (!data.ok) {
        document.getElementById('pedMsg').textContent = data.msg || 'Falha ao salvar pedido.';
        return;
      }

      document.getElementById('pedMsg').textContent = 'Pedido salvo com sucesso.';

      ['pedNumero', 'pedCliente', 'pedProdutoBusca', 'pedProdutoCodigo', 'pedQtd'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      if (selecionado?.dataset) delete selecionado.dataset.codigo;

      const box = document.getElementById('pedSugestoes');
      if (box) {
        box.innerHTML = '';
        box.classList.add('hidden');
      }

      await this.carregarPedidos();
    } catch (e) {
      document.getElementById('pedMsg').textContent = 'Erro ao salvar pedido.';
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await PedidosUI.carregarPedidos();
});
