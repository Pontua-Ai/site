import { carregarMaterias, carregarConteudos } from "./genereAsk.js";
import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let perguntasCache = [];
let indicePergunta = 0;
let pontos = 0;
let totalRespostas = 0;
let todasRespostas = [];
let corretaAtual = "";
let idMateriaAtual = null;
let idConteudoAtual = null;

let tempoRestante = 18000;
let cronometroInterval = null;
let provaFinalizada = false;
const TEMPO_LIMITE = 18000;

const urlParams = new URLSearchParams(window.location.search);
const materiaSelecionada = urlParams.get('materia');
const conteudoSelecionado = urlParams.get('conteudo');
const provaGeral = urlParams.get('provaGeral');
const simulado = urlParams.get('simulado');

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
    if (!document.getElementById("perguntaTexto")) return;
    let query = supabaseClient
        .from("perguntas")
        .select("*")
        .eq("visibilidade", "publico");
    
    let perguntas;
    
    if (provaGeral === 'true') {
        const { data: todasPerguntas, error } = await query;
        if (error) {
            console.error("Erro:", error);
            return;
        }

        const { data: materias } = await supabaseClient
            .from("materia")
            .select("id_materia");

        let perguntasSelecionadas = [];
        const perguntasPorMateria = {};

        if (materias) {
            materias.forEach(m => {
                perguntasPorMateria[m.id_materia] = todasPerguntas.filter(p => p.id_materia === m.id_materia);
            });

            Object.values(perguntasPorMateria).forEach((perguntasDaMateria) => {
                if (perguntasDaMateria.length > 0) {
                    const randomIndex = Math.floor(Math.random() * perguntasDaMateria.length);
                    perguntasSelecionadas.push(perguntasDaMateria[randomIndex]);
                }
            });
        }

        const perguntasRestantes = shuffleArray(todasPerguntas.filter(p => !perguntasSelecionadas.includes(p)));
        const quantosFaltam = 20 - perguntasSelecionadas.length;
        perguntasSelecionadas = shuffleArray([...perguntasSelecionadas, ...perguntasRestantes.slice(0, quantosFaltam)]);
        perguntas = perguntasSelecionadas;

    } else if (simulado === 'true') {
        const { data: todasPerguntas, error } = await query;
        if (error) {
            console.error("Erro:", error);
            return;
        }

        const { data: materias } = await supabaseClient
            .from("materia")
            .select("id_materia");

        let perguntasSelecionadas = [];
        const perguntasPorMateria = {};

        if (materias) {
            materias.forEach(m => {
                perguntasPorMateria[m.id_materia] = todasPerguntas.filter(p => p.id_materia === m.id_materia);
            });

            Object.values(perguntasPorMateria).forEach((perguntasDaMateria) => {
                if (perguntasDaMateria.length > 0) {
                    const shuffled = shuffleArray([...perguntasDaMateria]);
                    const qtd = Math.min(3, perguntasDaMateria.length);
                    for (let i = 0; i < qtd; i++) {
                        perguntasSelecionadas.push(shuffled[i]);
                    }
                }
            });
        }

        const perguntasRestantes = shuffleArray(todasPerguntas.filter(p => !perguntasSelecionadas.includes(p)));
        const quantosFaltam = 60 - perguntasSelecionadas.length;
        if (quantosFaltam > 0) {
            perguntasSelecionadas = shuffleArray([...perguntasSelecionadas, ...perguntasRestantes.slice(0, quantosFaltam)]);
        }
        perguntas = perguntasSelecionadas;

    } else if (materiaSelecionada && !conteudoSelecionado) {
        query = query.eq("id_materia", materiaSelecionada);
        const { data, error } = await query;
        if (error) {
            console.error("Erro:", error);
            return;
        }
        perguntas = shuffleArray(data ?? []).slice(0, 10);
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
    
    if (simulado === 'true') {
        iniciarCronometro();
    } else {
        document.getElementById("cronometro").style.display = "none";
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
    div.classList.add("alternativa");   

    div.onclick = () => {
        radio.checked = true;  
    };
    div.append(radio, label);
    return div;
}

function finalizarProva() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    const params = new URLSearchParams(window.location.search);
    let idMateria = params.get('materia');
    const idConteudo = params.get('conteudo');

    if (!idMateria && perguntasCache.length > 0) {
        idMateria = perguntasCache[0].id_materia;
    }

    sessionStorage.setItem("resultadoProva", JSON.stringify({
        respostas: todasRespostas
    }));

    window.location.href = `resultadoProva.html?pontos=${pontos}&total=${totalRespostas}&idusuario=${userLogado ? userLogado.id_usuario : ''}&idmateria=${idMateria || ''}&idconteudo=${idConteudo || ''}`;
}

