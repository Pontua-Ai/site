import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let botoesConfigurados = false;

function configurarBotoes() { 
    const container = document.getElementById("historicoContainer");
    if (!container || botoesConfigurados) return;
    botoesConfigurados = true;
    // Excluir pergunta
    container.addEventListener('click', async (e) => { 
        const btnLixo = e.target.closest('.lixo');
        if (btnLixo) {
            const idPergunta = btnLixo.dataset.id;
            const card = btnLixo.closest('.cardBox');

            if (confirm("Tem certeza que deseja excluir esta pergunta?")) {
                const { data: alternativas } = await supabaseClient
                    .from("alternativa")
                    .select("id_alternativa")
                    .eq("id_pergunta", idPergunta);

                const idsAlternativas = alternativas?.map(a => a.id_alternativa) || [];

                if (idsAlternativas.length > 0) {
                    const { error: errorPont } = await supabaseClient
                        .from("pontuacao_atividade")
                        .delete()
                        .in("id_alternativa", idsAlternativas);

                    if (errorPont) {
                        toast("Erro ao excluir pontuações", "error");
                        return;
                    }
                }

                const { error: errorAlt } = await supabaseClient
                    .from("alternativa")
                    .delete()
                    .eq("id_pergunta", idPergunta);

                if (errorAlt) {
                    toast("Erro ao excluir alternativas", "error");
                    return;
                }

                const { error: errorPerg } = await supabaseClient
                    .from("perguntas")
                    .delete()
                    .eq("id_pergunta", idPergunta);

                if (errorPerg) {
                    toast("Erro ao excluir pergunta", "error");
                    return;
                }

                card.remove();

                if (container.children.length === 0) {
                    container.innerHTML = '<div class="cardBox"><p>Nenhuma pergunta encontrada</p></div>';
                }

                toast("Pergunta excluída com sucesso!", "success");
            }
            return;
        }
        // Editar pergunta
        const btnEditar = e.target.closest('.editar');
        if (btnEditar) {
            window.location.href = "perguntas_prof.html?editar=" + btnEditar.dataset.id;
        }
    });
}

export async function carregarHistorico() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado || userLogado.tipo_conta !== 'professor') {
        window.location.href = "inicio.html";
        return;
    }
    //materia
    const container = document.getElementById("historicoContainer");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const filterMateria = params.get("materia");
    const filterConteudo = params.get("conteudo");

    const { data: perguntas, error } = await supabaseClient
        .from("perguntas")
        .select("*, materia(nome_materia), conteudo(nome_conteudo)")
        .eq("id_usuario", userLogado.id_usuario)
        .order("id_pergunta", { ascending: false });

    let perguntasFiltradas = perguntas;
    if (filterMateria || filterConteudo) {
        perguntasFiltradas = (perguntas || []).filter(p => {
            const matchMateria = !filterMateria || p.materia?.nome_materia === filterMateria;
            const matchConteudo = !filterConteudo || p.conteudo?.nome_conteudo === filterConteudo;
            return matchMateria && matchConteudo;
        });
    }

    if (error || !perguntasFiltradas || perguntasFiltradas.length === 0) {
        container.innerHTML = '<div class="cardBox"><p>Nenhuma pergunta encontrada</p></div>';
        return;
    }

    if (filterMateria || filterConteudo) {
        const filterInfo = document.createElement("div");
        filterInfo.className = "filter-info";
        filterInfo.style.cssText = "padding: 10px 20px; margin-bottom: 10px; background: var(--primary-color); color: white; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;";
        let filterText = "Filtro: ";
        if (filterMateria) filterText += filterMateria;
        if (filterConteudo) filterText += (filterMateria ? " - " : "") + filterConteudo;
        filterInfo.innerHTML = `
            <span>${filterText} (${perguntasFiltradas.length} pergunta${perguntasFiltradas.length > 1 ? 's' : ''})</span>
            <a href="historico_prof.html" style="color: white; text-decoration: underline; cursor: pointer;">Limpar filtro</a>
        `;
        container.parentNode.insertBefore(filterInfo, container);
    }

    container.innerHTML = '<div class="empty-state" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:60px 20px;color:var(--text-gray)"><span class="loading-spinner"></span> Carregando perguntas...</div>';
    let primeiraRenderizada = false;

    for (const pergunta of perguntasFiltradas) {
        const { data: alternativas } = await supabaseClient
            .from("alternativa")
            .select("id_alternativa, correta, nome_alternativa")
            .eq("id_pergunta", pergunta.id_pergunta)
            .order("id_alternativa", { ascending: true });

        const idAlternativas = alternativas?.map(a => a.id_alternativa) || [];
        
        let acertos = 0;
        let respostas = 0;

        if (idAlternativas.length > 0) {
            const { data: pontuacoes } = await supabaseClient
                .from("pontuacao_atividade")
                .select("pontos_atividade")
                .in("id_alternativa", idAlternativas);
            
            respostas = pontuacoes?.length || 0;
            acertos = pontuacoes?.filter(p => p.pontos_atividade === 1).length || 0;
        }

        const materiaNome = pergunta.materia?.nome_materia || "Matéria";
        const conteudoNome = pergunta.conteudo?.nome_conteudo || "Conteúdo";

        const textoCompletoHtml = pergunta.pergunta_texto || "";
        const textoPlano = textoCompletoHtml.replace(/<[^>]*>/g, "");
        const textoResumido = textoPlano.length > 150 ? textoPlano.substring(0, 150) + "..." : textoCompletoHtml;
        const temMaisTexto = textoPlano.length > 150;

        const dataPergunta = pergunta.data_pergunta
            ? new Date(pergunta.data_pergunta).toLocaleDateString("pt-BR")
            : "";

        const div = document.createElement("div");
        div.className = "cardBox";
        div.innerHTML = `
            <div class="mainBox mainBoxTop">
                <span class="materia-badge">${materiaNome}</span>
                <span class="conteudo-badge">${conteudoNome}</span>
                ${dataPergunta ? `<span class="data-info"><i class="fa-regular fa-calendar"></i> ${dataPergunta}</span>` : ''}
                <div class="botoesAcoes">
                    ${temMaisTexto ? `<button class="visualizar" title="Ver pergunta completa"><i class="fa-regular fa-eye"></i></button>` : ''}
                    <button class="editar" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="lixo" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>
            <div class="headerBox">
                <p class="texto-enunciado">${textoResumido}</p>
            </div>
            <div class="mainBox">
                <p>${respostas} respostas | ${respostas > 0 ? Math.round((acertos / respostas) * 100) : 0}% de acertos</p>
            </div>
        `;

        const btnVisualizar = div.querySelector(".visualizar");
        if (btnVisualizar) {
            const pEnunciado = div.querySelector(".texto-enunciado");
            btnVisualizar.addEventListener("click", () => {
                const expandido = btnVisualizar.classList.toggle("expandido");
                pEnunciado.innerHTML = expandido ? textoCompletoHtml : textoResumido;
                pEnunciado.classList.toggle("texto-completo", expandido);
                btnVisualizar.querySelector("i").className = expandido ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
            });
        }

        if (!primeiraRenderizada) {
            container.innerHTML = '';
            primeiraRenderizada = true;
        }
        container.appendChild(div);
    }

    configurarBotoes();
}
