import supabaseClient from "./supabase.js";

const imagemParaMateria = {
    matematica: "matematica.png",
    portugues: "portugues.png",
    fisica: "fisica.png",
    quimica: "quimica.png",
    biologia: "biologia.png",
    historia: "historia.png",
    geografia: "geografia.png",
    ingles: "ingles.png",
    artes: "artes.png",
    espanhol: "espanhol.png",
    filosofia: "filosofia.png",
    sociologia: "sociologia.png",
};

const slugMateria = {
    "matemática": "matematica",
    "português": "portugues",
    "física": "fisica",
    "química": "quimica",
    "biologia": "biologia",
    "história": "historia",
    "geografia": "geografia",
    "inglês": "ingles",
    "artes": "artes",
    "espanhol": "espanhol",
    "filosofia": "filosofia",
    "sociologia": "sociologia",
};

const ORDEM_ORIGINAL = [
    "matemática",
    "português",
    "física",
    "química",
    "biologia",
    "história",
    "geografia",
    "inglês",
    "artes",
    "espanhol",
    "filosofia",
    "sociologia",
];

function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function obterSlug(nome) {
    const chave = nome.toLowerCase();
    if (slugMateria[chave]) return slugMateria[chave];
    return normalizar(nome).replace(/\s+/g, '-');
}

function obterImagem(nome) {
    const slug = obterSlug(nome);
    if (imagemParaMateria[slug]) return `img/${imagemParaMateria[slug]}`;
    return "img/coala-magro.png";
}

function indiceOrdem(nome) {
    const idx = ORDEM_ORIGINAL.indexOf(nome.toLowerCase());
    return idx === -1 ? Infinity : idx;
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.id_usuario || null;
}

async function carregarMaterias() {
    const container = document.getElementById("materiasContainer");
    if (!container) return;

    const userId = getUserId();

    const { data: materias, error } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia, id_usuario");

    if (error) {
        container.innerHTML = "<p>Erro ao carregar matérias.</p>";
        return;
    }

    if (!materias || materias.length === 0) {
        container.innerHTML = "<p>Nenhuma matéria encontrada.</p>";
        return;
    }

    const idsTurmas = [];
    if (userId) {
        const { data: turmasAluno } = await supabaseClient
            .from("turma_aluno")
            .select("id_turma")
            .eq("id_aluno", userId);
        if (turmasAluno) {
            turmasAluno.forEach(t => idsTurmas.push(t.id_turma));
        }
    }

    const idsMateriasLiberadas = new Set();
    if (idsTurmas.length > 0) {
        const { data: materiasTurma } = await supabaseClient
            .from("materia_turma")
            .select("id_materia")
            .in("id_turma", idsTurmas);
        if (materiasTurma) {
            materiasTurma.forEach(m => idsMateriasLiberadas.add(m.id_materia));
        }
    }

    const filtradas = materias.filter(m => {
        if (m.id_usuario === null) return true;
        return idsMateriasLiberadas.has(m.id_materia);
    });

    const unicas = [];
    const nomesVistos = new Set();
    for (const m of filtradas) {
        const chave = normalizar(m.nome_materia);
        if (!nomesVistos.has(chave)) {
            nomesVistos.add(chave);
            unicas.push(m);
        }
    }

    unicas.sort((a, b) => {
        const idxA = indiceOrdem(a.nome_materia);
        const idxB = indiceOrdem(b.nome_materia);
        if (idxA !== idxB) return idxA - idxB;
        return a.nome_materia.localeCompare(b.nome_materia, 'pt-BR');
    });

    if (unicas.length === 0) {
        container.innerHTML = "<p>Nenhuma matéria disponível para você.</p>";
        return;
    }

    unicas.forEach(materia => {
        const card = document.createElement("a");
        card.href = `conteudo.html?nome_conteudo=${encodeURIComponent(materia.nome_materia)}`;
        card.className = "card";

        const divider = document.createElement("div");
        divider.className = "divider-line";
        card.appendChild(divider);

        const img = document.createElement("img");
        img.src = obterImagem(materia.nome_materia);
        img.alt = materia.nome_materia;
        img.title = materia.nome_materia;
        card.appendChild(img);

        const btn = document.createElement("button");
        btn.className = "subjects-button";
        btn.textContent = materia.nome_materia;
        card.appendChild(btn);

        container.appendChild(card);
    });
}

carregarMaterias();
