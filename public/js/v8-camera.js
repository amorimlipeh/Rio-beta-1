window.V8Cam = {
  stream: null,
  devices: [],
  currentIndex: 0,
  detector: null,
  timer: null,
  lastCode: '',
  lock: false,
  histKey: 'riobeta1_v8_hist',

  status(msg){
    const el = document.getElementById('v8Status');
    if (el) el.textContent = msg || '';
  },

  getHist(){
    try { return JSON.parse(localStorage.getItem(this.histKey) || '[]'); }
    catch { return []; }
  },

  setHist(v){
    localStorage.setItem(this.histKey, JSON.stringify(v.slice(0, 60)));
  },

  renderHist(){
    const el = document.getElementById('v8Historico');
    const hist = this.getHist();
    el.innerHTML = hist.map(h => `
      <div class="item">
        <strong>${h.codigo}</strong> - ${h.nome}<br>
        <small>${h.data}</small>
      </div>
    `).join('') || '<div class="item">Sem histórico.</div>';
  },

  async pedirPermissao(){
    try{
      const temp = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          aspectRatio: 4/3,
          width: { ideal: 1024 },
          height: { ideal: 768 }
        },
        audio: false
      });
      temp.getTracks().forEach(t => t.stop());
      return true;
    }catch(e){
      this.status('Permissão da câmera negada.');
      return false;
    }
  },

  async listar(){
    this.devices = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput');
    const select = document.getElementById('v8Lista');
    if (!select) return;

    select.innerHTML = '';
    this.devices.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = d.label || `Câmera ${i+1}`;
      select.appendChild(opt);
    });

    const principal = this.pickMainCamera();
    if (principal >= 0) {
      this.currentIndex = principal;
      select.value = String(principal);
    }
  },

  pickMainCamera(){
    if (!this.devices.length) return -1;
    let bestIdx = 0;
    let bestScore = -9999;

    this.devices.forEach((d, i) => {
      const txt = `${d.label || ''} ${d.deviceId || ''}`.toLowerCase();
      let s = 0;
      if (txt.includes('back')) s += 100;
      if (txt.includes('rear')) s += 100;
      if (txt.includes('environment')) s += 100;
      if (txt.includes('traseira')) s += 100;
      if (txt.includes('principal')) s += 70;
      if (txt.includes('camera2 0')) s += 60;
      if (txt.includes('camera 0')) s += 60;
      if (txt.includes('front')) s -= 120;
      if (txt.includes('frontal')) s -= 120;
      s += Math.max(0, 20 - i);
      if (s > bestScore){
        bestScore = s;
        bestIdx = i;
      }
    });

    return bestIdx;
  },

  async iniciar(){
    const ok = await this.pedirPermissao();
    if (!ok) return;
    await this.listar();

    if (this.currentIndex >= 0) {
      await this.startByIndex(this.currentIndex);
    } else {
      this.status('Nenhuma câmera encontrada.');
    }
  },

  async startByIndex(index){
    try{
      this.pararSilencioso();
      this.currentIndex = index;
      const dev = this.devices[index];

      const constraints = dev ? {
        video: {
          deviceId: { exact: dev.deviceId },
          aspectRatio: 4/3,
          width: { ideal: 1024 },
          height: { ideal: 768 }
        },
        audio: false
      } : {
        video: {
          facingMode: { ideal: 'environment' },
          aspectRatio: 4/3,
          width: { ideal: 1024 },
          height: { ideal: 768 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = document.getElementById('v8Video');
      video.srcObject = this.stream;
      await video.play();

      if ('BarcodeDetector' in window){
        try{
          this.detector = new BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
          });
          this.startLoop();
          this.status(`Usando ${(dev && dev.label) ? dev.label : 'câmera principal'} · leitura automática ativa.`);
        }catch(e){
          this.detector = null;
          this.status('Câmera ativa. Detector não disponível. Use captura.');
        }
      } else {
        this.detector = null;
        this.status('Câmera ativa. Detector não suportado. Use captura.');
      }
    }catch(e){
      console.error(e);
      this.status('Erro ao iniciar a câmera.');
    }
  },

  startLoop(){
    this.stopLoop();
    this.timer = setInterval(async () => {
      if (!this.detector || this.lock) return;
      const video = document.getElementById('v8Video');
      if (!video || video.readyState < 2) return;

      try{
        const found = await this.detector.detect(video);
        if (found && found.length){
          const raw = found[0].rawValue || '';
          if (raw && raw !== this.lastCode){
            this.lastCode = raw;
            await this.processCode(raw);
          }
        }
      }catch(e){}
    }, 850);
  },

  stopLoop(){
    if (this.timer){
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  pararSilencioso(){
    this.stopLoop();
    if (this.stream){
      try { this.stream.getTracks().forEach(t => t.stop()); } catch(e){}
      this.stream = null;
    }
    const video = document.getElementById('v8Video');
    if (video) video.srcObject = null;
  },

  parar(){
    this.pararSilencioso();
    this.status('Scanner parado.');
  },

  abrirLista(){
    const box = document.getElementById('v8ListaBox');
    if (box) box.classList.toggle('hidden');
  },

  async usarSelecionada(){
    const select = document.getElementById('v8Lista');
    if (!select || select.value === '') {
      this.status('Nenhuma câmera selecionada.');
      return;
    }
    await this.startByIndex(Number(select.value));
  },

  async trocarCamera(){
    if (!this.devices.length) await this.listar();
    if (!this.devices.length) {
      this.status('Nenhuma câmera disponível.');
      return;
    }
    const next = (this.currentIndex + 1) % this.devices.length;
    const select = document.getElementById('v8Lista');
    if (select) select.value = String(next);
    await this.startByIndex(next);
  },

  async capturarFallback(){
    const video = document.getElementById('v8Video');
    const canvas = document.getElementById('v8Canvas');

    if (!video || !canvas || video.readyState < 2){
      this.status('Câmera não está pronta.');
      return;
    }

    const w = video.videoWidth || 1024;
    const h = video.videoHeight || 768;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    if (this.detector){
      try{
        const found = await this.detector.detect(canvas);
        if (found && found.length){
          const raw = found[0].rawValue || '';
          if (raw){
            await this.processCode(raw);
            return;
          }
        }
      }catch(e){}
    }

    this.status('Nada reconhecido na captura. Use o código manual.');
  },

  async validarManual(){
    const input = document.getElementById('v8CodigoManual');
    const codigo = (input?.value || '').trim().toUpperCase();
    if (!codigo){
      this.status('Informe um código manual.');
      return;
    }
    await this.processCode(codigo);
    input.value = '';
  },

  beep(ok=true){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = ok ? 880 : 320;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(()=>{ osc.stop(); ctx.close(); }, 120);
    }catch(e){}
  },

  vibrar(){
    try { if (navigator.vibrate) navigator.vibrate(120); } catch(e){}
  },

  normalizeProduct(prod){
    return {
      codigo: prod?.codigo || 'SEM-COD',
      nome: prod?.nome || 'Sem nome',
      estoque: prod?.estoque ?? 0,
      endereco: prod?.endereco || 'Não definido'
    };
  },

  async processCode(codigo){
    if (!codigo) return;
    this.lock = true;

    try{
      const res = await fetch('/api/produtos', { cache: 'no-store' });
      const produtos = await res.json();
      const prod = (produtos || []).find(p => String(p.codigo || '').toUpperCase() === String(codigo).toUpperCase());

      const out = document.getElementById('v8Resultado');
      const sep = document.getElementById('v8Separacao');

      if (prod){
        const p = this.normalizeProduct(prod);
        this.beep(true);
        this.vibrar();

        if (out) out.innerHTML = `<div class="item sucesso"><strong>${p.codigo}</strong> - ${p.nome}<br>Estoque: ${p.estoque}<br>Endereço: ${p.endereco}</div>`;
        if (sep) sep.innerHTML = `<div class="item">Pedido: AUTO<br>Produto: ${p.codigo}<br>Nome: ${p.nome}<br>Endereço: ${p.endereco}<br>Quantidade: 1</div>`;

        const hist = this.getHist();
        hist.unshift({ codigo: p.codigo, nome: p.nome, data: new Date().toLocaleString() });
        this.setHist(hist);
        this.renderHist();
        this.status('Produto validado com sucesso.');
      } else {
        this.beep(false);
        if (out) out.innerHTML = `<div class="item erro"><strong>${codigo}</strong><br>Produto não encontrado</div>`;
        this.status('Código não encontrado.');
      }
    }catch(e){
      console.error(e);
      this.status('Erro ao validar código.');
    }

    setTimeout(() => { this.lock = false; }, 1200);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  V8Cam.renderHist();
});
