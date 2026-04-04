window.ScannerUI = {
  stream: null,
  devices: [],
  currentIndex: 0,
  detector: null,
  timer: null,
  lock: false,
  lastCode: '',
  histKey: 'riobeta1_scanner_hist',

  status(msg){
    document.getElementById('scanStatus').textContent = msg || '';
  },

  getHist(){
    try { return JSON.parse(localStorage.getItem(this.histKey) || '[]'); }
    catch { return []; }
  },

  setHist(v){
    localStorage.setItem(this.histKey, JSON.stringify(v.slice(0, 60)));
  },

  renderHist(){
    const hist = this.getHist();
    document.getElementById('scanHistorico').innerHTML =
      hist.map(h => `
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
    const select = document.getElementById('scanLista');
    select.innerHTML = '';
    this.devices.forEach((d, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = d.label || `Câmera ${i+1}`;
      select.appendChild(opt);
    });
    this.currentIndex = 0;
    if (select.options.length) select.value = '0';
  },

  async iniciar(){
    const ok = await this.pedirPermissao();
    if (!ok) return;
    await this.listar();
    await this.startByIndex(this.currentIndex);
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
      const video = document.getElementById('scanVideo');
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
          this.status('Detector não disponível. Use captura ou código manual.');
        }
      } else {
        this.detector = null;
        this.status('Detector não suportado. Use captura ou código manual.');
      }
    }catch(e){
      this.status('Erro ao iniciar a câmera.');
    }
  },

  startLoop(){
    this.stopLoop();
    this.timer = setInterval(async () => {
      if (!this.detector || this.lock) return;
      const video = document.getElementById('scanVideo');
      if (!video || video.readyState < 2) return;
      try{
        const found = await this.detector.detect(video);
        if (found && found.length){
          const raw = found[0].rawValue || '';
          if (raw && raw !== this.lastCode){
            this.lastCode = raw;
            await this.processar(raw);
          }
        }
      }catch(e){}
    }, 900);
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
    const video = document.getElementById('scanVideo');
    if (video) video.srcObject = null;
  },

  parar(){
    this.pararSilencioso();
    this.status('Scanner parado.');
  },

  mostrarCameras(){
    const box = document.getElementById('scanCamBox');
    box.style.display = box.style.display === 'none' ? 'grid' : 'none';
  },

  async usarSelecionada(){
    const idx = Number(document.getElementById('scanLista').value || 0);
    await this.startByIndex(idx);
  },

  async trocarCamera(){
    if (!this.devices.length) await this.listar();
    if (!this.devices.length) return;
    const next = (this.currentIndex + 1) % this.devices.length;
    document.getElementById('scanLista').value = String(next);
    await this.startByIndex(next);
  },

  async capturar(){
    const video = document.getElementById('scanVideo');
    const canvas = document.getElementById('scanCanvas');
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
          if (raw) {
            await this.processar(raw);
            return;
          }
        }
      }catch(e){}
    }

    this.status('Nada reconhecido na captura. Use o código manual.');
  },

  async validarManual(){
    const codigo = String(document.getElementById('scanManual').value || '').trim().toUpperCase();
    if (!codigo){
      this.status('Informe um código manual.');
      return;
    }
    await this.processar(codigo);
    document.getElementById('scanManual').value = '';
  },

  beep(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 780;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(()=>{ osc.stop(); if (ctx.close) ctx.close(); },100);
    }catch(e){}
  },

  vibrar(){
    try { if (navigator.vibrate) navigator.vibrate(150); } catch(e){}
  },

  async processar(codigo){
    if (!codigo || this.lock) return;
    this.lock = true;

    try{
      const res = await fetch('/api/produto/' + codigo, { cache:'no-store' });
      const data = await res.json();

      if (data.erro){
        document.getElementById('scanResultado').innerHTML = `<div class="item erro"><strong>${codigo}</strong><br>Produto não encontrado</div>`;
        this.status('Código não encontrado.');
        setTimeout(()=> this.lock = false, 1200);
        return;
      }

      this.beep();
      this.vibrar();

      document.getElementById('scanResultado').innerHTML = `
        <div class="item sucesso">
          <strong>${data.codigo}</strong> - ${data.nome}<br>
          Estoque: ${data.estoque}<br>
          Endereço: ${data.endereco}
        </div>
      `;

      document.getElementById('scanSeparacao').innerHTML = `
        <div class="item">
          Pedido: AUTO<br>
          Produto: ${data.codigo}<br>
          Nome: ${data.nome}<br>
          Endereço: ${data.endereco}<br>
          Quantidade: 1
        </div>
      `;

      const hist = this.getHist();
      hist.unshift({ codigo: data.codigo, nome: data.nome, data: new Date().toLocaleString() });
      this.setHist(hist);
      this.renderHist();

      if (window.RIOVOZ && typeof window.RIOVOZ.falarSeparacao === 'function') {
        window.RIOVOZ.falarSeparacao({ ...data, quantidade: 1 });
      }

      this.status('Produto validado com sucesso.');

    } catch(e){
      this.status('Erro ao validar código.');
    }

    setTimeout(()=> this.lock = false, 1200);
  }
};
document.addEventListener('DOMContentLoaded', () => ScannerUI.renderHist());
