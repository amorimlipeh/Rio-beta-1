window.RIOWMSAvancado = {
  ruas: ['01','02','03','04','05','06','07'],
  dados: [],
  gerarBase() {
    const lista = [];
    for (const rua of this.ruas) {
      for (let pos = 1; pos <= 140; pos++) {
        const posStr = String(pos).padStart(3, '0');
        for (let andar = 1; andar <= 7; andar++) {
          const buraco = ((pos >= 49 && pos <= 54) || (pos >= 95 && pos <= 100)) && andar <= 3;
          if (buraco) continue;
          lista.push({
            endereco: `${rua}-${posStr}-${andar}-1`,
            rua,
            posicao: posStr,
            andar: String(andar),
            status: ['01','02','03'].includes(rua) ? 'bloqueado' : 'livre',
            produto: ''
          });
        }
      }
    }
    return lista;
  },
  async carregar() {
    const ruaSel = document.getElementById('wmsRuaFiltro');
    if (ruaSel && ruaSel.options.length <= 1) {
      this.ruas.forEach(r => {
        const op = document.createElement('option');
        op.value = r;
        op.textContent = `Rua ${r}`;
        ruaSel.appendChild(op);
      });
    }
    try {
      const r = await fetch('/data/wms-avancado.json', { cache: 'no-store' });
      this.dados = r.ok ? await r.json() : this.gerarBase();
    } catch (e) {
      this.dados = this.gerarBase();
    }
    this.render();
    this.renderLegenda();
  },
  renderLegenda() {
    const el = document.getElementById('wmsLegenda');
    if (!el) return;
    el.innerHTML = '<div class="item">🟢 livre</div><div class="item">🟠 ocupado</div><div class="item">🔴 bloqueado</div>';
  },
  filtrar() {
    const rua = document.getElementById('wmsRuaFiltro')?.value || 'all';
    const andar = document.getElementById('wmsAndarFiltro')?.value || 'all';
    return this.dados.filter(x => (rua === 'all' || x.rua === rua) && (andar === 'all' || x.andar === andar));
  },
  render() {
    const grid = document.getElementById('wmsGridAv');
    if (!grid) return;
    const lista = this.filtrar();
    grid.innerHTML = lista.map(item => `
      <div class="wms-cell ${item.status}" onclick="RIOWMSAvancado.clicar('${item.endereco}')">
        <strong>${item.endereco}</strong>
        <div>Status: ${item.status}</div>
        <div>${item.produto || '-'}</div>
      </div>`).join('');
  },
  clicar(endereco) {
    const item = this.dados.find(x => x.endereco === endereco);
    if (!item) return;
    alert(`${item.endereco}\nStatus: ${item.status}\nProduto: ${item.produto || '-'}\n\nOK para editar.`);
  },
  async fixarProduto() {
    const endereco = document.getElementById('wmsEnderecoFixar')?.value?.trim();
    const produto = document.getElementById('wmsProdutoFixar')?.value?.trim();
    const msg = document.getElementById('wmsAvMsg');
    const item = this.dados.find(x => x.endereco === endereco);
    if (!item) {
      if (msg) msg.textContent = 'Endereço não encontrado.';
      return;
    }
    item.produto = produto;
    item.status = produto ? 'ocupado' : 'livre';
    this.render();
    if (msg) msg.textContent = 'Produto fixado localmente. Persistência opcional via /salvar-wms-avancado.';
    try {
      await fetch('/salvar-wms-avancado', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(this.dados)
      });
      if (msg) msg.textContent = 'Produto fixado e salvo com sucesso.';
    } catch (e) {}
  }
};
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('wmsRuaFiltro')?.addEventListener('change', () => RIOWMSAvancado.render());
  document.getElementById('wmsAndarFiltro')?.addEventListener('change', () => RIOWMSAvancado.render());
  RIOWMSAvancado.carregar();
});
