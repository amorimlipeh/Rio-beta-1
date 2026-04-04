let ultimoCodigo = '';
let bloqueio = false;

async function processarCodigo(codigo) {
  if (bloqueio) return;
  if (codigo === ultimoCodigo) return;

  bloqueio = true;
  ultimoCodigo = codigo;

  try {
    const res = await fetch('/api/produto/' + codigo, { cache: 'no-store' });
    const data = await res.json();

    if (data.erro) {
      document.getElementById('v8Resultado').innerHTML = "❌ Produto não encontrado";
      liberar();
      return;
    }

    beep();
    vibrar();

    document.getElementById('v8Resultado').innerHTML = `
      📦 ${data.codigo}<br>
      🏷 ${data.nome}<br>
      📍 ${data.endereco}<br>
      📊 Estoque: ${data.estoque}
    `;

    document.getElementById('v8Separacao').innerHTML = `
      Produto: ${data.codigo}<br>
      Nome: ${data.nome}<br>
      Endereço: ${data.endereco}<br>
      Quantidade: 1
    `;

    if (window.RIOVOZ && typeof window.RIOVOZ.falarSeparacao === 'function') {
      window.RIOVOZ.falarSeparacao({
        ...data,
        quantidade: 1
      });
    }

    await fetch('/api/baixa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, quantidade: 1 })
    });

  } catch (e) {
    console.log(e);
  }

  liberar();
}

function liberar() {
  setTimeout(() => bloqueio = false, 1500);
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 800;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 100);
  } catch (e) {}
}

function vibrar() {
  if (navigator.vibrate) navigator.vibrate(200);
}
