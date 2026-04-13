const urlParams = new URLSearchParams(window.location.search);

const pontos = urlParams.get('pontos');
const total = urlParams.get('total');
const erradasJson = urlParams.get('erradas');

let respostasErradas = [];
try {
    respostasErradas = erradasJson ? JSON.parse(decodeURIComponent(erradasJson)) : [];
} catch (e) {
    respostasErradas = [];
}

function exibirResultado() {
    const container = document.getElementById('resultadoContainer');
    
    if (!pontos || !total) {
        container.innerHTML = '<p>Resultado não encontrado</p>';
        return;
    }
    
    const percentual = Math.round((pontos / total) * 100);
    
    let html = `<div class="resultado-final">`;
    
    if (percentual >= 70) {
        html += `<h2>Parabéns!</h2>`;
    } else if (percentual >= 50) {
        html += `<h2>Bom trabalho!</h2>`;
    } else {
        html += `<h2>Continue tentando!</h2>`;
    }
    
    html += `<p class="pontos-finais"><strong>${pontos}</strong> de <strong>${total}</strong> questões acertadas</p>`;
    html += `<p class="percentual">${percentual}% de aproveitamento</p>`;
    
    if (respostasErradas.length > 0) {
        html += `<div class="erradas-detalhes">`;
        html += `<h3>Questões Erradas (${respostasErradas.length}):</h3>`;
        
        respostasErradas.forEach((item, index) => {
            html += `<div class="questao-errada">`;
            html += `<p class="enunciado"><strong>${index + 1}.</strong> ${item.pergunta}</p>`;
            html += `<p class="resposta-errada">Sua resposta: ${item.respostaSelecionada}</p>`;
            html += `</div>`;
        });
        
        html += `</div>`;
    }
    
    html += `<div class="botoes-resultado">`;
    html += `<button class="subjects-button" onclick="window.location.href='prova.html'">Fazer Nova Prova</button>`;
    html += `<button class="subjects-button" onclick="window.location.href='materias.html'">Voltar ao Início</button>`;
    html += `</div>`;
    
    html += `</div>`;
    
    container.innerHTML = html;
}

exibirResultado();