async function carregarMenuAutomatico() {
  try {
    const res = await fetch('/modules-list');
    const modulos = await res.json();

    const menu = document.querySelector('.menu');

    modulos.forEach(nome => {
      // evita duplicar
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

function formatarNome(nome){
  return nome
    .replace('.html','')
    .replace(/-/g,' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// inicia automático
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(carregarMenuAutomatico, 500);
});
