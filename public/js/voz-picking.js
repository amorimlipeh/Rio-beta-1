window.VozPicking = {
  destravado: false,

  destravar() {
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = 'pt-BR';
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      this.destravado = true;
    } catch (e) {}
  },

  falar(texto) {
    try {
      if (!texto) return;
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = 0.95;
      u.pitch = 1;
      u.volume = 1;
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(u), 120);
    } catch (e) {}
  },

  falarEndereco(item) {
    if (!item) return;
    const endereco = String(item.endereco || '');
    let rua = '', pos = '', andar = '', pallet = '';

    if (endereco.includes('-')) {
      const p = endereco.split('-');
      rua = p[0] || '';
      pos = p[1] || '';
      andar = p[2] || '';
      pallet = p[3] || '';
    }

    const texto = [
      rua ? `Rua ${rua}.` : '',
      pos ? `Posição ${pos}.` : '',
      andar ? `Andar ${andar}.` : '',
      pallet ? `Palete ${pallet}.` : '',
      item.nome ? `Produto ${item.nome}.` : '',
      item.quantidade ? `Separar ${item.quantidade} unidade${Number(item.quantidade) > 1 ? 's' : ''}.` : ''
    ].filter(Boolean).join(' ');

    this.falar(texto);
  }
};

document.addEventListener('click', () => {
  if (!VozPicking.destravado) VozPicking.destravar();
}, { once:true });
