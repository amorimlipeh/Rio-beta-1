window.PedidosUI = {
  produtosCache: [],

  async carregarProdutos() {
    try {
      const res = await fetch('/api/produtos?v=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      this.produtosCache = Array.isArray(data) ? data : [];
    } catch (e) {
      this.produtosCache = [];
    }
  },

  async buscarProdutos() {
    const termo = String(document.getElementById('pedProdutoBusca')?.value || '').trim();
    const box = document.getElementById('pedSugestoes');

    if (!box) return;

    if (!termo) {
      box.innerHTML = '';
      box.classList.add('hidden');
      return;
    }

    let encontrados = [];

    // tenta rota dedicada primeiro
    try {
      const res = await fetch('/api/produtos/busca?q=' + encodeURIComponent(termo) + '&v=' + Date.now(), {
        cache: 'no-store'
      });
      const data = await res.json();
      if (Array.isArray(data)) encontrados = data;
    } catch (e) {}

    // fallback: filtra do catálogo completo
    if (!encontrados.length) {
      if (!this.produtosCache.length) {
        await this.carregarProdutos();
      }

      const t = termo.toUpperCase();
      encontrados = this.produtosCache.filter(p => {
        const codigo = String(p.codigo || '').toUpperCase();
        const nome = String(p.nome || '').toUpperCase();
        return codigo.includes(t) || nome.includes(t);
      }).slice(0, 10);
    }

    if (!encontrados.length) {
      box.innerHTML = `<div class="suggest-item">Nenhum produto encontrado</div>`;
      box.classList.remove('hidden');
      return;
    }

    box.innerHTML = encontrados.map(p => `
      <div class="suggest-item" data-codigo="${String(p.codigo).replace(/"/g, '&quot;')}" data-nome="${String(p.nome).replace(/"/g, '&quot;')}">
        <strong>${p.codigo}</strong> - ${p.nome}
      </div>
    `).join('');

    box.classList.remove('hidden');

    box.querySelectorAll('.suggest-item').forEach(item => {
      item.onclick = () => {
        const codigo = item.getAttribute('data-codigo') || '';
        const nome = item.getAttribute('data-nome') || '';
        this.selecionarProduto(codigo, nome);
      };
    });
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

  async resolverProduto(texto) {
    const termo = String(texto || '').trim();
    if (!termo) return null;

    if (!this.produtosCache.length) {
      await this.carregarProdutos();
    }

    const t = termo.toUpperCase();

    let item = this.produtosCache.find(p => String(p.codigo || '').toUpperCase() === t);
    if (item) return item;

    item = this.produtosCache.find(p => {
      const codigo = String(p.codigo || '').toUpperCase();
      const nome = String(p.nome || '').toUpperCase();
      return codigo.includes(t) || nome.includes(t);
    });

    return item || null;
  },

  async carregarPedidos() {
    try {
      const res = await fetch('/api/pedidos?v=' + Date.now(), { cache: 'no-store' });
      const lista = await res.json();

      document.getElementById('pedLista').innerHTML = (Array.isArray(lista) ? lista : []).map(p => `
        <div class="item">
          <strong>${p.numero || p.id || 'Sem número'}</strong><br>
          Cliente: ${p.cliente || 'Sem cliente'}<br>
          Produto: ${p.produtoCodigo || p.produto || 'Sem produto'}<br>
          Quantidade: ${p.quantidade || 0}<br>
          Status: ${p.status || 'aberto'}
        </div>
      `).join('') || '<div class="item">Sem pedidos.</div>';
    } catch (e) {
      document.getElementById('pedLista').innerHTML = '<div class="item err">Erro ao carregar pedidos.</div>';
    }
  },

  async salvar() {
    const numero = document.getElementById('pedNumero')?.value || '';
    const cliente = document.getElementById('pedCliente')?.value || '';
    const quantidade = document.getElementById('pedQtd')?.value || '';
    const busca = document.getElementById('pedProdutoBusca')?.value || '';
    const selecionado = document.getElementById('pedProdutoCodigo');
    const msg = document.getElementById('pedMsg');

    let produtoCodigo = selecionado?.dataset?.codigo || '';

    if (!produtoCodigo) {
      const produto = await this.resolverProduto(busca);
      if (produto) {
        produtoCodigo = produto.codigo;
        if (selecionado) {
          selecionado.value = `${produto.codigo} - ${produto.nome}`;
          selecionado.dataset.codigo = produto.codigo;
        }
      }
    }

    if (!cliente || !produtoCodigo || !quantidade) {
      if (msg) msg.textContent = 'Cliente, produto e quantidade são obrigatórios.';
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
        if (msg) msg.textContent = data.msg || 'Falha ao salvar pedido.';
        return;
      }

      if (msg) msg.textContent = 'Pedido salvo com sucesso.';

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
      if (msg) msg.textContent = 'Erro ao salvar pedido.';
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await PedidosUI.carregarProdutos();
  await PedidosUI.carregarPedidos();

  const inputBusca = document.getElementById('pedProdutoBusca');
  const btnSalvar = document.getElementById('pedSalvarBtn');

  if (inputBusca) {
    inputBusca.addEventListener('input', () => PedidosUI.buscarProdutos());
  }

  if (btnSalvar) {
    btnSalvar.onclick = () => PedidosUI.salvar();
  }
});
