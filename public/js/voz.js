
function falar(texto) {
    try {
        const msg = new SpeechSynthesisUtterance(texto)
        msg.lang = 'pt-BR'
        msg.rate = 1
        msg.pitch = 1

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(msg)
    } catch (e) {
        console.log('erro voz', e)
    }
}

function falarSeparacao(data) {
    if (!data) return

    const endereco = data.endereco || ''
    const partes = endereco.split('-')

    const rua = partes[0] || ''
    const pos = partes[1] || ''
    const andar = partes[2] || ''

    const texto = `
        Vá para rua ${rua},
        posição ${pos},
        andar ${andar}.
        Produto ${data.nome}.
        Separar 1 unidade.
    `

    falar(texto)
}

