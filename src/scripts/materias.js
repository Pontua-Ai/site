import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

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

const SVG_EYE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const SVG_EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

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

function criarCard(materia, isHidden) {
    const card = document.createElement("a");
    if (!isHidden) {
        card.href = `conteudo.html?nome_conteudo=${encodeURIComponent(materia.nome_materia)}`;
    }
    card.className = "card";
    if (isHidden) card.classList.add("card-hidden");

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

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "card-toggle-btn";
    toggleBtn.innerHTML = isHidden ? SVG_EYE : SVG_EYE_OFF;
    toggleBtn.title = isHidden ? "Reexibir matéria" : "Ocultar matéria";
    toggleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isHidden) {
            await reexibirMateria(materia);
        } else {
            await ocultarMateria(materia);
        }
    });
    card.appendChild(toggleBtn);

    return card;
}

async function ocultarMateria(materia) {
    const userId = getUserId();
    if (!userId) return;

    const { error } = await supabaseClient
        .from("materia_oculta")
        .insert({ id_materia: materia.id_materia, id_usuario: userId });
    if (error) {
        toast("Erro ao ocultar matéria", "error");
        return;
    }

    const { data: conteudos } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo")
        .eq("id_materia", materia.id_materia);
    if (conteudos && conteudos.length > 0) {
        await supabaseClient.from("conteudo_oculto").insert(
            conteudos.map(c => ({ id_conteudo: c.id_conteudo, id_usuario: userId }))
        );
    }

    toast(`"${materia.nome_materia}" ocultada`, "success");
    carregarMaterias();
}

async function reexibirMateria(materia) {
    const userId = getUserId();
    if (!userId) return;

    await supabaseClient
        .from("materia_oculta")
        .delete()
        .eq("id_materia", materia.id_materia)
        .eq("id_usuario", userId);

    const { data: conteudos } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo")
        .eq("id_materia", materia.id_materia);
    if (conteudos && conteudos.length > 0) {
        await supabaseClient
            .from("conteudo_oculto")
            .delete()
            .in("id_conteudo", conteudos.map(c => c.id_conteudo))
            .eq("id_usuario", userId);
    }

    toast(`"${materia.nome_materia}" reexibida`, "success");
    carregarMaterias();
}

async function carregarMaterias() {
    const container = document.getElementById("materiasContainer");
    const hiddenContainer = document.getElementById("hiddenMateriasContainer");
    const hiddenSection = document.getElementById("hiddenSubjectsSection");
    if (!container) return;

    container.innerHTML = '<div class="loading-container"><span class="loading-spinner"></span> Carregando...</div>';

    const userId = getUserId();

    const [materiasRes, ocultasRes] = await Promise.all([
        supabaseClient.from("materia").select("id_materia, nome_materia, id_usuario"),
        userId ? supabaseClient.from("materia_oculta").select("id_materia").eq("id_usuario", userId) : Promise.resolve({ data: [] })
    ]);

    const materias = materiasRes.data || [];
    const materiasOcultas = new Set((ocultasRes.data || []).map(o => o.id_materia));

    if (materias.length === 0) {
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

    const visiveis = [];
    const ocultas = [];

    for (const m of materias) {
        const podeVer = m.id_usuario === null || idsMateriasLiberadas.has(m.id_materia);
        if (!podeVer) continue;

        if (materiasOcultas.has(m.id_materia)) {
            ocultas.push(m);
        } else {
            visiveis.push(m);
        }
    }

    function deduplicar(lista) {
        const unicas = [];
        const nomesVistos = new Set();
        for (const m of lista) {
            const chave = normalizar(m.nome_materia);
            if (!nomesVistos.has(chave)) {
                nomesVistos.add(chave);
                unicas.push(m);
            }
        }
        return unicas;
    }

    function ordenar(lista) {
        return lista.sort((a, b) => {
            const idxA = indiceOrdem(a.nome_materia);
            const idxB = indiceOrdem(b.nome_materia);
            if (idxA !== idxB) return idxA - idxB;
            return a.nome_materia.localeCompare(b.nome_materia, 'pt-BR');
        });
    }

    const visiveisOrdenadas = ordenar(deduplicar(visiveis));
    const ocultasOrdenadas = ordenar(deduplicar(ocultas));

    container.innerHTML = "";
    if (visiveisOrdenadas.length === 0 && ocultasOrdenadas.length === 0) {
        container.innerHTML = "<p>Nenhuma matéria disponível para você.</p>";
        return;
    }

    visiveisOrdenadas.forEach(m => container.appendChild(criarCard(m, false)));

    if (hiddenSection && hiddenContainer) {
        if (ocultasOrdenadas.length > 0) {
            hiddenSection.style.display = "block";
            hiddenContainer.innerHTML = "";
            ocultasOrdenadas.forEach(m => hiddenContainer.appendChild(criarCard(m, true)));
        } else {
            hiddenSection.style.display = "none";
        }
    }
}

function toggleHiddenSection() {
    const container = document.getElementById("hiddenMateriasContainer");
    const arrow = document.querySelector(".hidden-arrow");
    if (!container || !arrow) return;
    const fechado = container.style.display !== "flex";
    container.style.display = fechado ? "flex" : "none";
    arrow.classList.toggle("open", fechado);
}

document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("hiddenToggle");
    if (toggle) {
        toggle.addEventListener("click", toggleHiddenSection);
    }
});

carregarMaterias();
