const mapa = document.getElementById('mapa');

function carregarMapa() {
  fetch('/data/wms.json')
    .then(r => r.json())
    .then(lista => {
      mapa.innerHTML = '';

      lista.forEach(item => {
        const div = document.createElement('div');
        div.className = 'posicao ' + item.status;

        div.innerHTML = `
          ${item.endereco}<br>
          ${item.produto || ''}
        `;

        div.onclick = () => {
          const cod = prompt('Digite o código do produto:');

          if (cod) {
            item.produto = cod;
            item.status = 'ocupado';
            salvar(lista);
          }
        };

        mapa.appendChild(div);
      });
    });
}

function salvar(lista) {
  fetch('/salvar-wms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lista)
  }).then(() => carregarMapa());
}

carregarMapa();
