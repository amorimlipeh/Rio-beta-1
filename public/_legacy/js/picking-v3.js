
window.RIOPicking = {
  pedidos: [],
  produtos: [],
  fila: [],
  passoAtual: 0,
  modo: 'simples',

  get statusKey(){ return 'riobeta1_picking_status'; },
  get histKey(){ return 'riobeta1_picking_hist'; },

  lerStatus(){
    try { return JSON.parse(localStorage.getItem(this.statusKey) || '{}'); }
    catch { return {}; }
  },
  salvarStatus(obj){
    localStorage.setItem(this.statusKey, JSON.stringify(obj));
  },
  lerHistorico(){
    try { return JSON.parse(localStorage.getItem(this.histKey) || '[]'); }
    catch { return []; }
  },
  salvarHistorico(arr){
    localStorage.setItem(this.histKey, JSON.stringify(arr.slice(0,50)));
  },

  abrirModo(modo){
    this.modo = modo;
    document.getElementById('pickingSimples').classList.toggle('hidden', modo !== 'simples');
    document.getElementById('pickingProfissional').classList.toggle('hidden', modo !== 'profissional');
  },

  async carregar(){
    const [pedR, prodR] = await Promise.all([
      fetch('/api/pedidos', { cache:'no-store' }),
      fetch('/api/produtos', { cache:'no-store' })
    ]);

    this.pedidos = await pedR.json();
    this.produtos = await prodR.json();
    this.fila = this.pedidos
      .filter(p => (p.status || '').toLowerCase() === 'aberto')
      .map(p => {
        const prod = this.produtos.find(x => String(x.codigo).toUpperCase() === String(p.produtoCodigo || '').toUpperCase()) || {};
        return {
          id: p.id || p.numero,
          numero: p.numero || p.id,
          cliente: p.cliente || '-',
          produtoCodigo: p.produtoCodigo || '-',
          produtoNome: prod.nome || 'Produto sem nome',
          endereco: prod.endereco || 'Não definido',
          quantidade: Number(p.quantidade || 0)
        };
      });

    this.passoAtual = 0;
    this.renderSimples();
    this.renderProfissional();
    this.renderHistorico();
    this.setMsg('Pedidos carregados.');
  },

  setMsg(msg){
    const el = document.getElementById('pickingMsg');
    if (el) el.textContent = msg || '';
  },

  renderSimples(){
    const el = document.getElementById('pickingListaSimples');
    const status = this.lerStatus();
    if (!this.fila.length){
      el.innerHTML = '<div class="item">Sem pedidos abertos para separação.</div>';
      return;
    }

    el.innerHTML = this.fila.map(item => {
      const s = status[item.id] || 'aberto';
      return `
        <div class="item">
          <strong>${item.numero}</strong> - ${item.cliente}<br>
          Produto: ${item.produtoCodigo} - ${item.produtoNome}<br>
          Endereço: ${item.endereco}<br>
          Quantidade: ${item.quantidade}<br>
          Status local: <strong>${s}</strong><br>
          <button onclick="RIOPicking.separarAgora('${item.id}')">Separar agora</button>
        </div>
      `;
    }).join('');
  },

  renderProfissional(){
    const filaEl = document.getElementById('pickingFila');
    const passoEl = document.getElementById('pickingPasso');
    const status = this.lerStatus();

    filaEl.innerHTML = this.fila.map((item, idx) => `
      <div class="item">
        <strong>${idx === this.passoAtual ? '▶ ' : ''}${item.numero}</strong><br>
        ${item.produtoCodigo} - ${item.produtoNome}<br>
        ${item.endereco} • Qtd ${item.quantidade}<br>
        Status local: ${status[item.id] || 'aberto'}
      </div>
    `).join('') || '<div class="item">Sem fila.</div>';

    const atual = this.fila[this.passoAtual];
    if (!atual){
      passoEl.innerHTML = '<div class="item">Sem passo atual.</div>';
      return;
    }

    passoEl.innerHTML = `
      <div class="item">
        <strong>Pedido:</strong> ${atual.numero}<br>
        <strong>Cliente:</strong> ${atual.cliente}<br>
        <strong>Produto:</strong> ${atual.produtoCodigo} - ${atual.produtoNome}<br>
        <strong>Endereço WMS:</strong> ${atual.endereco}<br>
        <strong>Quantidade:</strong> ${atual.quantidade}
      </div>
    `;
  },

  async separarAgora(id){
    const item = this.fila.find(x => String(x.id) === String(id));
    if (!item) return;
    await this.baixarEstoque(item);
    const status = this.lerStatus();
    status[item.id] = 'concluido';
    this.salvarStatus(status);
    this.pushHistorico(item, 'simples');
    this.renderSimples();
    this.renderProfissional();
    this.renderHistorico();
    this.setMsg('Separação simples concluída localmente.');
  },

  async confirmarRetirada(){
    const atual = this.fila[this.passoAtual];
    if (!atual) return;
    await this.baixarEstoque(atual);
    const status = this.lerStatus();
    status[atual.id] = 'separando';
    this.salvarStatus(status);
    this.pushHistorico(atual, 'profissional');
    this.renderSimples();
    this.renderProfissional();
    this.renderHistorico();
    this.setMsg('Retirada confirmada.');
  },

  proximoPasso(){
    const atual = this.fila[this.passoAtual];
    if (atual){
      const status = this.lerStatus();
      status[atual.id] = 'concluido';
      this.salvarStatus(status);
    }
    if (this.passoAtual < this.fila.length - 1) this.passoAtual += 1;
    this.renderSimples();
    this.renderProfissional();
    this.setMsg('Avançou para o próximo passo.');
  },

  async baixarEstoque(item){
    try{
      await fetch('/api/estoque/movimento', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          codigo: item.produtoCodigo,
          quantidade: item.quantidade,
          tipo: 'saida'
        })
      });
    }catch(e){}
  },

  pushHistorico(item, modo){
    const hist = this.lerHistorico();
    hist.unshift({
      data: new Date().toLocaleString(),
      pedido: item.numero,
      produto: item.produtoCodigo,
      quantidade: item.quantidade,
      endereco: item.endereco,
      modo
    });
    this.salvarHistorico(hist);
  },

  renderHistorico(){
    const el = document.getElementById('pickingHistorico');
    const hist = this.lerHistorico();
    el.innerHTML = hist.map(h => `
      <div class="item">
        <strong>${h.pedido}</strong><br>
        Produto: ${h.produto}<br>
        Endereço: ${h.endereco}<br>
        Quantidade: ${h.quantidade}<br>
        Modo: ${h.modo}<br>
        <small>${h.data}</small>
      </div>
    `).join('') || '<div class="item">Sem histórico.</div>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RIOPicking.abrirModo('simples');
  RIOPicking.carregar();
});
