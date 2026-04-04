
let streamAtual = null;
let ultimoCodigo = null;
let bloqueio = false;
let detector = null;
let loopAtivo = false;

function beep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(()=>{ osc.stop(); ctx.close(); },120);
  }catch(e){}
}

function vibrar(){
  try{
    if(navigator.vibrate) navigator.vibrate(160);
  }catch(e){}
}

function setStatus(msg){
  const el = document.getElementById('status');
  if (el) el.innerText = msg || '';
}

function normalizarProduto(prod){
  return {
    codigo: prod?.codigo || 'SEM-COD',
    nome: prod?.nome || 'Sem nome',
    estoque: prod?.estoque ?? 0,
    endereco: prod?.endereco || 'Não definido'
  };
}

function renderResultado(prod, ok=true, codigoOriginal=''){
  const resultado = document.getElementById('resultado');
  if (!resultado) return;

  if (ok){
    const p = normalizarProduto(prod);
    resultado.innerHTML = `
      <div class="item sucesso">
        <strong>${p.codigo}</strong> - ${p.nome}<br>
        Estoque: ${p.estoque}<br>
        Endereço: ${p.endereco}
      </div>
    `;
  } else {
    resultado.innerHTML = `
      <div class="item erro">
        <strong>${codigoOriginal}</strong><br>
        Produto não encontrado
      </div>
    `;
  }
}

function renderSeparacao(prod){
  const sep = document.getElementById('separacaoAuto');
  if (!sep) return;
  const p = normalizarProduto(prod);
  sep.innerHTML = `
    <div class="item">
      Pedido: AUTO<br>
      Produto: ${p.codigo}<br>
      Nome: ${p.nome}<br>
      Endereço: ${p.endereco}<br>
      Quantidade: 1
    </div>
  `;
}

function addHistorico(texto){
  const historico = document.getElementById('historico');
  if (!historico) return;
  const item = document.createElement('div');
  item.className = 'item';
  item.innerHTML = `<strong>${new Date().toLocaleTimeString()}</strong><br>${texto}`;
  historico.prepend(item);
}

async function iniciarCamera(){
  try{
    pararCameraSilencioso();

    streamAtual = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    const video = document.getElementById('video');
    video.srcObject = streamAtual;
    await video.play();

    if ('BarcodeDetector' in window){
      try{
        detector = new BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
        });
        setStatus('📷 Scanner ativo (modo automático real)');
      }catch(e){
        detector = null;
        setStatus('📷 Câmera ativa. Detector não disponível, use código manual.');
      }
    } else {
      detector = null;
      setStatus('📷 Câmera ativa. Detector não suportado, use código manual.');
    }

    loopAtivo = true;
    loopLeitura();
  }catch(e){
    console.error(e);
    setStatus('❌ Erro ao iniciar câmera');
  }
}

function pararCameraSilencioso(){
  loopAtivo = false;
  if (streamAtual){
    try{ streamAtual.getTracks().forEach(t=>t.stop()); }catch(e){}
    streamAtual = null;
  }
  const video = document.getElementById('video');
  if (video) video.srcObject = null;
}

function pararCamera(){
  pararCameraSilencioso();
  setStatus('⛔ Scanner parado');
}

async function loopLeitura(){
  if (!loopAtivo) return;

  if (detector && streamAtual && !bloqueio){
    const video = document.getElementById('video');
    try{
      const codes = await detector.detect(video);
      if (codes && codes.length){
        const raw = codes[0].rawValue || '';
        if (raw && raw !== ultimoCodigo){
          ultimoCodigo = raw;
          await processarCodigo(raw);
        }
      }
    }catch(e){}
  }

  setTimeout(loopLeitura, 900);
}

async function validarManual(){
  const input = document.getElementById('codigoManual');
  const codigo = (input?.value || '').trim().toUpperCase();
  if (!codigo){
    setStatus('⚠️ Informe um código manual');
    return;
  }
  await processarCodigo(codigo);
  input.value = '';
}

async function processarCodigo(codigo){
  if (!codigo) return;
  bloqueio = true;

  try{
    const res = await fetch('/api/produtos', { cache: 'no-store' });
    const produtos = await res.json();

    const prod = (produtos || []).find(p =>
      String(p.codigo || '').toUpperCase() === String(codigo).toUpperCase()
    );

    if (prod){
      const p = normalizarProduto(prod);
      beep();
      vibrar();
      renderResultado(p, true);
      renderSeparacao(p);
      addHistorico(`${p.codigo} - ${p.nome}`);
      setStatus('✅ Produto validado');
    } else {
      beep();
      renderResultado(null, false, codigo);
      addHistorico(`${codigo} - não encontrado`);
      setStatus('❌ Código inválido');
    }
  }catch(e){
    console.error(e);
    setStatus('❌ erro geral');
  }

  setTimeout(()=> { bloqueio = false; }, 1500);
}
