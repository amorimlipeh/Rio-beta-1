
let ultimoCodigo = ''
let bloqueio = false

async function processarCodigo(codigo) {
    if (bloqueio) return
    if (codigo === ultimoCodigo) return

    bloqueio = true
    ultimoCodigo = codigo

    try {
        const res = await fetch('/api/produto/' + codigo)
        const data = await res.json()

        if (data.erro) {
            document.getElementById('v8Resultado').innerHTML = "❌ Produto não encontrado"
            bloquearTempo()
            return
        }

        // SOM + VIBRAÇÃO
        beep()
        vibrar()

        document.getElementById('v8Resultado').innerHTML = `
            📦 ${data.codigo}<br>
            🏷 ${data.nome}<br>
            📍 ${data.endereco}<br>
            📊 Estoque: ${data.estoque}
        `

        // SEPARAÇÃO
        document.getElementById('v8Separacao').innerHTML = `
            Produto: ${data.codigo}<br>
            Nome: ${data.nome}<br>
            Endereço: ${data.endereco}<br>
            Quantidade: 1
        `

        // BAIXA AUTOMÁTICA
        await fetch('/api/baixa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, quantidade: 1 })
        })

    } catch (e) {
        console.log(e)
    }

    bloquearTempo()
}

function bloquearTempo() {
    setTimeout(() => bloqueio = false, 1500)
}

function beep() {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    osc.frequency.value = 800
    osc.connect(ctx.destination)
    osc.start()
    setTimeout(() => osc.stop(), 100)
}

function vibrar() {
    if (navigator.vibrate) navigator.vibrate(200)
}