function iniciarCronometro() {
    const el = document.getElementById("cronometro");
    if (!el) return;

    tempoRestante = TEMPO_LIMITE;

    function atualizar() {
        const hrs = Math.floor(tempoRestante / 3600);
        const min = Math.floor((tempoRestante % 3600) / 60);
        const seg = tempoRestante % 60;
        el.textContent = `${String(hrs).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;

        if (tempoRestante <= 5) {
            el.classList.add("alerta");
        }

        if (tempoRestante <= 0) {
            clearInterval(cronometroInterval);
            mostrarTempoAcabou();
            return;
        }
        tempoRestante--;
    }

    atualizar();
    cronometroInterval = setInterval(atualizar, 1000);
}

function mostrarTempoAcabou() {
    if (provaFinalizada) return;
    provaFinalizada = true;

    document.getElementById("perguntaTexto").style.display = "none";
    document.getElementById("alternativas").style.display = "none";
    document.getElementById("cronometro").style.display = "none";

    const overlay = document.createElement("div");
    overlay.className = "tempo-acabou-overlay";
    overlay.innerHTML = `
        <div class="mensagem">
            <i class="fa-regular fa-clock"></i>
            Tempo acabou!
        </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(finalizarProva, 2000);
}

export async function exibirPergunta() {
    if (indicePergunta >= perguntasCache.length) {
        if (!provaFinalizada) finalizarProva();
        return;
    }
    const pergunta = perguntasCache[indicePergunta];
    idMateriaAtual = pergunta.id_materia;
    idConteudoAtual = pergunta.id_conteudo;
    document.getElementById("perguntaTexto").innerHTML = pergunta.pergunta_texto;
    
    const idPergunta = pergunta.id_pergunta || pergunta.id;
    
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
    
    corretaAtual = "";
    alternativas.forEach(alt => {
        if (alt.correta) corretaAtual = alt.nome_alternativa;
        container.appendChild(criarAlternativa(alt));
    });
    const btnResponder = document.createElement("button");
    btnResponder.textContent = "Responder";
    btnResponder.classList.add("subjects-button-medium");
    btnResponder.onclick = verificarResposta;
    container.appendChild(btnResponder);
}

export async function verificarResposta() {
    if (provaFinalizada) return;

    const selecionada = document.querySelector('input[name="alternativa"]:checked');
    if (!selecionada) {
        toast("Selecione uma alternativa!", "error");
        return;
    }
    
    const perguntaAtual = perguntasCache[indicePergunta];
    const isCorreta = selecionada.dataset.correta == "true" || selecionada.dataset.correta === true;
    
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (userLogado) {
        await supabaseClient
            .from("pontuacao_atividade")
            .insert([{
                id_usuario: userLogado.id_usuario,
                id_alternativa: parseInt(selecionada.value),
                pontos_atividade: isCorreta ? 1 : 0,
                id_materia: idMateriaAtual,
                id_conteudo: idConteudoAtual
            }]);
    }
    
    const label = selecionada.nextElementSibling;
    const respostaTexto = label ? label.innerText.trim() : "Resposta selecionada";

    totalRespostas++;
    if (isCorreta) pontos++;

    todasRespostas.push({
        pergunta: perguntaAtual.pergunta_texto,
        suaResposta: respostaTexto,
        respostaCorreta: corretaAtual,
        acertou: isCorreta
    });
    
    indicePergunta++;
    exibirPergunta();
}

carregarPerguntas();