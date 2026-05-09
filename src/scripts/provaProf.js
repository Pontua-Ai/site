import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let todasPerguntas = [];
let ultimasProvasGeradas = null;

async function carregarMaterias() {
    const select = document.getElementById("materia");
    const { data, error } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia");
    if (error) {
        console.error("Erro ao carregar matérias:", error);
        return;
    }

    data.forEach(m => {
        const option = document.createElement("option");
        option.value = m.id_materia;
        option.textContent = m.nome_materia;
        select.appendChild(option);
    });

    $('#materia').select2({ minimumResultsForSearch: 0 });
    $('#conteudo').select2({ minimumResultsForSearch: Infinity });
}

async function carregarConteudos(idMateria) {
    const select = document.getElementById("conteudo");
    select.innerHTML = '<option value="">Todos os conteúdos</option>';

    if (!idMateria) {
        $('#conteudo').trigger('change');
        return;
    }

    const { data, error } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria);
    if (error) {
        console.error("Erro ao carregar conteúdos:", error);
        return;
    }

    data.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id_conteudo;
        option.textContent = c.nome_conteudo;
        select.appendChild(option);
    });

    $('#conteudo').trigger('change');
}

async function carregarPerguntas() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado || userLogado.tipo_conta !== 'professor') {
        window.location.href = "inicio.html";
        return;
    }

    const { data: perguntas, error } = await supabaseClient
        .from("perguntas")
        .select("*, materia(nome_materia), conteudo(nome_conteudo)")
        .eq("id_usuario", userLogado.id_usuario)
        .order("id_pergunta", { ascending: false });

    if (error) {
        console.error("Erro ao carregar perguntas:", error);
        toast("Erro ao carregar perguntas", "error");
        return;
    }

    if (!perguntas || perguntas.length === 0) {
        document.getElementById("perguntasContainer").innerHTML =
            '<div class="empty-state">Nenhuma pergunta cadastrada. Crie perguntas primeiro!</div>';
        return;
    }

    for (const p of perguntas) {
        const { data: alternativas } = await supabaseClient
            .from("alternativa")
            .select("*")
            .eq("id_pergunta", p.id_pergunta)
            .order("id_alternativa");
        p.alternativas = alternativas || [];
    }

    todasPerguntas = perguntas;
    aplicarFiltro();
}

function aplicarFiltro() {
    const materia = document.getElementById("materia").value;
    const conteudo = document.getElementById("conteudo").value;

    const filtradas = todasPerguntas.filter(p => {
        if (materia && p.id_materia != materia) return false;
        if (conteudo && p.id_conteudo != conteudo) return false;
        return true;
    });

    renderizarPerguntas(filtradas);
}

