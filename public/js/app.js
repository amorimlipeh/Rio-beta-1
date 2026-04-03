function abrirModulo(modulo) {
  const container = document.getElementById('conteudo');

  fetch('/modules/' + modulo + '.html')
    .then(res => res.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(() => {
      container.innerHTML = '<h3>⚠️ Módulo não encontrado</h3>';
    });
}

// inicializa dashboard sempre
window.onload = () => {
  abrirModulo('dashboard');
};
