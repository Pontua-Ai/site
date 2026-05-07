const urlParams = new URLSearchParams(window.location.search);
const dadosSS = JSON.parse(sessionStorage.getItem("resultadoProva") || "null");

const pontos = urlParams.get('pontos');
const total = urlParams.get('total');
const todasRespostas = dadosSS?.respostas || [];
const idMateria = urlParams.get('idmateria') || '';
const idConteudo = urlParams.get('idconteudo') || '';
const idUsuario = urlParams.get('idusuario') || '';

sessionStorage.removeItem("resultadoProva");

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
    
    if (todasRespostas.length > 0) {
        html += `<div class="todas-questoes">`;
        html += `<h3>Todas as Questões:</h3>`;
        
        todasRespostas.forEach((item, index) => {
            const classe = item.acertou ? "questao-certa" : "questao-errada";
            html += `<div class="${classe}">`;
            html += `<p class="enunciado"><strong>${index + 1}.</strong> ${item.pergunta}</p>`;
            
            if (item.acertou) {
                html += `<p class="resposta-certa">Sua resposta: ${item.suaResposta} ✓</p>`;
            } else {
                html += `<p class="resposta-errada">Sua resposta: ${item.suaResposta} ✗</p>`;
                html += `<p class="resposta-certa">Resposta correta: ${item.respostaCorreta}</p>`;
            }
            
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