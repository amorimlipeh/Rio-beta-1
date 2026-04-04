window.RIOVOZ = {
  vozSelecionada: null,
  destravada: false,

  carregarVozes() {
    const vozes = window.speechSynthesis.getVoices() || [];
    this.vozSelecionada =
      vozes.find(v => /pt-BR/i.test(v.lang)) ||
      vozes.find(v => /^pt/i.test(v.lang)) ||
      vozes[0] ||
      null;
  },

  destravar() {
    try {
      this.carregarVozes();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = this.vozSelecionada?.lang || 'pt-BR';
      if (this.vozSelecionada) u.voice = this.vozSelecionada;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      this.destravada = true;
    } catch (e) {}
  },

  falar(texto) {
    try {
      if (!texto) return;
      this.carregarVozes();
      const msg = new SpeechSynthesisUtterance(texto);
      msg.lang = this.vozSelecionada?.lang || 'pt-BR';
      if (this.vozSelecionada) msg.voice = this.vozSelecionada;
      msg.rate = 0.95;
      msg.pitch = 1;
      msg.volume = 1;
      window.speechSynthesis.cancel();
      setTimeout(() => window.speechSynthesis.speak(msg), 120);
    } catch (e) {}
  },

  falarSeparacao(data) {
    if (!data) return;

    const endereco = String(data.endereco || '');
    let rua = '', pos = '', andar = '';

    if (endereco.includes('-')) {
      const partes = endereco.split('-');
      rua = partes[0] || '';
      pos = partes[1] || '';
      andar = partes[2] || '';
    } else if (endereco.length >= 6) {
      rua = endereco.slice(0, 2);
      pos = endereco.slice(2, 5);
      andar = endereco.slice(5, 6);
    }

    const texto = [
      rua ? `Vá para a rua ${rua}.` : '',
      pos ? `Posição ${pos}.` : '',
      andar ? `Andar ${andar}.` : '',
      `Produto ${data.nome || 'produto'}.`,
      `Separar ${data.quantidade || 1} unidade${(data.quantidade || 1) > 1 ? 's' : ''}.`
    ].filter(Boolean).join(' ');

    this.falar(texto);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  RIOVOZ.carregarVozes();
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => RIOVOZ.carregarVozes();
  }
});

document.addEventListener('click', () => {
  if (!RIOVOZ.destravada) RIOVOZ.destravar();
}, { once:true });
