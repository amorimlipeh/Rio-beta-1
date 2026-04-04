window.Separacao = {
  atual: null,

  async carregar() {
    const res = await fetch('/api/separacao/proxima');
    const data = await res.json();

    if (data.vazio) {
      document.getElementById('sepBox').innerHTML = '<div class="item">Sem pedidos</div>';
      return;
    }

    if (data.erro) {
      document.getElementById('sepBox').innerHTML = '<div class="item">Erro</div>';
      return;
    }

    this.atual = data;

    document.getElementById('sepBox').innerHTML = `
      <div class="item">
        <strong>${data.codigo} - ${data.nome}</strong><br>
        Endereço: ${data.endereco}<br>
        Quantidade: ${data.quantidade}<br>
        Estoque: ${data.estoque}<br>
        Cliente: ${data.cliente}
      </div>
    `;
  },

  async confirmar() {
    const codigoDigitado = document.getElementById('scanCodigo').value.trim();

    if (!this.atual) return;

    if (codigoDigitado !== this.atual.codigo) {
      document.getElementById('sepMsg').innerText = 'Produto errado ❌';
      return;
    }

    const res = await fetch('/api/separacao/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: this.atual.codigo, quantidade: this.atual.quantidade })
    });

    const data = await res.json();

    if (data.ok) {
      document.getElementById('sepMsg').innerText = 'Separado com sucesso ✅';
      document.getElementById('scanCodigo').value = '';
      this.carregar();
    } else {
      document.getElementById('sepMsg').innerText = data.msg;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Separacao.carregar();
});