function renderizarPerguntas(perguntas) {
    const container = document.getElementById("perguntasContainer");
    const countLabel = document.getElementById("perguntasCount");

    countLabel.textContent = `${perguntas.length} pergunta${perguntas.length !== 1 ? 's' : ''}`;

    if (perguntas.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma pergunta encontrada para este filtro</div>';
        return;
    }

    container.innerHTML = '';

    perguntas.forEach((p) => {
        const card = document.createElement("div");
        card.className = "pergunta-card";
        card.dataset.id = p.id_pergunta;

        const materiaNome = p.materia?.nome_materia || "Sem matéria";
        const conteudoNome = p.conteudo?.nome_conteudo || "Sem conteúdo";

        let alternativasHtml = '';
        p.alternativas.forEach((alt, i) => {
            const letra = String.fromCharCode(65 + i);
            const correta = alt.correta
                ? ' <span class="correta-badge">✓ Correta</span>'
                : '';
            alternativasHtml +=
                `<div class="alt-item">${letra}) ${alt.nome_alternativa}${correta}</div>`;
        });

        card.innerHTML = `
            <div class="card-checkbox">
                <input type="checkbox" class="pergunta-checkbox" value="${p.id_pergunta}">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <span class="materia-badge">${materiaNome}</span>
                    <span class="conteudo-badge">${conteudoNome}</span>
                </div>
                <div class="card-pergunta ql-editor">${p.pergunta_texto}</div>
                <div class="card-alternativas">${alternativasHtml}</div>
            </div>
        `;

        const checkbox = card.querySelector(".pergunta-checkbox");
        checkbox.addEventListener("change", () => {
            card.classList.toggle("selected", checkbox.checked);
        });

        container.appendChild(card);
    });
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function gerarHTMLProva(perguntas, titulo) {
    let html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>${titulo} - PontuaAI</title>
    <style>
        *{ margin:0; padding:0; box-sizing:border-box; }
        body{ font-family:Arial,Helvetica,sans-serif; color:#222; line-height:1.5; padding:40px 30px; background:#fff; }
        .p-brand{ text-align:center; font-size:9pt; color:#888; margin-bottom:6pt; }
        .p-title{ text-transform:uppercase; font-size:20pt; margin-bottom:2pt; }
        .p-subtitle{ font-size:11pt; color:#666; margin-bottom:8pt; }
        .p-divider{ border:none; border-top:1.5pt solid #222; margin-bottom:12pt; }
        .p-name{ font-size:11pt; color:#555; margin-bottom:16pt; }
        .p-question{ margin-bottom:14pt; }
        .p-text{ font-size:12pt; line-height:1.7; text-align:justify; }
        .p-text img{ max-width:100%; display:block; margin:8px 0; }
        .p-alts{ margin-left:24pt; margin-top:6pt; }
        .p-alt{ margin:3pt 0; font-size:11pt; line-height:1.5; color:#333; }
        .p-footer{ margin-top:24pt; text-align:center; font-size:9pt; color:#999; border-top:0.5pt solid #ddd; padding-top:8pt; }
        @media print{ @page{ margin:25mm 20mm 25mm 30mm; } body{ padding:0; } }
    </style>
</head>
<body>
    <div class="p-brand">PontuaAI</div>
    <div class="p-title">Prova</div>
    <div class="p-subtitle">${titulo}</div>
    <hr class="p-divider">
    <div class="p-name">Nome: ________________________________________</div>`;

    perguntas.forEach((p, idx) => {
        const numero = (idx + 1) + '. ';
        const textoNumerado = p.pergunta_texto.replace(/^<(\w+)([^>]*)>/, '<$1$2>' + numero);

        html += `<div class="p-question"><div class="p-text">${textoNumerado}</div><div class="p-alts">`;
        p.alternativas.forEach((alt, j) => {
            const letra = String.fromCharCode(65 + j);
            html += `<div class="p-alt">${letra}) ${alt.nome_alternativa}</div>`;
        });
        html += `</div></div>`;
    });

    html += `<div class="p-footer">Gerado por PontuaAI</div></body></html>`;
    return html;
}

function mostrarResultadoProvas(versoes) {
    const existing = document.getElementById('resultadoProvas');
    if (existing) existing.remove();

    const box = document.createElement('div');
    box.id = 'resultadoProvas';
    box.className = 'resultado-provas';
    box.innerHTML = `
        <p class="resultado-texto">Provas criadas, clique para visualizar</p>
        <div class="resultado-botoes">
            <button class="btn-modelo" data-modelo="0">Modelo 1</button>
            <button class="btn-modelo" data-modelo="1">Modelo 2</button>
            <button class="btn-modelo" data-modelo="2">Modelo 3</button>
        </div>
    `;

    box.querySelectorAll('.btn-modelo').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = parseInt(btn.dataset.modelo);
            const perguntas = ultimasProvasGeradas[i];
            if (!perguntas) return;

            const html = gerarHTMLProva(perguntas, `Modelo ${i + 1}`);
            const win = window.open('', '_blank');
            if (!win) {
                toast("Pop-up bloqueado. Permita pop-ups.", "error");
                return;
            }
            win.document.write(html);
            win.document.close();
            setTimeout(() => { win.focus(); win.print(); }, 500);
        });
    });

    const container = document.querySelector('.criarProvaContainer');
    container.parentNode.insertBefore(box, container.nextSibling);
    box.scrollIntoView({ behavior: 'smooth' });
}

async function criarProva() {
    const checkboxes = document.querySelectorAll('.pergunta-checkbox:checked');
    if (checkboxes.length === 0) {
        toast("Selecione pelo menos uma pergunta!", "error");
        return;
    }

    const idsSelecionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const perguntasSelecionadas = todasPerguntas.filter(p =>
        idsSelecionados.includes(p.id_pergunta)
    );

    if (perguntasSelecionadas.length === 0) {
        toast("Nenhuma pergunta encontrada", "error");
        return;
    }

    ultimasProvasGeradas = [
        shuffleArray(perguntasSelecionadas),
        shuffleArray(perguntasSelecionadas),
        shuffleArray(perguntasSelecionadas)
    ];

    mostrarResultadoProvas(ultimasProvasGeradas);
    toast("3 provas geradas com sucesso!", "success");
}

carregarMaterias();
carregarPerguntas();

document.getElementById("materia").addEventListener("change", async function () {
    await carregarConteudos(this.value);
    aplicarFiltro();
});

document.getElementById("conteudo").addEventListener("change", aplicarFiltro);

document.getElementById("btnCriarProva").addEventListener("click", criarProva);

document.getElementById("selectAll").addEventListener("change", () => {
    const checked = document.getElementById("selectAll").checked;
    document.querySelectorAll(".pergunta-checkbox").forEach(cb => {
        cb.checked = checked;
        cb.closest(".pergunta-card")?.classList.toggle("selected", checked);
    });
});
