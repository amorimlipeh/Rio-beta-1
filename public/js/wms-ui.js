window.WMSUI = {
  async carregar(){
    const res = await fetch('/api/wms', { cache:'no-store' });
    const lista = await res.json();
    document.getElementById('wmsGrid').innerHTML = (lista || []).map(x => `
      <div class="wms-cell ${x.status === 'bloqueado' ? 'wms-bloqueado' : (x.status === 'ocupado' ? 'wms-ocupado' : 'wms-livre')}">
        <strong>${x.endereco}</strong><br>
        Status: ${x.status}<br>
        ${x.produto || '-'}
      </div>
    `).join('');
  },

  async salvar(){
    const payload = {
      endereco: document.getElementById('wmsEndereco').value,
      produto: document.getElementById('wmsProduto').value
    };

    const res = await fetch('/api/wms/fixar', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    document.getElementById('wmsMsg').textContent = data.ok ? 'Endereço atualizado com sucesso.' : (data.msg || 'Falha ao salvar.');
    if (data.ok) {
      ['wmsEndereco','wmsProduto'].forEach(id => document.getElementById(id).value = '');
      this.carregar();
    }
  }
};
document.addEventListener('DOMContentLoaded', () => WMSUI.carregar());
