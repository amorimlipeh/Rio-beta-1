window.SeparacaoUI = {
  fila: [],
  atual: null,
  validado: false,

  async carregar() {
    try {
      const res = await fetch('/api/separacao?v=' + Date.now(), { cache:'no-store' });
      const data = await res.json();

      this.fila = Array.isArray(data) ? data : [];
      this.atual = this.fila[0] || null;
      this.validado = false;

      this.renderAtual();
      this.renderFila();
      this.setStatus(this.atual ? 'Próximo picking carregado.' : 'Sem pedidos para separar.');
    } catch (e) {
      this.setStatus('Erro ao carregar separação.');
      document.getElementById('sepProximo').innerHTML = '<div class="item err">Erro ao carregar.</div>';
      document.getElementById('sepFila').innerHTML = '<div class="item err">Erro ao carregar.</div>';
    }
  },

  renderAtual() {
    const box = document.getElementById('sepProximo');
    if (!this.atual) {
      box.innerHTML = '<div class="item">Sem pedidos para separar.</div>';
      return;
    }

    box.innerHTML = `
      <div class="item ok">
        <strong>${this.atual.produtoCodigo}</strong> - ${this.atual.nome}<br>
        Cliente: ${this.atual.cliente}<br>
        Endereço: <strong>${this.atual.endereco}</strong><br>
        Quantidade: ${this.atual.quantidade}<br>
        Estoque: ${this.atual.estoque}
      </div>
    `;
  },

  renderFila() {
    const fila = document.getElementById('sepFila');
    fila.innerHTML = this.fila.map((p, idx) => `
      <div class="item ${idx === 0 ? 'ok' : ''}">
        <strong>${p.pedido}</strong><br>
        Produto: ${p.produtoCodigo}<br>
        Nome: ${p.nome}<br>
        Endereço: ${p.endereco}<br>
        Quantidade: ${p.quantidade}<br>
        Cliente: ${p.cliente}
      </div>
    `).join('') || '<div class="item">Fila vazia.</div>';
  },

  setStatus(msg) {
    const el = document.getElementById('sepStatus');
    if (el) el.textContent = msg;
  },

  beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 780;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); if (ctx.close) ctx.close(); }, 100);
    } catch (e) {}
  },

  vibrar() {
    try {
      if (navigator.vibrate) navigator.vibrate(120);
    } catch (e) {}
  },

  falarAtual() {
    if (!this.atual) return;
    if (window.VozPicking) VozPicking.falarEndereco(this.atual);
  },

  validarCodigo() {
    const codigo = String(document.getElementById('sepCodigo')?.value || '').trim().toUpperCase();
    const box = document.getElementById('sepResultado');

    if (!this.atual) {
      this.setStatus('Sem item atual.');
      return;
    }

    if (!codigo) {
      this.setStatus('Informe um código.');
      return;
    }

    const esperado = String(this.atual.produtoCodigo || '').trim().toUpperCase();

    if (codigo !== esperado) {
      this.validado = false;
      box.innerHTML = `
        <div class="item err">
          Produto errado ❌<br>
          Esperado: ${esperado}<br>
          Lido: ${codigo}
        </div>
      `;
      this.setStatus('Produto diferente do picking.');
      return;
    }

    this.validado = true;
    this.beep();
    this.vibrar();

    box.innerHTML = `
      <div class="item ok">
        Produto validado ✅<br>
        Código: ${esperado}<br>
        Endereço: ${this.atual.endereco}<br>
        Quantidade: ${this.atual.quantidade}
      </div>
    `;

    this.setStatus('Produto validado com sucesso.');
    if (window.VozPicking) VozPicking.falarEndereco(this.atual);
  },

  async confirmarColeta() {
    if (!this.atual) {
      this.setStatus('Sem item atual.');
      return;
    }

    if (!this.validado) {
      this.setStatus('Valide o produto antes de confirmar.');
      return;
    }

    try {
      const res = await fetch('/api/separacao/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: this.atual.produtoCodigo,
          quantidade: this.atual.quantidade
        })
      });

      const data = await res.json();

      if (!data.ok) {
        this.setStatus(data.msg || 'Erro ao confirmar coleta.');
        return;
      }

      document.getElementById('sepResultado').innerHTML = `
        <div class="item ok">
          Coleta confirmada ✅<br>
          Estoque restante: ${data.estoque}
        </div>
      `;

      document.getElementById('sepCodigo').value = '';
      this.setStatus('Coleta confirmada com sucesso.');
      await this.carregar();
    } catch (e) {
      this.setStatus('Erro ao confirmar coleta.');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SeparacaoUI.carregar();
});
