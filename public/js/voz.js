window.RIOVOZ = {
  liberado: false,
  vozSelecionada: null,

  carregarVozes() {
    const vozes = window.speechSynthesis.getVoices() || [];

    this.vozSelecionada =
      vozes.find(v => /pt-BR/i.test(v.lang)) ||
      vozes.find(v => /^pt/i.test(v.lang)) ||
      vozes[0] ||
      null;

    console.log('VOZES:', vozes.map(v => `${v.name} | ${v.lang}`));
    console.log('VOZ ESCOLHIDA:', this.vozSelecionada ? `${this.vozSelecionada.name} | ${this.vozSelecionada.lang}` : 'nenhuma');
  },

  desbloquear() {
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      this.liberado = true;
      console.log('voz desbloqueada');
    } catch (e) {
      console.log('erro ao desbloquear voz', e);
    }
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

      setTimeout(() => {
        window.speechSynthesis.speak(msg);
      }, 120);
    } catch (e) {
      console.log('erro voz', e);
    }
  },

  falarSeparacao(data) {
    if (!data) return;

    const endereco = String(data.endereco || '');
    const partes = endereco.split('-');

    const rua = partes[0] || '';
    const pos = partes[1] || '';
    const andar = partes[2] || '';

    const nome = data.nome || 'produto';
    const qtd = data.quantidade || 1;

    const texto = `
      Vá para rua ${rua}.
      Posição ${pos}.
      Andar ${andar}.
      Produto ${nome}.
      Separar ${qtd} unidade.
    `;

    this.falar(texto);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  RIOVOZ.carregarVozes();

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      RIOVOZ.carregarVozes();
    };
  }
});
