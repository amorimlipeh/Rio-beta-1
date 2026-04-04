
window.RIOScannerV6 = {
  stream: null,
  timer: null,
  detector: null,
  histKey: 'riobeta1_v6_scanner_hist',

  getHist(){
    try { return JSON.parse(localStorage.getItem(this.histKey) || '[]'); }
    catch { return []; }
  },
  setHist(v){
    localStorage.setItem(this.histKey, JSON.stringify(v.slice(0, 50)));
  },
  setMsg(msg){
    const el = document.getElementById('scannerMsg');
    if (el) el.textContent = msg || '';
  },
  setResultado(html){
    const el = document.getElementById('scannerResultado');
    if (el) el.innerHTML = html;
  },
  renderHist(){
    const el = document.getElementById('scannerHistorico');
    const hist = this.getHist();
    el.innerHTML = hist.map(h => `
      <div class="item">
        <strong>${h.codigo}</strong><br>
        ${h.nome}<br>
        <small>${h.data}</small>
      </div>
    `).join('') || '<div class="item">Sem histórico.</div>';
  },

  async iniciarCamera(){
    try{
      this.pararCamera();
      const video = document.getElementById('scannerVideo');
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      video.srcObject = this.stream;
      await video.play();

      if ('BarcodeDetector' in window){
        try {
          this.detector = new BarcodeDetector({
            formats: ['qr_code','code_128','ean_13','ean_8','upc_a','upc_e']
          });
          this.setMsg('Câmera iniciada. Detector automático ativo.');
          this.timer = setInterval(() => this.scanFrame(), 1200);
        } catch(e){
          this.detector = null;
          this.setMsg('Câmera iniciada. Detector não disponível, use validação manual.');
        }
      } else {
        this.setMsg('Câmera iniciada. Seu navegador não suporta BarcodeDetector; use validação manual.');
      }
    }catch(e){
      this.setMsg('Falha ao iniciar câmera. Verifique a permissão.');
    }
  },

  pararCamera(){
    if (this.timer){
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.stream){
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    const video = document.getElementById('scannerVideo');
    if (video) video.srcObject = null;
  },

  async scanFrame(){
    if (!this.detector) return;
    const video = document.getElementById('scannerVideo');
    if (!video || video.readyState < 2) return;
    try{
      const barcodes = await this.detector.detect(video);
      if (barcodes && barcodes.length){
        const code = barcodes[0].rawValue || '';
        if (code) this.validarCodigo(code);
      }
    }catch(e){}
  },

  async validarManual(){
    const input = document.getElementById('scannerManualCodigo');
    const codigo = (input?.value || '').trim();
    if (!codigo){
      this.setMsg('Informe um código.');
      return;
    }
    await this.validarCodigo(codigo);
    input.value = '';
  },

  async validarCodigo(codigo){
    try{
      const r = await fetch('/api/produtos', { cache:'no-store' });
      const list = await r.json();
      const prod = (list || []).find(p => String(p.codigo || '').toUpperCase() === String(codigo).toUpperCase());

      if (prod){
        this.setResultado(`
          <div class="item">
            <strong>${prod.codigo}</strong> - ${prod.nome}<br>
            Estoque: ${prod.estoque ?? 0}<br>
            Endereço: ${prod.endereco || 'Não definido'}
          </div>
        `);
        this.setMsg('Produto encontrado.');
        const hist = this.getHist();
        hist.unshift({ codigo: prod.codigo, nome: prod.nome || '-', data: new Date().toLocaleString() });
        this.setHist(hist);
        this.renderHist();
      } else {
        this.setResultado(`
          <div class="item">
            <strong>${codigo}</strong><br>
            Produto não localizado.
          </div>
        `);
        this.setMsg('Código não encontrado na base.');
      }
    }catch(e){
      this.setMsg('Falha ao validar código.');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  RIOScannerV6.renderHist();
});
