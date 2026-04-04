
window.abrirModulo = async function(modulo){
  const container = document.getElementById('conteudo');
  try{
    const res = await fetch('/modules/' + modulo + '.html', { cache:'no-store' });
    if(!res.ok) throw new Error('Módulo não encontrado');
    container.innerHTML = await res.text();
    document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('ativo'));
    document.querySelector('[data-modulo="' + modulo + '"]')?.classList.add('ativo');

    const scripts = [...container.querySelectorAll('script')];
    for (const oldScript of scripts){
      const s = document.createElement('script');
      if (oldScript.src){
        s.src = oldScript.src + (oldScript.src.includes('?') ? '&' : '?') + 'v=' + Date.now();
        document.body.appendChild(s);
        await new Promise(r => { s.onload=r; s.onerror=r; });
      } else {
        s.textContent = oldScript.textContent;
        document.body.appendChild(s);
      }
      oldScript.remove();
    }
  }catch(e){
    container.innerHTML = '<div class="card"><h2>' + modulo + '</h2><p>Falha ao carregar módulo.</p></div>';
  }
};
window.addEventListener('DOMContentLoaded', ()=> abrirModulo('dashboard'));
