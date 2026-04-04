
async function buscarProduto(codigo) {
    try {
        const res = await fetch('/api/produto/' + codigo)
        const data = await res.json()

        if (data.erro) {
            document.getElementById('resultado').innerText = '❌ Produto não encontrado'
            return
        }

        // Exibir resultado
        document.getElementById('resultado').innerHTML = `
            📦 ${data.codigo}<br>
            🏷 ${data.nome}<br>
            📍 ${data.endereco}<br>
            📊 Estoque: ${data.estoque}
        `

        // INTEGRAR COM SEPARAÇÃO
        atualizarSeparacao(data)

    } catch (e) {
        console.log(e)
    }
}

function atualizarSeparacao(data) {
    const box = document.getElementById('separacao-box')
    if (!box) return

    box.innerHTML = `
        Pedido: AUTO<br>
        Produto: ${data.codigo}<br>
        Nome: ${data.nome}<br>
        Endereço: ${data.endereco}<br>
        Quantidade: 1
    `
}

