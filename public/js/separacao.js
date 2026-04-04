let fila = [];
let atual = null;

async function carregarFila() {
  try {
    const res = await fetch('/api/separacao');
    fila = await res.json();

    if (!fila.length) {
      document.getElementById('separacao-info').innerHTML = 'Fila vazia';
      return;
    }

    atual = fila[0];
    renderAtual();

  } catch (e) {
    document.getElementById('separacao-info').innerHTML = 'Erro ao carregar fila';
  }
}

function renderAtual() {
  if (!atual) return;

  document.getElementById('separacao-info').innerHTML = `
    <div><b>Produto:</b> ${atual.produtoCodigo} - ${atual.nome}</div>
    <div><b>Endereço:</b> ${atual.endereco}</div>
    <div><b>Quantidade:</b> ${atual.quantidade}</div>
    <div><b>Cliente:</b> ${atual.cliente}</div>
  `;
}

async function confirmar() {
  const input = document.getElementById('separacao-input').value;

  if (!atual) return;

  if (input !== atual.produtoCodigo) {
    alert('Código não confere');
    return;
  }

  const res = await fetch('/api/separacao/confirmar', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      codigo: atual.produtoCodigo,
      quantidade: atual.quantidade
    })
  });

  const data = await res.json();

  if (!data.ok) {
    alert(data.msg);
    return;
  }

  fila.shift();
  atual = fila[0] || null;

  document.getElementById('separacao-input').value = '';

  if (!atual) {
    document.getElementById('separacao-info').innerHTML = 'Fila finalizada';
  } else {
    renderAtual();
  }
}

window.onload = carregarFila;
