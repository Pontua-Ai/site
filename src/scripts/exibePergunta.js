import { carregarMaterias, carregarConteudos } from "./genereAsk.js";
import supabaseClient from "./supabase.js";

let perguntasCache = [];
let indicePergunta = 0;
let pontos = 0;

const urlParams = new URLSearchParams(window.location.search);
const materiaSelecionada = urlParams.get('materia');
const conteudoSelecionado = urlParams.get('conteudo');//ve a materia e o coteudo pela url

const materiaSelect = document.getElementById("materia");

if (materiaSelect) {
    carregarMaterias();//segue a function carregarMaterias
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
    if (materiaSelecionada) query = query.eq("id_materia", materiaSelecionada);
    if (conteudoSelecionado) query = query.eq("id_conteudo", conteudoSelecionado);//como se fosse SELECT * FROM perguntas WHERE id_materia = 1
    const { data, error } = await query;
    if (error) {
        console.error("Erro:", error);
        return;
    }
    perguntasCache = data ?? [];
    indicePergunta = 0;
    
    if (perguntasCache.length === 0) {
        const container = document.getElementById("perguntaTexto");
        if (container) container.innerText = "Nenhuma pergunta encontrada para esta matéria/conteúdo";
        return;
    }
    
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
    div.append(radio, label);
    return div;
}

export async function exibirPergunta() {
    if (indicePergunta >= perguntasCache.length) {
        document.getElementById("perguntaTexto").innerText = "Fim do questionário!";
        document.getElementById("alternativas").innerHTML = "";
        document.getElementById("pontos").innerText = "Pontos: " + pontos;
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
    btnResponder.onclick = verificarResposta;
    container.appendChild(btnResponder);
}

export function verificarResposta() {
    const selecionada = document.querySelector('input[name="alternativa"]:checked');
    if (!selecionada) {
        alert("Selecione uma alternativa!");
        return;
    }
    if (selecionada.dataset.correta == "true" || selecionada.dataset.correta === true) {
        alert("Correto!");
        pontos++;
    }
    indicePergunta++;
    exibirPergunta();
}

carregarPerguntas ();