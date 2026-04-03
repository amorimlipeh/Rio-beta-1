
(function(){
  window.RIO = window.RIO || {};
  window.RIO.loadedAssets = window.RIO.loadedAssets || new Set();

  async function loadModuleAssets(container){
    const links = [...container.querySelectorAll('link[rel="stylesheet"][href]')];
    for (const link of links){
      const href = link.getAttribute('href');
      if (!window.RIO.loadedAssets.has(href)){
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
        window.RIO.loadedAssets.add(href);
      }
      link.remove();
    }

    const scripts = [...container.querySelectorAll('script')];
    for (const oldScript of scripts){
      const s = document.createElement('script');
      if (oldScript.src){
        const src = oldScript.getAttribute('src');
        if (!window.RIO.loadedAssets.has(src)){
          s.src = src;
          document.body.appendChild(s);
          window.RIO.loadedAssets.add(src);
          await new Promise(resolve => {
            s.onload = resolve;
            s.onerror = resolve;
          });
        }
      } else {
        s.textContent = oldScript.textContent;
        document.body.appendChild(s);
      }
      oldScript.remove();
    }
  }

  window.abrirModulo = async function(modulo){
    const container = document.getElementById('conteudo');
    if (!container){
      console.warn('Container #conteudo não encontrado');
      return;
    }

    try{
      const res = await fetch('/modules/' + modulo + '.html', { cache: 'no-store' });
      if (!res.ok) throw new Error('Módulo não encontrado');
      const html = await res.text();
      container.innerHTML = html;

      document.querySelectorAll('.btn').forEach(btn => btn.classList.remove('ativo'));
      const btn = document.querySelector('[data-modulo="' + modulo + '"]');
      if (btn) btn.classList.add('ativo');

      await loadModuleAssets(container);
    }catch(e){
      container.innerHTML = '<div class="card"><h2>' + modulo + '</h2><p>⚠️ Falha ao carregar módulo.</p></div>';
      console.error('Erro ao abrir módulo', modulo, e);
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('conteudo');
    if (container && !container.innerHTML.trim()){
      window.abrirModulo('dashboard');
    }
  });
})();
