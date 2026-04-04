window.EstoqueUI = {
  async carregar(){
    const res = await fetch('/api/estoque', { cache:'no-store' });
    const lista = await res.json();
    document.getElementById('estoqueLista').innerHTML = (lista || []).map(p => `
      <div class="item">
        <strong>${p.codigo}</strong> - ${p.nome}<br>
        Estoque atual: ${p.estoque}<br>
        Endereço: ${p.endereco}
      </div>
    `).join('') || '<div class="item">Sem produtos.</div>';
  },

  async salvarProduto(){
    const payload = {
      codigo: document.getElementById('estCodigo').value,
      nome: document.getElementById('estNome').value,
      endereco: document.getElementById('estEndereco').value,
      imagem: document.getElementById('estImagem').value,
      fator: document.getElementById('estFator').value || 1,
      estoque: 0
    };

    const res = await fetch('/api/produtos', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('estMsgCadastro').textContent = data.ok ? 'Produto salvo com sucesso.' : (data.msg || 'Falha ao salvar.');
    if (data.ok) {
      ['estCodigo','estNome','estEndereco','estImagem','estFator'].forEach(id => document.getElementById(id).value = '');
      this.carregar();
    }
  },

  async movimentar(){
    const payload = {
      codigo: document.getElementById('movCodigo').value,
      quantidade: document.getElementById('movQtd').value,
      tipo: document.getElementById('movTipo').value
    };

    const res = await fetch('/api/estoque/movimento', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('estMsgMov').textContent = data.ok ? 'Movimento salvo com sucesso.' : (data.msg || 'Falha ao movimentar.');
    if (data.ok) {
      ['movCodigo','movQtd'].forEach(id => document.getElementById(id).value = '');
      this.carregar();
    }
  }
};
document.addEventListener('DOMContentLoaded', () => EstoqueUI.carregar());
