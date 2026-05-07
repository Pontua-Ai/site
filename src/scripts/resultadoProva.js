import supabaseClient from "./supabase.js";

const dados = JSON.parse(sessionStorage.getItem("resultadoProva") || "null");

const pontos = dados?.pontos;
const total = dados?.total;
const respostasErradas = dados?.erradas || [];
const idMateria = dados?.idmateria || '';
const idConteudo = dados?.idconteudo || '';
const idUsuario = dados?.idusuario || '';

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