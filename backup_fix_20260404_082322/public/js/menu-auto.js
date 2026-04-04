async function carregarMenuAutomatico() {
  try {
    const res = await fetch('/modules-list?v=' + Date.now(), { cache: 'no-store' });
    const modulos = await res.json();

    const menu = document.querySelector('.menu');
    if (!menu || !Array.isArray(modulos)) return;

    const fixos = new Set(['dashboard', 'produtos', 'estoque', 'pedidos', 'wms', 'separacao', 'v8-camera']);

    modulos
      .filter(nome => !fixos.has(nome))
      .forEach(nome => {
        if (document.querySelector(`[data-auto="${nome}"]`)) return;

        const btn = document.createElement('div');
        btn.className = 'btn';
        btn.innerText = formatarNome(nome);
        btn.setAttribute('data-auto', nome);
        btn.onclick = () => abrirModulo(nome);
        menu.appendChild(btn);
      });
  } catch (e) {
    console.log('menu auto falhou', e);
  }
}

function formatarNome(nome) {
  return nome
    .replace('.html', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(carregarMenuAutomatico, 400);
});
