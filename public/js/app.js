
window.RIO = window.RIO || {};

window.abrirModulo = async function(modulo) {
  const container = document.getElementById('conteudo');
  if (!container) {
    console.warn('Container #conteudo não encontrado');
    return;
  }

  try {
    const res = await fetch(`/modules/${modulo}.html`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Modulo não encontrado');
    const html = await res.text();
    container.innerHTML = html;

    document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('ativo'));
    const alvo = document.querySelector(`[data-modulo="${modulo}"]`);
    if (alvo) alvo.classList.add('ativo');
  } catch (e) {
    container.innerHTML = `<div class="card"><h2>${modulo}</h2><p>⚠️ Módulo não encontrado.</p></div>`;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('conteudo');
  if (container && !container.innerHTML.trim()) {
    abrirModulo('dashboard');
  }
});
