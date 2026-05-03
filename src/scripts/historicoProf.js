import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";

let botoesConfigurados = false;

function configurarBotoes() {
    const container = document.getElementById("historicoContainer");
    if (!container || botoesConfigurados) return;
    botoesConfigurados = true;

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

        const btnMudar = e.target.closest('.mudar');
        if (!btnMudar) return;

        const idPergunta = btnMudar.dataset.id;
        const card = btnMudar.closest('.cardBox');
        const h4 = card.querySelector('.headerBox h4');
        const alternativasDivs = card.querySelectorAll('.alternativasBox div');

        if (h4.querySelector('input')) return;

        const textoOriginal = h4.textContent;
        h4.innerHTML = `<input type="text" class="input-pergunta" value="${textoOriginal}" style="width: 100%; border: 1px solid var(--primary-color); padding: 4px; border-radius: 4px; background: var(--bg-color); color: var(--text-color);">`;
        const inputPergunta = h4.querySelector('.input-pergunta');
        inputPergunta.focus();

        const idsAlternativas = [];
        alternativasDivs.forEach((div, i) => {
            const textoLimpo = div.textContent.replace(/\(Correta\)/g, '').replace(/^[A-E]\)\s*/, '').trim();
            const idAlt = div.dataset.id || null;
            if (idAlt) idsAlternativas.push(idAlt);
            div.innerHTML = `<input type="text" class="input-alt" data-index="${i}" data-id="${idAlt}" value="${textoLimpo}" style="width: 100%; border: 1px solid var(--primary-color); padding: 4px; border-radius: 4px; background: var(--bg-color); color: var(--text-color);">`;
        });

        let salvando = false;

        async function salvarAlteracoes() {
            if (salvando) return;
            salvando = true;

            const novoTexto = inputPergunta.value.trim();
            if (!novoTexto) {
                carregarHistorico();
                return;
            }

            let mudouAlgo = false;

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
                mudouAlgo = true;
            }

            const inputsAlt = card.querySelectorAll('.input-alt');
            for (const input of inputsAlt) {
                const idAlt = input.dataset.id;
                const novoTextoAlt = input.value.trim();
                if (idAlt && novoTextoAlt && novoTextoAlt !== input.defaultValue) {
                    const { error } = await supabaseClient
                        .from("alternativa")
                        .update({ nome_alternativa: novoTextoAlt })
                        .eq("id_alternativa", idAlt);

                    if (!error) mudouAlgo = true;
                }
            }

            if (mudouAlgo) {
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

    const container = document.getElementById("historicoContainer");
    if (!container) return;

    const { data: perguntas, error } = await supabaseClient
        .from("perguntas")
        .select("*, materia(nome_materia), conteudo(nome_conteudo)")
        .eq("id_usuario", userLogado.id_usuario)
        .order("id_pergunta", { ascending: false });

    if (error || !perguntas || perguntas.length === 0) {
        container.innerHTML = '<div class="cardBox"><p>Nenhuma pergunta encontrada</p></div>';
        return;
    }

    container.innerHTML = '';

    for (const pergunta of perguntas) {
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
        
        const textoPergunta = pergunta.pergunta_texto.replace(/<[^>]*>/g, "");
        
        let alternativasHtml = '';
        if (alternativas && alternativas.length > 0) {
            alternativas.forEach((alt, index) => {
                const letra = String.fromCharCode(65 + index);
                const correta = alt.correta ? ' <span style="color: green; font-weight: bold;">(Correta)</span>' : '';
                alternativasHtml += `<div data-id="${alt.id_alternativa}">${letra}) ${alt.nome_alternativa}${correta}</div>`;
            });
        }

        const div = document.createElement("div");
        div.className = "cardBox";
        div.innerHTML = `
            <div class="headerBox">
                <h4>${textoPergunta}</h4>
                <div class="botoesAcoes">
                    <button class="lixo" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-trash-can"></i></button>
                    <button class="mudar" data-id="${pergunta.id_pergunta}"><i class="fa-regular fa-pen-to-square"></i></button>
                </div>
            </div>
            <div class="alternativasBox" style="margin: 10px 0;">
                ${alternativasHtml}
            </div>
            <div class="mainBox">
                <p>${materiaNome} - ${conteudoNome}</p>
                <p>${respostas} respostas | ${respostas > 0 ? Math.round((acertos / respostas) * 100) : 0}% de acertos</p>
            </div>
        `;
        container.appendChild(div);
    }

    configurarBotoes();
}
