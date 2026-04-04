let streamAtual = null;
let devices = [];

function setStatus(msg){
  const el = document.getElementById('status');
  if (el) el.innerText = msg || '';
}

function getSelect(){
  return document.getElementById('listaCameras');
}

function nomeBonitoCamera(device, i){
  const label = (device.label || '').trim();
  if (label) return label;
  return `Câmera ${i + 1}`;
}

function escolherCameraPrincipal(lista){
  if (!lista.length) return null;

  const score = (d, i) => {
    const txt = `${d.label || ''} ${d.deviceId || ''}`.toLowerCase();

    let s = 0;

    if (txt.includes('back')) s += 100;
    if (txt.includes('rear')) s += 100;
    if (txt.includes('environment')) s += 100;
    if (txt.includes('traseira')) s += 100;
    if (txt.includes('principal')) s += 90;
    if (txt.includes('wide')) s += 20;
    if (txt.includes('camera2 0')) s += 80;
    if (txt.includes('camera 0')) s += 80;
    if (txt.includes('0,')) s += 30;
    if (txt.includes('front')) s -= 100;
    if (txt.includes('frontal')) s -= 100;
    if (txt.includes('user')) s -= 100;

    // favorece os primeiros dispositivos quando não houver label
    s += Math.max(0, 20 - i);

    return s;
  };

  const ordenado = [...lista].sort((a, b) => score(b, 0) - score(a, 0));
  return ordenado[0];
}

async function atualizarListaCameras() {
  const select = getSelect();
  if (!select) return;

  devices = (await navigator.mediaDevices.enumerateDevices())
    .filter(d => d.kind === 'videoinput');

  select.innerHTML = '';

  if (!devices.length) {
    select.innerHTML = '<option value="">Nenhuma câmera encontrada</option>';
    return;
  }

  devices.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = nomeBonitoCamera(d, i);
    select.appendChild(opt);
  });

  const principal = escolherCameraPrincipal(devices);
  if (principal) {
    select.value = principal.deviceId;
  }
}

async function pedirPermissaoInicial() {
  try {
    const temp = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    });

    temp.getTracks().forEach(t => t.stop());
    await atualizarListaCameras();
    return true;
  } catch (e) {
    console.error(e);
    setStatus('❌ Permissão da câmera negada ou indisponível.');
    return false;
  }
}

async function iniciarCameraPorDevice(deviceId) {
  try {
    if (streamAtual) {
      streamAtual.getTracks().forEach(t => t.stop());
      streamAtual = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    streamAtual = stream;
    const video = document.getElementById('video');
    video.srcObject = stream;

    const atual = devices.find(d => d.deviceId === deviceId);
    setStatus(`📷 Usando: ${(atual && atual.label) ? atual.label : 'câmera selecionada'}`);
  } catch (e) {
    console.error(e);
    setStatus('❌ Erro ao iniciar a câmera selecionada.');
  }
}

async function iniciarCameraPrincipal() {
  try {
    // primeiro tenta traseira por facingMode
    if (streamAtual) {
      streamAtual.getTracks().forEach(t => t.stop());
      streamAtual = null;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    streamAtual = stream;
    document.getElementById('video').srcObject = stream;
    setStatus('📷 Câmera traseira/principal iniciada.');

    // depois da permissão, atualiza a lista corretamente
    await atualizarListaCameras();

    // tenta alinhar select com track real
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings ? track.getSettings() : {};
    if (settings.deviceId && getSelect()) {
      getSelect().value = settings.deviceId;
    }

  } catch (e) {
    console.error(e);
    setStatus('❌ Não foi possível iniciar a câmera principal.');
  }
}

function pararCamera() {
  if (streamAtual) {
    streamAtual.getTracks().forEach(t => t.stop());
    streamAtual = null;
  }
  const video = document.getElementById('video');
  if (video) video.srcObject = null;
  setStatus('⛔ Câmera parada.');
}

async function usarCameraSelecionada() {
  const select = getSelect();
  if (!select || !select.value) {
    setStatus('⚠️ Nenhuma câmera selecionada.');
    return;
  }
  await iniciarCameraPorDevice(select.value);
}

async function validarManual() {
  const input = document.getElementById('codigoManual');
  const codigo = (input?.value || '').trim();
  const resultado = document.getElementById('resultado');
  const historico = document.getElementById('historico');

  if (!codigo) {
    setStatus('⚠️ Informe um código.');
    return;
  }

  try {
    const res = await fetch('/api/produtos', { cache: 'no-store' });
    const produtos = await res.json();

    const prod = (produtos || []).find(p =>
      String(p.codigo || '').toUpperCase() === codigo.toUpperCase()
    );

    if (prod) {
      resultado.innerHTML = `
        <div class="item">
          <strong>${prod.codigo}</strong> - ${prod.nome || 'Sem nome'}<br>
          Estoque: ${prod.estoque ?? 0}<br>
          Endereço: ${prod.endereco || 'Não definido'}
        </div>
      `;

      const item = document.createElement('div');
      item.className = 'item';
      item.innerHTML = `<strong>${prod.codigo}</strong> - ${prod.nome || 'Sem nome'}`;
      historico.prepend(item);

      setStatus('✅ Produto encontrado.');
    } else {
      resultado.innerHTML = `<div class="item"><strong>${codigo}</strong><br>Produto não encontrado.</div>`;
      setStatus('❌ Código não encontrado.');
    }
  } catch (e) {
    console.error(e);
    setStatus('❌ Falha ao validar código.');
  }

  input.value = '';
}

document.addEventListener('DOMContentLoaded', async () => {
  await pedirPermissaoInicial();
  await atualizarListaCameras();
});
