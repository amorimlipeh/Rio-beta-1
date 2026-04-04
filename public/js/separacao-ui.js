window.Separacao = {
  atual: null,
  fila: [],

  async carregar() {
    const res = await fetch('/api/separacao?v=' + Date.now(), { cache:'no-store' });
    const data = await res.json();

    this.fila = Array.isArray(data) ? data : [];
    this.atual = this.fila[0] || null;

    document.getElementById('sepBox').innerHTML = this.atual ? `
      <div class="item ok">
        <strong>${this.atual.codigo || this.atual.produtoCodigo} - ${this.atual.nome}</strong><br>
        Endereço: ${this.atual.endereco}<br>
        Quantidade: ${this.atual.quantidade}<br>
        Estoque: ${this.atual.estoque}<br>
        Cliente: ${this.atual.cliente}
      </div>
    ` : '<div class="item">Sem pedidos para separar.</div>';

    document.getElementById('sepFila').innerHTML = this.fila.map((p, idx) => `
      <div class="item ${idx === 0 ? 'ok' : ''}">
        <strong>${p.pedido}</strong><br>
        Produto: ${p.produtoCodigo}<br>
        Nome: ${p.nome}<br>
        Endereço: ${p.endereco}<br>
        Quantidade: ${p.quantidade}
      </div>
    `).join('') || '<div class="item">Fila vazia.</div>';
  },

  async confirmar() {
    const codigoDigitado = String(document.getElementById('scanCodigo')?.value || '').trim().toUpperCase();

    if (!this.atual) return;

    if (codigoDigitado !== String(this.atual.produtoCodigo || '').trim().toUpperCase()) {
      document.getElementById('sepMsg').textContent = 'Produto errado ❌';
      return;
    }

    const res = await fetch('/api/separacao/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo: this.atual.produtoCodigo,
        quantidade: this.atual.quantidade
      })
    });

    const data = await res.json();

    if (data.ok) {
      document.getElementById('sepMsg').textContent = 'Separado com sucesso ✅';
      document.getElementById('scanCodigo').value = '';
      await this.carregar();
    } else {
      document.getElementById('sepMsg').textContent = data.msg || 'Erro';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Separacao.carregar();
});
