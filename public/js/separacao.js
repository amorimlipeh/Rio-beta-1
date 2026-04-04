window.Separacao = {
  fila: [],
  atual: null,

  async carregar() {
    const atualBox = document.getElementById('sepAtual');
    const listaBox = document.getElementById('sepLista');
    const msgBox = document.getElementById('sepMsg');

    try {
      if (msgBox) msgBox.textContent = '';

      const res = await fetch('/api/separacao?v=' + Date.now(), {
        cache: 'no-store'
      });

      const data = await res.json();

      this.fila = Array.isArray(data) ? data : [];
      this.atual = this.fila.length ? this.fila[0] : null;

      if (!this.atual) {
        if (atualBox) {
          atualBox.innerHTML = '<div class="item">Sem pedidos para separar.</div>';
        }
        if (listaBox) {
          listaBox.innerHTML = '<div class="item">Fila vazia.</div>';
        }
        return;
      }

      if (atualBox) {
        atualBox.innerHTML = `
          <div class="item ok">
            <strong>${this.atual.produtoCodigo}</strong> - ${this.atual.nome}<br>
            Cliente: ${this.atual.cliente}<br>
            Endereço: <strong>${this.atual.endereco}</strong><br>
            Quantidade: ${this.atual.quantidade}
          </div>
        `;
      }

      if (listaBox) {
        listaBox.innerHTML = this.fila.map((item, idx) => `
          <div class="item ${idx === 0 ? 'ok' : ''}">
            <strong>${item.pedido}</strong><br>
            Produto: ${item.produtoCodigo}<br>
            Nome: ${item.nome}<br>
            Endereço: ${item.endereco}<br>
            Quantidade: ${item.quantidade}<br>
            Cliente: ${item.cliente}
          </div>
        `).join('');
      }

    } catch (e) {
      console.log('erro ao carregar separacao', e);
      if (atualBox) {
        atualBox.innerHTML = '<div class="item err">Erro ao carregar separação.</div>';
      }
      if (listaBox) {
        listaBox.innerHTML = '<div class="item err">Erro ao carregar fila.</div>';
      }
    }
  },

  async confirmar() {
    const codigo = String(document.getElementById('sepCodigo')?.value || '').trim().toUpperCase();
    const msgBox = document.getElementById('sepMsg');

    if (!this.atual) {
      if (msgBox) msgBox.textContent = 'Sem item atual.';
      return;
    }

    if (!codigo) {
      if (msgBox) msgBox.textContent = 'Informe o código.';
      return;
    }

    const esperado = String(this.atual.produtoCodigo || '').trim().toUpperCase();

    if (codigo !== esperado) {
      if (msgBox) msgBox.textContent = `Código incorreto. Esperado: ${esperado}`;
      return;
    }

    try {
      const res = await fetch('/api/separacao/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: esperado,
          quantidade: Number(this.atual.quantidade || 0)
        })
      });

      const data = await res.json();

      if (!data.ok) {
        if (msgBox) msgBox.textContent = data.msg || 'Erro ao confirmar coleta.';
        return;
      }

      if (msgBox) msgBox.textContent = 'Coleta confirmada com sucesso.';
      document.getElementById('sepCodigo').value = '';
      await this.carregar();
    } catch (e) {
      console.log('erro ao confirmar coleta', e);
      if (msgBox) msgBox.textContent = 'Erro ao confirmar coleta.';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sepBtnConfirmar');
  if (btn) btn.onclick = () => Separacao.confirmar();

  const input = document.getElementById('sepCodigo');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        Separacao.confirmar();
      }
    });
  }

  Separacao.carregar();
});
