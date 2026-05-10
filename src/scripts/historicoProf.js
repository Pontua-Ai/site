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
        const btnMudar = e.target.closest('.mudar');
        if (!btnMudar) return;

        const idPergunta = btnMudar.dataset.id;
        const card = btnMudar.closest('.cardBox');
        const p = card.querySelector('.headerBox p');

        if (p.querySelector('input')) return;

        const textoOriginal = p.textContent;
        p.innerHTML = `<input type="text" class="input-pergunta" value="${textoOriginal}" style="width: 100%; border: 1px solid var(--primary-color); padding: 4px; border-radius: 4px; background: var(--bg-color); color: var(--text-color);">`;
        const inputPergunta = p.querySelector('.input-pergunta');
        inputPergunta.focus();

        let salvando = false;

        async function salvarAlteracoes() { 
            if (salvando) return;
            salvando = true;

            const novoTexto = inputPergunta.value.trim();
            if (!novoTexto) {
                carregarHistorico();
                return;
            }

            if (novoTexto !== textoOriginal) {
                const { error } = await supabaseClient
                    .from("perguntas")
                    .update({ pergunta_texto: novoTexto })
                    .eq("id_pergunta", idPergunta);

                if (error) {
                    toast("Erro ao atualizar pergunta", "error");
                    carregarHistorico();
                    return;
                }
                toast("Atualizado com sucesso!", "success");
            }

            carregarHistorico();
            salvando = false;
        }

        card.querySelectorAll('input').forEach((input) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') salvarAlteracoes();
                if (e.key === 'Escape') carregarHistorico();
            });
        });

        card.addEventListener('focusout', (e) => {
            if (!card.contains(e.relatedTarget)) {
                salvarAlteracoes();
            }
        });
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

    container.innerHTML = '';

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
        
        let textoPergunta = pergunta.pergunta_texto.replace(/<[^>]*>/g, "");
        if (textoPergunta.length > 150) {
            textoPergunta = textoPergunta.substring(0, 150) + "...";
        }

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
                    <button class="visualizar" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-eye"></i></button>
                    <button class="mudar" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="lixo" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </div>
            <div class="headerBox">
                <p class="texto-enunciado">${textoPergunta}</p>
            </div>
            <div class="mainBox">
                <p>${respostas} respostas | ${respostas > 0 ? Math.round((acertos / respostas) * 100) : 0}% de acertos</p>
            </div>
        `;
        container.appendChild(div);
    }

    configurarBotoes();
}
