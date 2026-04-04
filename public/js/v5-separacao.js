
window.RIOSEP = {
  pedidos: [],
  produtos: [],
  fila: [],
  atual: 0,
  histKey: 'riobeta1_v5_sep_hist',
  statKey: 'riobeta1_v5_sep_status',

  getHist(){
    try { return JSON.parse(localStorage.getItem(this.histKey) || '[]'); }
    catch { return []; }
  },
  setHist(v){
    localStorage.setItem(this.histKey, JSON.stringify(v.slice(0, 50)));
  },
  getStatus(){
    try { return JSON.parse(localStorage.getItem(this.statKey) || '{}'); }
    catch { return {}; }
  },
  setStatus(v){
    localStorage.setItem(this.statKey, JSON.stringify(v));
  },
  setMsg(msg){
    const el = document.getElementById('sepMsg');
    if (el) el.textContent = msg || '';
  },

  async carregar(){
    const [pedR, prodR] = await Promise.all([
      fetch('/api/pedidos', { cache: 'no-store' }),
      fetch('/api/produtos', { cache: 'no-store' })
    ]);
    this.pedidos = await pedR.json();
    this.produtos = await prodR.json();

    this.fila = this.pedidos
      .filter(p => ['aberto','separando'].includes(String(p.status || '').toLowerCase()))
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

    if (this.atual >= this.fila.length) this.atual = 0;
    this.renderFila();
    this.renderAtual();
    this.renderHist();
    this.setMsg('Fila carregada.');
  },

  renderFila(){
    const el = document.getElementById('sepFila');
    const st = this.getStatus();
    el.innerHTML = this.fila.map((item, idx) => `
      <div class="item">
        <strong>${idx === this.atual ? '▶ ' : ''}${item.numero}</strong><br>
        ${item.produtoCodigo} - ${item.produtoNome}<br>
        Endereço: ${item.endereco}<br>
        Quantidade: ${item.quantidade}<br>
        Status local: ${st[item.id] || 'aberto'}
      </div>
    `).join('') || '<div class="item">Sem pedidos para separar.</div>';
  },

  renderAtual(){
    const el = document.getElementById('sepAtual');
    const item = this.fila[this.atual];
    if (!item){
      el.innerHTML = '<div class="item">Sem passo atual.</div>';
      return;
    }
    el.innerHTML = `
      <div class="item">
        <strong>Pedido:</strong> ${item.numero}<br>
        <strong>Cliente:</strong> ${item.cliente}<br>
        <strong>Produto:</strong> ${item.produtoCodigo} - ${item.produtoNome}<br>
        <strong>Endereço WMS:</strong> ${item.endereco}<br>
        <strong>Quantidade:</strong> ${item.quantidade}
      </div>
    `;
  },

  repetir(){
    const item = this.fila[this.atual];
    if (!item) return;
    this.setMsg(`Repetindo: pedido ${item.numero}, produto ${item.produtoCodigo}, endereço ${item.endereco}, quantidade ${item.quantidade}.`);
    try {
      const utt = new SpeechSynthesisUtterance(`Pedido ${item.numero}. Produto ${item.produtoCodigo}. Endereço ${item.endereco}. Quantidade ${item.quantidade}.`);
      utt.lang = 'pt-BR';
      speechSynthesis.cancel();
      speechSynthesis.speak(utt);
    } catch(e){}
  },

  async confirmarRetirada(){
    const item = this.fila[this.atual];
    if (!item) return;

    const r = await fetch('/api/estoque/movimento', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        codigo: item.produtoCodigo,
        quantidade: item.quantidade,
        tipo: 'saida'
      })
    });
    const d = await r.json();

    if (!d.ok){
      this.setMsg(d.msg || 'Falha ao baixar estoque.');
      return;
    }

    const st = this.getStatus();
    st[item.id] = 'separando';
    this.setStatus(st);

    const hist = this.getHist();
    hist.unshift({
      data: new Date().toLocaleString(),
      pedido: item.numero,
      produto: item.produtoCodigo,
      quantidade: item.quantidade,
      endereco: item.endereco,
      acao: 'retirada confirmada'
    });
    this.setHist(hist);

    this.renderFila();
    this.renderHist();
    this.setMsg('Retirada confirmada e estoque baixado.');
  },

  concluirPedido(){
    const item = this.fila[this.atual];
    if (!item) return;

    const st = this.getStatus();
    st[item.id] = 'concluido';
    this.setStatus(st);

    const hist = this.getHist();
    hist.unshift({
      data: new Date().toLocaleString(),
      pedido: item.numero,
      produto: item.produtoCodigo,
      quantidade: item.quantidade,
      endereco: item.endereco,
      acao: 'pedido concluído'
    });
    this.setHist(hist);

    if (this.atual < this.fila.length - 1) this.atual += 1;
    this.renderFila();
    this.renderAtual();
    this.renderHist();
    this.setMsg('Pedido marcado como concluído localmente.');
  },

  renderHist(){
    const el = document.getElementById('sepHist');
    const hist = this.getHist();
    el.innerHTML = hist.map(h => `
      <div class="item">
        <strong>${h.pedido}</strong><br>
        Produto: ${h.produto}<br>
        Endereço: ${h.endereco}<br>
        Quantidade: ${h.quantidade}<br>
        Ação: ${h.acao}<br>
        <small>${h.data}</small>
      </div>
    `).join('') || '<div class="item">Sem histórico.</div>';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RIOSEP.carregar();
});
