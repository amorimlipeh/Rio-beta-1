let streamAtual = null;
let devices = [];

async function listarCameras() {
  const lista = document.getElementById('listaCameras');
  lista.innerHTML = '';

  devices = (await navigator.mediaDevices.enumerateDevices())
    .filter(d => d.kind === 'videoinput');

  devices.forEach((d, i) => {
    const nome = d.label || `Câmera ${i+1}`;
    lista.innerHTML += `<option value="${d.deviceId}">${nome}</option>`;
  });
}

async function iniciarCamera(deviceId = null) {
  try {
    if (streamAtual) {
      streamAtual.getTracks().forEach(t => t.stop());
    }

    let constraints;

    if (deviceId) {
      constraints = {
        video: { deviceId: { exact: deviceId } }
      };
    } else {
      // força traseira
      constraints = {
        video: { facingMode: { ideal: "environment" } }
      };
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamAtual = stream;

    const video = document.getElementById('video');
    video.srcObject = stream;

    document.getElementById('status').innerText = "📷 Câmera iniciada";

  } catch (e) {
    console.error(e);
    document.getElementById('status').innerText = "❌ Erro ao iniciar câmera";
  }
}

function pararCamera() {
  if (streamAtual) {
    streamAtual.getTracks().forEach(t => t.stop());
    streamAtual = null;
  }
  document.getElementById('status').innerText = "⛔ Câmera parada";
}

function usarCameraSelecionada() {
  const select = document.getElementById('listaCameras');
  const id = select.value;
  iniciarCamera(id);
}

document.addEventListener('DOMContentLoaded', async () => {
  await listarCameras();
});
