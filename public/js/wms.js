const mapa = document.getElementById('mapa');

function gerarMapa() {
  mapa.innerHTML = '';

  for (let i = 1; i <= 10; i++) {
    const pos = document.createElement('div');
    pos.className = 'posicao';
    pos.innerText = '05-' + String(i).padStart(3,'0') + '-1-1';
    mapa.appendChild(pos);
  }
}

gerarMapa();
