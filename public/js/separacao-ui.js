window.SeparacaoUI = {
  fila: [],
  atual: null,

  async carregar() {
    const res = await fetch('/api/separacao?v=' + Date.now());
    this.fila = await res.json();
    this.atual = this.fila[0] || null;

    this.render();
    this.falar();
  },

  render() {
    const box = document.getElementById('sepAtual');

    if (!this.atual) {
      box.innerHTML = '<div class="item">Sem pedidos</div>';
      return;
    }

    box.innerHTML = `
      <div class="item ok">
        <strong>${this.atual.produtoCodigo}</strong> - ${this.atual.nome}<br>
        📍 ${this.atual.endereco}<br>
        📦 ${this.atual.quantidade}
      </div>
    `;
  },

  falar() {
    if (!this.atual) return;

    if (window.VozPicking) {
      VozPicking.falarEndereco(this.atual);
    }
  },

  beep() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.start();
      setTimeout(() => osc.stop(), 100);
    } catch(e){}
  },

  vibrar() {
    if (navigator.vibrate) navigator.vibrate(100);
  },

  async validar(codigo) {
    const esperado = this.atual.produtoCodigo.toUpperCase();

    if (codigo !== esperado) {
      this.feedback('❌ Produto errado', 'err');
      return;
    }

    this.beep();
    this.vibrar();

    this.feedback('✅ Confirmado', 'ok');

    await fetch('/api/separacao/confirmar', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        codigo: esperado,
        quantidade: this.atual.quantidade
      })
    });

    setTimeout(() => this.proximo(), 500);
  },

  feedback(msg, tipo) {
    const box = document.getElementById('sepFeedback');
    box.innerHTML = `<div class="item ${tipo}">${msg}</div>`;
  },

  proximo() {
    this.carregar();
    document.getElementById('sepCodigo').value = '';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SeparacaoUI.carregar();

  const input = document.getElementById('sepCodigo');

  input.addEventListener('input', (e) => {
    const val = e.target.value.trim().toUpperCase();

    if (val.length >= 5) {
      SeparacaoUI.validar(val);
    }
  });
});
