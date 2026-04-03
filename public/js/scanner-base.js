window.RIOScanner = {
  historico: [],
  async validar() {
    const input = document.getElementById('scannerCodigo');
    const out = document.getElementById('scannerResultado');
    const msg = document.getElementById('scannerMsg');
    const codigo = input?.value?.trim() || '';
    if (!codigo) {
      if (msg) msg.textContent = 'Informe um código.';
      return;
    }
    let produtos = [];
    try {
      const r = await fetch('/api/dashboard', { cache: 'no-store' });
      if (r.ok) {
        // só valida se a API principal responde
      }
    } catch (e) {}
    try {
      const r2 = await fetch('/data/produtos.json', { cache: 'no-store' });
      if (r2.ok) produtos = await r2.json();
    } catch (e) {}
    const prod = produtos.find(p => String(p.codigo || '').toUpperCase() === codigo.toUpperCase());
    if (prod) {
      if (out) out.value = `${prod.codigo} - ${prod.nome || ''}`.trim();
      if (msg) msg.textContent = 'Produto encontrado.';
      this.historico.unshift({ codigo: prod.codigo, nome: prod.nome || '' });
    } else {
      if (out) out.value = 'Não encontrado';
      if (msg) msg.textContent = 'Código não localizado na base.';
      this.historico.unshift({ codigo, nome: 'Não encontrado' });
    }
    this.historico = this.historico.slice(0, 20);
    this.renderHistorico();
  },
  limpar() {
    document.getElementById('scannerCodigo').value = '';
    document.getElementById('scannerResultado').value = '';
    document.getElementById('scannerMsg').textContent = '';
  },
  renderHistorico() {
    const el = document.getElementById('scannerHistorico');
    if (!el) return;
    el.innerHTML = this.historico.map(x => `
      <div class="item"><strong>${x.codigo}</strong><br>${x.nome}</div>
    `).join('') || '<div class="item">Sem histórico.</div>';
  }
};
