let streamAtual = null;
let ultimoCodigo = null;
let bloqueio = false;

function beep(){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 800;
  osc.connect(ctx.destination);
  osc.start();
  setTimeout(()=>osc.stop(),100);
}

function vibrar(){
  if(navigator.vibrate) navigator.vibrate(200);
}

function setStatus(msg){
  document.getElementById('status').innerText = msg;
}

async function iniciarCamera(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    streamAtual = stream;
    document.getElementById('video').srcObject = stream;

    setStatus('📷 Scanner ativo (modo automático)');
    loopLeitura();

  }catch(e){
    setStatus('❌ Erro ao iniciar câmera');
  }
}

function pararCamera(){
  if(streamAtual){
    streamAtual.getTracks().forEach(t=>t.stop());
    streamAtual = null;
  }
  setStatus('⛔ Scanner parado');
}

async function loopLeitura(){
  if(!streamAtual) return;

  setTimeout(async ()=>{
    if(!bloqueio){
      const codigoFake = gerarCodigoTeste(); // simulação leitura

      if(codigoFake && codigoFake !== ultimoCodigo){
        ultimoCodigo = codigoFake;
        await processarCodigo(codigoFake);
      }
    }
    loopLeitura();
  },1500);
}

function gerarCodigoTeste(){
  const lista = ["ARZ001","FEJ002","XYZ999",null];
  return lista[Math.floor(Math.random()*lista.length)];
}

async function processarCodigo(codigo){
  bloqueio = true;

  try{
    const res = await fetch('/api/produtos');
    const produtos = await res.json();

    const prod = produtos.find(p =>
      String(p.codigo).toUpperCase() === codigo
    );

    const resultado = document.getElementById('resultado');
    const historico = document.getElementById('historico');

    if(prod){
      beep();
      vibrar();

      const nome = prod.nome || 'Sem nome';
      const estoque = prod.estoque ?? 0;
      const endereco = prod.endereco || 'Não definido';

      resultado.innerHTML = `
        <div class="item sucesso">
          <strong>${prod.codigo}</strong> - ${nome}<br>
          Estoque: ${estoque}<br>
          Endereço: ${endereco}
        </div>
      `;

      // integração com separação
      const sep = document.getElementById('separacaoAuto');
      if(sep){
        sep.innerHTML = `
          Pedido: AUTO<br>
          Produto: ${prod.codigo}<br>
          Nome: ${nome}<br>
          Endereço: ${endereco}<br>
          Quantidade: 1
        `;
      }

      const item = document.createElement('div');
      item.className = 'item';
      item.innerText = prod.codigo + " - " + nome;
      historico.prepend(item);

      setStatus('✅ Produto validado');

    }else{
      beep();

      resultado.innerHTML = `
        <div class="item erro">
          <strong>${codigo}</strong><br>
          Produto não encontrado
        </div>
      `;

      setStatus('❌ Código inválido');
    }

  }catch(e){
    setStatus('❌ erro geral');
  }

  setTimeout(()=> bloqueio=false, 1500);
}
