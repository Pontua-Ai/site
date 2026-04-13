import { carregarMaterias, carregarConteudos } from "./genereAsk.js";
import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let perguntasCache = [];
let indicePergunta = 0;
let pontos = 0;
let totalRespostas = 0;
let respostasErradas = [];

const urlParams = new URLSearchParams(window.location.search);
const materiaSelecionada = urlParams.get('materia');
const conteudoSelecionado = urlParams.get('conteudo');
const provaGeral = urlParams.get('provaGeral');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const materiaSelect = document.getElementById("materia");

if (materiaSelect) {
    materiaSelect.addEventListener("change", carregarConteudos);
}

function criarOption(valor, texto) {
    const option = document.createElement("option");
    option.value = valor;
    option.textContent = texto;
    return option;
}

export async function carregarPerguntas() {
    let query = supabaseClient
        .from("perguntas")
        .select("*");
    
    let perguntas;
    
    if (provaGeral === 'true') {
        const { data, error } = await query;
        if (error) {
            console.error("Erro:", error);
            return;
        }
        perguntas = shuffleArray(data ?? []).slice(0, 90);
    } else if (materiaSelecionada && !conteudoSelecionado) {
        query = query.eq("id_materia", materiaSelecionada);
        const { data, error } = await query;
        if (error) {
            console.error("Erro:", error);
            return;
        }
        perguntas = shuffleArray(data ?? []).slice(0, 20);
    } else {
        if (materiaSelecionada) query = query.eq("id_materia", materiaSelecionada);
        if (conteudoSelecionado) query = query.eq("id_conteudo", conteudoSelecionado);
        const { data, error } = await query;
        if (error) {
            console.error("Erro:", error);
            return;
        }
        perguntas = data ?? [];
    }
    
    perguntasCache = perguntas;
    indicePergunta = 0;
    
    if (perguntasCache.length === 0) {
        const container = document.getElementById("perguntaTexto");
        if (container) container.innerText = "Nenhuma pergunta encontrada para esta matéria/conteúdo";
        return;
    };
    
    exibirPergunta();
}

function criarAlternativa(alt) {
    const div = document.createElement("div");
    div.style.margin = "5px 0";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "alternativa";
    radio.value = alt.id_alternativa;
    radio.dataset.correta = alt.correta;
    const label = document.createElement("label");
    label.innerText = " " + alt.nome_alternativa;
    div.classList.add("alternativa");   

    div.onclick = () => {
        radio.checked = true;  
    };
    div.append(radio, label);
    return div;
}

export async function exibirPergunta() {
    if (indicePergunta >= perguntasCache.length) {
        window.location.href = `resultadoProva.html?pontos=${pontos}&total=${totalRespostas}&erradas=${encodeURIComponent(JSON.stringify(respostasErradas))}`;
        return;
    }
    const pergunta = perguntasCache[indicePergunta];
    console.log("Pergunta:", pergunta);
    document.getElementById("perguntaTexto").innerText = pergunta.pergunta_texto;
    
    const idPergunta = pergunta.id_pergunta || pergunta.id;
    console.log("ID da pergunta usado:", idPergunta);
    
    const { data: alternativas, error } = await supabaseClient
        .from("alternativa")
        .select("*")
        .eq("id_pergunta", idPergunta);
    console.log("Alternativas:", alternativas, "Erro:", error);
    const container = document.getElementById("alternativas");
    container.innerHTML = "";
    
    if (!alternativas || alternativas.length === 0) {
        container.innerHTML = "<p>Nenhuma alternativa encontrada</p>";
        return;
    }
    
    alternativas.forEach(alt => {
        container.appendChild(criarAlternativa(alt));
    });
    const btnResponder = document.createElement("button");
    btnResponder.textContent = "Responder";
    btnResponder.classList.add("subjects-button-medium");
    btnResponder.onclick = verificarResposta;
    container.appendChild(btnResponder);
}

export function verificarResposta() {
    const selecionada = document.querySelector('input[name="alternativa"]:checked');
    if (!selecionada) {
        toast("Selecione uma alternativa!", "error");
        return;
    }
    
    const perguntaAtual = perguntasCache[indicePergunta];
    const isCorreta = selecionada.dataset.correta == "true" || selecionada.dataset.correta === true;
    
    totalRespostas++;
    
    if (isCorreta) {
        pontos++;
    } else {
        const label = selecionada.nextElementSibling;
        const respostaTexto = label ? label.innerText.trim() : "Resposta selecionada";
        
        respostasErradas.push({
            pergunta: perguntaAtual.pergunta_texto,
            respostaSelecionada: respostaTexto
        });
    }
    
    indicePergunta++;
    exibirPergunta();
}

carregarPerguntas();