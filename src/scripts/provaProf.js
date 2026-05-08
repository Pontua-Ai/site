import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let todasPerguntas = [];

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

function montarHtmlProva(perguntas, titulo) {
    let html = `
        <div style="font-family: Arial, 'Helvetica Neue', sans-serif; padding: 30px 40px; width: 750px; background: white; color: #222;">
            <div style="text-align: center; margin-bottom: 8px;">
                <span style="font-size: 12px; color: #888;">PontuaAI</span>
            </div>
            <h1 style="text-align: center; font-size: 26px; margin: 0 0 4px 0; color: #000; text-transform: uppercase; letter-spacing: 2px;">Prova</h1>
            <p style="text-align: center; font-size: 13px; color: #666; margin: 0 0 20px 0;">${titulo}</p>
            <hr style="border: none; border-top: 2px solid #222; margin-bottom: 30px;">
            <div style="margin-bottom: 20px;">
                <span style="font-size: 13px; color: #555;">Nome: ________________________________________</span>
            </div>
    `;

    perguntas.forEach((p, i) => {
        html += `
            <div style="margin-bottom: 28px; page-break-inside: avoid;">
                <div style="font-weight: bold; font-size: 15px; margin-bottom: 10px; color: #000;">
                    ${i + 1}. ${p.pergunta_texto}
                </div>
                <div style="margin-left: 24px;">
        `;

        p.alternativas.forEach((alt, j) => {
            const letra = String.fromCharCode(65 + j);
            html += `<div style="margin: 4px 0; font-size: 14px; line-height: 1.5; color: #333;">${letra}) ${alt.nome_alternativa}</div>`;
        });

        html += `</div></div>`;
    });

    html += `
            <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #999;">
                Gerado por PontuaAI
            </div>
        </div>
    `;

    return html;
}

async function gerarPDF(perguntas, index) {
    const btn = document.getElementById("btnCriarProva");
    btn.textContent = `Gerando PDF ${index}/3...`;

    if (typeof html2canvas === 'undefined') {
        throw new Error("Biblioteca html2canvas não carregada");
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error("Biblioteca jsPDF não carregada");
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = montarHtmlProva(perguntas, `Modelo ${index}`);
    tempDiv.style.cssText = "width: 830px; background: white; margin: 0 auto;";
    const main = document.querySelector("main");
    main.parentNode.insertBefore(tempDiv, main.nextSibling);

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            backgroundColor: '#ffffff'
        });

        if (!canvas || canvas.width === 0 || canvas.height === 0) {
            throw new Error(`Canvas vazio (${canvas?.width}x${canvas?.height})`);
        }

        toast(`Canvas gerado: ${canvas.width}x${canvas.height}`, "default");

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        let heightLeft = pdfHeight - pageHeight;

        while (heightLeft > 0) {
            position -= pageHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`prova-modelo-${index}.pdf`);
    } finally {
        document.body.removeChild(tempDiv);
    }
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

    const btn = document.getElementById("btnCriarProva");
    btn.disabled = true;
    btn.textContent = "Gerando 3 PDFs...";

    try {
        const versao1 = shuffleArray(perguntasSelecionadas);
        const versao2 = shuffleArray(perguntasSelecionadas);
        const versao3 = shuffleArray(perguntasSelecionadas);

        await gerarPDF(versao1, 1);
        await gerarPDF(versao2, 2);
        await gerarPDF(versao3, 3);

        toast("3 PDFs gerados com sucesso!", "success");
    } catch (error) {
        console.error("Erro ao gerar PDFs:", error);
        toast("Erro ao gerar PDFs. Verifique o console.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Criar Prova";
    }
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
