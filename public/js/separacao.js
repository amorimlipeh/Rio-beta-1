window.Separacao = {
  fila: [],
  atual: null,

  async carregar() {
    const atualBox = document.getElementById('sepAtual');
    const listaBox = document.getElementById('sepLista');
    const msgBox = document.getElementById('sepMsg');

    try {
      if (msgBox) msgBox.textContent = '';

      const res = await fetch('/api/separacao?v=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();

      this.fila = Array.isArray(data) ? data : [];
      this.atual = this.fila.length ? this.fila[0] : null;

      if (!this.atual) {
        if (atualBox) atualBox.innerHTML = '<div class="item">Sem pedidos para separar.</div>';
        if (listaBox) listaBox.innerHTML = '<div class="item">Fila vazia.</div>';
        return;
      }

      if (atualBox) {
        atualBox.innerHTML = `
          <div class="item ok">
            <strong>${this.atual.nome}</strong><br>
            Código: ${this.atual.produtoCodigo}<br>
            Endereço: ${this.atual.endereco}<br>
            Quantidade: ${this.atual.quantidade}<br>
            Cliente: ${this.atual.cliente}
          </div>
        `;
      }

      if (listaBox) {
        listaBox.innerHTML = this.fila.map((item, idx) => `
          <div class="item ${idx === 0 ? 'ok' : ''}">
            ${item.produtoCodigo} - ${item.quantidade}
          </div>
        `).join('');
      }
    } catch (e) {
      if (atualBox) atualBox.innerHTML = '<div class="item err">Erro ao carregar separação.</div>';
      if (listaBox) listaBox.innerHTML = '<div class="item err">Erro ao carregar fila.</div>';
    }
  },

  async confirmar() {
    const input = document.getElementById('sepCodigo');
    const msgBox = document.getElementById('sepMsg');

    if (!this.atual) {
      if (msgBox) msgBox.textContent = 'Sem item atual.';
      return;
    }

    const digitado = String(input?.value || '').trim().toUpperCase();
    const esperado = String(this.atual.produtoCodigo || '').trim().toUpperCase();

    // se digitou algo, valida; se não digitou, confirma o item atual direto
    if (digitado && digitado !== esperado) {
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
      if (input) input.value = '';
      await this.carregar();
    } catch (e) {
      if (msgBox) msgBox.textContent = 'Erro ao confirmar coleta.';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sepBtnConfirmar');
  const input = document.getElementById('sepCodigo');

  if (btn) btn.onclick = () => Separacao.confirmar();

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
