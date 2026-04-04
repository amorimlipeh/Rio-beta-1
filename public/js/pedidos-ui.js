window.PedidosUI = {
  produtos: [],

  async carregarProdutos(){
    try {
      const res = await fetch('/api/produtos');
      const lista = await res.json();

      this.produtos = Array.isArray(lista) ? lista : [];

      console.log("📦 produtos carregados:", this.produtos);

    } catch(e){
      console.log("erro ao carregar produtos", e);
      this.produtos = [];
    }
  },

  buscarProdutos(){
    const termo = document.getElementById('pedProdutoBusca').value.toUpperCase();
    const box = document.getElementById('pedSugestoes');

    if (!termo){
      box.innerHTML = '';
      box.style.display = 'none';
      return;
    }

    const encontrados = this.produtos.filter(p => {
      return (
        (p.codigo || '').toUpperCase().includes(termo) ||
        (p.nome || '').toUpperCase().includes(termo)
      );
    });

    if (encontrados.length === 0){
      box.innerHTML = `<div class="suggest-item">Nenhum produto encontrado</div>`;
      box.style.display = 'block';
      return;
    }

    box.innerHTML = encontrados.map(p => `
      <div class="suggest-item" onclick="PedidosUI.selecionar('${p.codigo}','${p.nome}')">
        <strong>${p.codigo}</strong> - ${p.nome}
      </div>
    `).join('');

    box.style.display = 'block';
  },

  selecionar(codigo, nome){
    const campo = document.getElementById('pedProdutoCodigo');

    campo.value = `${codigo} - ${nome}`;
    campo.dataset.codigo = codigo;

    document.getElementById('pedSugestoes').style.display = 'none';
  },

  async salvar(){
    const cliente = document.getElementById('pedCliente').value;
    const qtd = document.getElementById('pedQtd').value;
    const campo = document.getElementById('pedProdutoCodigo');

    const produtoCodigo = campo.dataset.codigo;

    if (!cliente || !produtoCodigo || !qtd){
      alert("Preencha tudo");
      return;
    }

    await fetch('/api/pedidos', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        cliente,
        produtoCodigo,
        quantidade: qtd
      })
    });

    alert("Pedido salvo");

    document.getElementById('pedCliente').value = '';
    document.getElementById('pedQtd').value = '';
    document.getElementById('pedProdutoBusca').value = '';
    campo.value = '';
    delete campo.dataset.codigo;
  }
};

document.addEventListener('DOMContentLoaded', ()=>{
  PedidosUI.carregarProdutos();
});
