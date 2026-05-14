import supabaseClient from "./supabase.js";
import { toast } from "./utils.js";
import { config } from "./config.js";

const state = {
    passo: 'start',
    dados: {
        materia: null,
        materiaObj: null,
        conteudo: null,
        conteudoObj: null,
        enunciado: '',
        alternativas: [],
        correta: null,
        visibilidade: null,
    },
    questoes: [],
    materiaNova: false
};

let chatContainer = null;
let chatMessages = null;
let chatInput = null;
let chatSend = null;
let chatToggle = null;
let chatPanel = null;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function levenshteinDistance(a, b) {
    const an = a.length, bn = b.length;
    const matrix = [];
    for (let i = 0; i <= an; i++) {
        matrix[i] = [i];
        for (let j = 1; j <= bn; j++) {
            if (i === 0) { matrix[i][j] = j; continue; }
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[an][bn];
}

function buscarSugestao(texto, lista, campo) {
    const norm = normalizar(texto);
    let melhor = null;
    let menorDist = Infinity;
    for (const item of lista) {
        const nome = normalizar(item[campo]);
        const dist = levenshteinDistance(norm, nome);
        if (dist < menorDist) {
            menorDist = dist;
            melhor = item;
        }
    }
    if (melhor && menorDist <= 3) {
        return { sugestao: melhor, distancia: menorDist };
    }
    return null;
}

function addMessage(text, type = 'bot') {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg ${type}`;
    msg.innerHTML = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
}

function addBotOptions(options, onClick) {
    const container = document.createElement('div');
    container.className = 'msg-options';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'msg-option';
        btn.textContent = opt.label;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.msg-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            onClick(opt.value);
        });
        container.appendChild(btn);
    });
    return container;
}

function addConfirmButtons(msgEl, onYes, onNo) {
    const div = document.createElement('div');
    div.className = 'chatbot-confirm';
    const yes = document.createElement('button');
    yes.className = 'btn-yes';
    yes.textContent = 'Sim';
    yes.addEventListener('click', onYes);
    const no = document.createElement('button');
    no.className = 'btn-no';
    no.textContent = 'Não';
    no.addEventListener('click', onNo);
    div.appendChild(yes);
    div.appendChild(no);
    msgEl.appendChild(div);
}

function addInputGroup(msgEl, fields, onSubmit) {
    const group = document.createElement('div');
    group.className = 'msg-input-group';
    const inputs = {};
    fields.forEach(f => {
        if (f.type === 'textarea') {
            const ta = document.createElement('textarea');
            ta.placeholder = f.placeholder || '';
            ta.style.minHeight = f.minHeight || '60px';
            group.appendChild(ta);
            inputs[f.key] = ta;
        } else {
            const inp = document.createElement('input');
            inp.type = f.type || 'text';
            inp.placeholder = f.placeholder || '';
            group.appendChild(inp);
            inputs[f.key] = inp;
        }
    });
    const btn = document.createElement('button');
    btn.textContent = 'Enviar';
    btn.addEventListener('click', () => {
        const values = {};
        Object.keys(inputs).forEach(k => {
            values[k] = inputs[k].value.trim();
        });
        onSubmit(values);
    });
    group.appendChild(btn);
    msgEl.appendChild(group);
    return inputs;
}

function showChat() {
    if (!chatPanel) return;
    chatPanel.classList.add('open');
    chatToggle.classList.add('open');
    chatToggle.innerHTML = '✕';
    chatInput.focus();
    if (state.passo === 'done') {
        setTimeout(() => startConversation(), 300);
    }
}

function hideChat() {
    if (!chatPanel) return;
    chatPanel.classList.remove('open');
    chatToggle.classList.remove('open');
    chatToggle.innerHTML = '💬';
}

function toggleChat() {
    if (chatPanel.classList.contains('open')) {
        hideChat();
    } else {
        showChat();
    }
}

function setInputEnabled(enabled) {
    chatInput.disabled = !enabled;
    chatSend.disabled = !enabled;
    if (enabled) {
        chatInput.focus();
    }
}

function sendMessage(text) {
    if (!text.trim()) return;
    addMessage(escapeHtml(text), 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    processUserInput(text.trim());
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem("userLogado"));
    return user?.id_usuario || null;
}

async function getMateriasOcultasIds() {
    const userId = getUserId();
    if (!userId) return [];
    const { data } = await supabaseClient
        .from("materia_oculta")
        .select("id_materia")
        .eq("id_usuario", userId);
    return (data || []).map(o => o.id_materia);
}

async function getConteudosOcultosIds() {
    const userId = getUserId();
    if (!userId) return [];
    const { data: ocultos } = await supabaseClient
        .from("conteudo_oculto")
        .select("id_conteudo")
        .eq("id_usuario", userId);
    const idsConteudos = (ocultos || []).map(o => o.id_conteudo);
    const { data: materiasOcultas } = await supabaseClient
        .from("materia_oculta")
        .select("id_materia")
        .eq("id_usuario", userId);
    const idsMateriasOcultas = (materiasOcultas || []).map(m => m.id_materia);
    if (idsMateriasOcultas.length > 0) {
        const { data: conteudosDasMaterias } = await supabaseClient
            .from("conteudo")
            .select("id_conteudo")
            .in("id_materia", idsMateriasOcultas);
        if (conteudosDasMaterias) {
            conteudosDasMaterias.forEach(c => {
                if (!idsConteudos.includes(c.id_conteudo)) {
                    idsConteudos.push(c.id_conteudo);
                }
            });
        }
    }
    return idsConteudos;
}

async function buscarMateria(nome) {
    const userId = getUserId();
    const nomes = nome.trim();
    const idsOcultas = await getMateriasOcultasIds();
    let query = supabaseClient
        .from("materia")
        .select("id_materia, nome_materia")
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`)
        .ilike("nome_materia", nomes);
    if (idsOcultas.length > 0) {
        query = query.not('id_materia', 'in', `(${idsOcultas.join(',')})`);
    }
    const { data: exato } = await query.maybeSingle();
    if (exato) return exato;

    let query2 = supabaseClient
        .from("materia")
        .select("id_materia, nome_materia")
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
    if (idsOcultas.length > 0) {
        query2 = query2.not('id_materia', 'in', `(${idsOcultas.join(',')})`);
    }
    const { data: todas } = await query2;

    if (!todas) return null;

    const normalizado = normalizar(nomes);
    return todas.find(m => normalizar(m.nome_materia) === normalizado) || null;
}

async function buscarConteudo(nome, idMateria) {
    const userId = getUserId();
    const nomes = nome.trim();
    const idsOcultos = await getConteudosOcultosIds();
    let query = supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria)
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`)
        .ilike("nome_conteudo", nomes);
    if (idsOcultos.length > 0) {
        query = query.not('id_conteudo', 'in', `(${idsOcultos.join(',')})`);
    }
    const { data: exato } = await query.maybeSingle();
    if (exato) return exato;

    let query2 = supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria)
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
    if (idsOcultos.length > 0) {
        query2 = query2.not('id_conteudo', 'in', `(${idsOcultos.join(',')})`);
    }
    const { data: todos } = await query2;

    if (!todos) return null;

    const normalizado = normalizar(nomes);
    return todos.find(c => normalizar(c.nome_conteudo) === normalizado) || null;
}

async function criarMateria(nome) {
    const userId = getUserId();
    const { data, error } = await supabaseClient
        .from("materia")
        .insert([{ nome_materia: nome.trim(), id_usuario: userId }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function criarConteudo(nome, idMateria) {
    const userId = getUserId();
    const { data, error } = await supabaseClient
        .from("conteudo")
        .insert([{ nome_conteudo: nome.trim(), id_materia: idMateria, id_usuario: userId }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function criarPergunta() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado) {
        toast("Usuário não logado", "error");
        return null;
    }

    const { data: pergunta, error } = await supabaseClient
        .from("perguntas")
        .insert([{
            pergunta_texto: state.dados.enunciado,
            id_conteudo: state.dados.conteudoObj.id_conteudo,
            id_materia: state.dados.materiaObj.id_materia,
            id_usuario: userLogado.id_usuario,
            visibilidade: state.dados.visibilidade || "publico"
        }])
        .select()
        .single();

    if (error) {
        toast("Erro ao criar pergunta: " + error.message, "error");
        return null;
    }

    for (let i = 0; i < state.dados.alternativas.length; i++) {
        const { error: altError } = await supabaseClient
            .from("alternativa")
            .insert([{
                nome_alternativa: state.dados.alternativas[i],
                id_pergunta: pergunta.id_pergunta,
                correta: (i + 1) === state.dados.correta
            }]);
        if (altError) {
            toast("Erro ao criar alternativa: " + altError.message, "error");
            return null;
        }
    }

    return pergunta;
}

async function processUserInput(texto) {
    const lower = texto.toLowerCase();

    if (lower === 'cancelar' || lower === 'voltar' || lower === 'menu') {
        state.passo = 'start';
        state.dados = { materia: null, materiaObj: null, conteudo: null, conteudoObj: null, enunciado: '', alternativas: [], correta: null, visibilidade: null };
        setTimeout(() => startConversation(), 300);
        return;
    }

    switch (state.passo) {
        case 'await_materia': {
            const msg = addMessage('Verificando matéria...', 'loading');
            const materia = await buscarMateria(texto);
            msg.remove();

            if (materia) {
                state.dados.materia = materia.nome_materia;
                state.dados.materiaObj = materia;
                addMessage(`Encontrei a matéria <strong>${escapeHtml(materia.nome_materia)}</strong>! ✅`);
                setTimeout(() => perguntarConteudo(), 600);
            } else {
                const userId = getUserId();
                const idsOcultasM = await getMateriasOcultasIds();
                let qMaterias = supabaseClient
                    .from("materia")
                    .select("id_materia, nome_materia")
                    .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
                if (idsOcultasM.length > 0) {
                    qMaterias = qMaterias.not('id_materia', 'in', `(${idsOcultasM.join(',')})`);
                }
                const { data: todasMaterias } = await qMaterias;
                const sugestao = todasMaterias ? buscarSugestao(texto, todasMaterias, 'nome_materia') : null;

                if (sugestao) {
                    const nomeSugerido = sugestao.sugestao.nome_materia;
                    const m = addMessage(`Você quis dizer <strong>${escapeHtml(nomeSugerido)}</strong>?`);
                    addConfirmButtons(m,
                        () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            state.dados.materia = nomeSugerido;
                            state.dados.materiaObj = sugestao.sugestao;
                            addMessage(`Matéria <strong>${escapeHtml(nomeSugerido)}</strong>! ✅`);
                            setTimeout(() => perguntarConteudo(), 600);
                        },
                        () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            const m2 = addMessage(`Matéria <strong>${escapeHtml(texto)}</strong> não encontrada. Deseja criar?`);
                            addConfirmButtons(m2,
                                async () => {
                                    m2.querySelector('.chatbot-confirm')?.remove();
                                    const loading = addMessage('Criando matéria...', 'loading');
                                    try {
                                        const nova = await criarMateria(texto);
                                        loading.remove();
                                        state.dados.materia = nova.nome_materia;
                                        state.dados.materiaObj = nova;
                                        state.materiaNova = true;
                                        addMessage(`Matéria <strong>${escapeHtml(nova.nome_materia)}</strong> criada com sucesso! ✅`);
                                        setTimeout(() => perguntarConteudo(), 600);
                                    } catch (e) {
                                        loading.remove();
                                        addMessage(`Erro ao criar matéria: ${e.message}`, 'system');
                                        setTimeout(() => perguntarMateria(), 600);
                                    }
                                },
                                () => {
                                    m2.querySelector('.chatbot-confirm')?.remove();
                                    addMessage('OK, digite outra matéria:');
                                }
                            );
                        }
                    );
                } else {
                    const m = addMessage(`Matéria <strong>${escapeHtml(texto)}</strong> não encontrada. Deseja criar?`);
                    addConfirmButtons(m,
                        async () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            const loading = addMessage('Criando matéria...', 'loading');
                            try {
                                const nova = await criarMateria(texto);
                                loading.remove();
                                state.dados.materia = nova.nome_materia;
                                state.dados.materiaObj = nova;
                                state.materiaNova = true;
                                addMessage(`Matéria <strong>${escapeHtml(nova.nome_materia)}</strong> criada com sucesso! ✅`);
                                setTimeout(() => perguntarConteudo(), 600);
                            } catch (e) {
                                loading.remove();
                                addMessage(`Erro ao criar matéria: ${e.message}`, 'system');
                                setTimeout(() => perguntarMateria(), 600);
                            }
                        },
                        () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            addMessage('OK, digite outra matéria:');
                        }
                    );
                }
            }
            break;
        }

        case 'await_conteudo': {
            if (state.materiaNova) {
                state.materiaNova = false;
                const loading = addMessage('Criando conteúdo...', 'loading');
                try {
                    const novo = await criarConteudo(texto, state.dados.materiaObj.id_materia);
                    loading.remove();
                    state.dados.conteudo = novo.nome_conteudo;
                    state.dados.conteudoObj = novo;
                    addMessage(`Conteúdo <strong>${escapeHtml(novo.nome_conteudo)}</strong> criado com sucesso! ✅`);
                    setTimeout(() => perguntarEnunciado(), 600);
                } catch (e) {
                    loading.remove();
                    addMessage(`Erro ao criar conteúdo: ${e.message}`, 'system');
                    setTimeout(() => perguntarConteudo(), 600);
                }
                break;
            }
            const msg = addMessage('Verificando conteúdo...', 'loading');
            const conteudo = await buscarConteudo(texto, state.dados.materiaObj.id_materia);
            msg.remove();

            if (conteudo) {
                state.dados.conteudo = conteudo.nome_conteudo;
                state.dados.conteudoObj = conteudo;
                addMessage(`Encontrei o conteúdo <strong>${escapeHtml(conteudo.nome_conteudo)}</strong>! ✅`);
                setTimeout(() => perguntarEnunciado(), 600);
            } else {
                const userId = getUserId();
                const idsOcultosC = await getConteudosOcultosIds();
                let qConteudos = supabaseClient
                    .from("conteudo")
                    .select("id_conteudo, nome_conteudo")
                    .eq("id_materia", state.dados.materiaObj.id_materia)
                    .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
                if (idsOcultosC.length > 0) {
                    qConteudos = qConteudos.not('id_conteudo', 'in', `(${idsOcultosC.join(',')})`);
                }
                const { data: todosConteudos } = await qConteudos;
                const sugestao = todosConteudos ? buscarSugestao(texto, todosConteudos, 'nome_conteudo') : null;

                if (sugestao) {
                    const nomeSugerido = sugestao.sugestao.nome_conteudo;
                    const m = addMessage(`Você quis dizer <strong>${escapeHtml(nomeSugerido)}</strong>?`);
                    addConfirmButtons(m,
                        () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            state.dados.conteudo = nomeSugerido;
                            state.dados.conteudoObj = sugestao.sugestao;
                            addMessage(`Conteúdo <strong>${escapeHtml(nomeSugerido)}</strong>! ✅`);
                            setTimeout(() => perguntarEnunciado(), 600);
                        },
                        () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            const m2 = addMessage(`Conteúdo <strong>${escapeHtml(texto)}</strong> não encontrado. Deseja criar?`);
                            addConfirmButtons(m2,
                                async () => {
                                    m2.querySelector('.chatbot-confirm')?.remove();
                                    const loading = addMessage('Criando conteúdo...', 'loading');
                                    try {
                                        const novo = await criarConteudo(texto, state.dados.materiaObj.id_materia);
                                        loading.remove();
                                        state.dados.conteudo = novo.nome_conteudo;
                                        state.dados.conteudoObj = novo;
                                        addMessage(`Conteúdo <strong>${escapeHtml(novo.nome_conteudo)}</strong> criado com sucesso! ✅`);
                                        setTimeout(() => perguntarEnunciado(), 600);
                                    } catch (e) {
                                        loading.remove();
                                        addMessage(`Erro ao criar conteúdo: ${e.message}`, 'system');
                                        setTimeout(() => perguntarConteudo(), 600);
                                    }
                                },
                                () => {
                                    m2.querySelector('.chatbot-confirm')?.remove();
                                    addMessage('OK, digite outro conteúdo:');
                                }
                            );
                        }
                    );
                } else {
                    const m = addMessage(`Conteúdo <strong>${escapeHtml(texto)}</strong> não encontrado. Deseja criar?`);
                    addConfirmButtons(m,
                        async () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            const loading = addMessage('Criando conteúdo...', 'loading');
                            try {
                                const novo = await criarConteudo(texto, state.dados.materiaObj.id_materia);
                                loading.remove();
                                state.dados.conteudo = novo.nome_conteudo;
                                state.dados.conteudoObj = novo;
                                addMessage(`Conteúdo <strong>${escapeHtml(novo.nome_conteudo)}</strong> criado com sucesso! ✅`);
                                setTimeout(() => perguntarEnunciado(), 600);
                            } catch (e) {
                                loading.remove();
                                addMessage(`Erro ao criar conteúdo: ${e.message}`, 'system');
                                setTimeout(() => perguntarConteudo(), 600);
                            }
                        },
                        () => {
                            m.querySelector('.chatbot-confirm')?.remove();
                            addMessage('OK, digite outro conteúdo:');
                        }
                    );
                }
            }
            break;
        }

        case 'await_enunciado': {
            if (texto.length < 5) {
                addMessage('O enunciado precisa ter pelo menos 5 caracteres. Digite novamente:');
                return;
            }
            state.dados.enunciado = texto;
            setInputEnabled(false);
            addMessage('Enunciado salvo! ✅');
            setTimeout(() => perguntarAlternativas(), 400);
            break;
        }

        case 'await_alternativas': {
            const linhas = texto.split('\n').filter(l => l.trim());
            if (linhas.length < 2) {
                addMessage('Digite pelo menos 2 alternativas (uma por linha):');
                return;
            }
            if (linhas.length > 6) {
                addMessage('Máximo de 6 alternativas. Digite novamente:');
                return;
            }
            state.dados.alternativas = linhas.map(l => l.trim());
            setInputEnabled(false);
            addMessage(`${linhas.length} alternativas salvas! ✅`);
            setTimeout(() => perguntarCorreta(), 400);
            break;
        }

        case 'await_correta': {
            const num = parseInt(texto);
            if (isNaN(num) || num < 1 || num > state.dados.alternativas.length) {
                addMessage(`Digite um número entre 1 e ${state.dados.alternativas.length}:`);
                return;
            }
            state.dados.correta = num;
            setInputEnabled(false);
            addMessage(`Alternativa correta: <strong>${num}</strong> ✅`);
            setTimeout(() => perguntarVisibilidade(), 400);
            break;
        }

        case 'await_visibilidade': {
            const lower = texto.toLowerCase();
            if (lower === 'publico' || lower === 'pública' || lower === 'publica' || lower === '1') {
                state.dados.visibilidade = 'publico';
            } else if (lower === 'privado' || lower === 'privada' || lower === '2') {
                state.dados.visibilidade = 'privado';
            } else {
                addMessage('Digite <strong>1</strong> para Público ou <strong>2</strong> para Privado:');
                return;
            }
            setInputEnabled(false);
            const label = state.dados.visibilidade === 'publico' ? 'Público' : 'Privado';
            addMessage(`Visibilidade: <strong>${label}</strong> ✅`);
            setTimeout(() => mostrarResumo(), 400);
            break;
        }

        case 'await_outro':
            await processarOutro(texto);
            break;

        case 'upload_await_materia':
            await uploadFinalizarMateria(texto);
            break;

        case 'upload_await_conteudo':
            await uploadFinalizarConteudo(texto);
            break;

        default:
            addMessage('Não entendi. Use as opções acima ou digite algo.', 'system');
    }
}

function perguntarMateria() {
    if (state.dados.materiaObj) {
        setTimeout(() => perguntarConteudo(), 200);
        return;
    }
    state.passo = 'await_materia';
    setInputEnabled(true);
    addMessage('📚 Qual a <strong>matéria</strong> da pergunta? (ex: Matemática, Português...)');
}

function perguntarConteudo() {
    if (state.dados.conteudoObj) {
        setTimeout(() => perguntarEnunciado(), 200);
        return;
    }
    state.passo = 'await_conteudo';
    setInputEnabled(true);
    addMessage(`📖 Qual o <strong>conteúdo</strong> dentro de <strong>${escapeHtml(state.dados.materia)}</strong>? (ex: Álgebra, Fonética...)`);
}

function perguntarEnunciado() {
    if (state.dados.enunciado) {
        setTimeout(() => perguntarAlternativas(), 200);
        return;
    }
    state.passo = 'await_enunciado';
    setInputEnabled(true);
    addMessage('✏️ Digite o <strong>enunciado</strong> da pergunta:');
}

function perguntarAlternativas() {
    if (state.dados.alternativas.length >= 2) {
        setTimeout(() => perguntarCorreta(), 200);
        return;
    }
    state.passo = 'await_alternativas';
    setInputEnabled(true);
    addMessage('📝 Digite as <strong>alternativas</strong> (uma por linha, mínimo 2, máximo 6):');
    addMessage('Exemplo:<br><br>Nenhuma das alternativas<br>Todas as alternativas<br>Apenas I e II<br>Apenas II e III');
}

function perguntarCorreta() {
    if (state.dados.correta) {
        setTimeout(() => perguntarVisibilidade(), 200);
        return;
    }
    state.passo = 'await_correta';
    setInputEnabled(true);
    let html = '✅ Qual é a <strong>alternativa correta</strong>? Digite o número:<br><br>';
    state.dados.alternativas.forEach((alt, i) => {
        html += `<strong>${i + 1}.</strong> ${escapeHtml(alt)}<br>`;
    });
    addMessage(html);
}

function perguntarVisibilidade() {
    if (state.dados.visibilidade) {
        setTimeout(() => mostrarResumo(), 200);
        return;
    }
    state.passo = 'await_visibilidade';
    setInputEnabled(true);
    addMessage('👁️ As perguntas serão <strong>Públicas</strong> ou <strong>Privadas</strong>?<br><br>1 - Público (todos podem ver)<br>2 - Privado (só você vê)');
}

function mostrarResumo() {
    let html = '📋 <strong>Prévia da pergunta:</strong><br><br>';
    html += `<div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;padding:14px;margin-bottom:10px">`;
    html += `<div style="font-size:11px;color:var(--text-gray);margin-bottom:6px">
        <strong>${escapeHtml(state.dados.materia)}</strong> &middot; ${escapeHtml(state.dados.conteudo)}
    </div>`;
    html += `<div style="font-size:14px;line-height:1.6;margin-bottom:10px">${escapeHtml(state.dados.enunciado)}</div>`;
    state.dados.alternativas.forEach((alt, i) => {
        const letra = String.fromCharCode(65 + i);
        const isCorreta = (i + 1) === state.dados.correta;
        const bg = isCorreta ? 'rgba(76, 175, 80, 0.1)' : 'var(--gray)';
        const border = isCorreta ? '1.5px solid var(--success-color)' : '1.5px solid transparent';
        html += `<div style="padding:8px 12px;margin:4px 0;border-radius:8px;background:${bg};border:${border};font-size:13px">
            <strong>${letra}.</strong> ${escapeHtml(alt)} ${isCorreta ? '✅' : ''}
        </div>`;
    });
    html += `</div>`;
    html += 'Tudo certo? Deseja <strong>cadastrar</strong>?';

    const msg = addMessage(html);
    addConfirmButtons(msg,
        async () => {
            msg.querySelector('.chatbot-confirm')?.remove();
            const loading = addMessage('Cadastrando pergunta...', 'loading');
            try {
                const pergunta = await criarPergunta();
                loading.remove();
                if (pergunta) {
                    addMessage('✅ <strong>Pergunta cadastrada com sucesso!</strong>');
                    toast("Pergunta criada pelo assistente!", "success");
                    setTimeout(() => perguntarNova(), 800);
                } else {
                    addMessage('Erro ao cadastrar. Tente novamente.', 'system');
                    setTimeout(() => startConversation(), 600);
                }
            } catch (e) {
                loading.remove();
                addMessage(`Erro: ${e.message}`, 'system');
                setTimeout(() => startConversation(), 600);
            }
        },
        () => {
            msg.querySelector('.chatbot-confirm')?.remove();
            addMessage('OK, vamos recomeçar!');
            setTimeout(() => startConversation(), 400);
        }
    );
}

function perguntarNova() {
    const msg = addMessage('Deseja <strong>criar outra pergunta</strong>?');
    addConfirmButtons(msg,
        () => {
            msg.querySelector('.chatbot-confirm')?.remove();
            state.dados = { materia: null, materiaObj: null, conteudo: null, conteudoObj: null, enunciado: '', alternativas: [], correta: null, visibilidade: null };
            setTimeout(() => perguntarMateria(), 400);
        },
        () => {
            msg.querySelector('.chatbot-confirm')?.remove();
            addMessage('OK! Se precisar, é só clicar no 💬 novamente. 😊', 'bot');
            state.passo = 'done';
            setInputEnabled(false);
        }
    );
}

async function processarOutro(texto) {
    const lower = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const userId = getUserId();
    const idsOcultasM = await getMateriasOcultasIds();
    const idsOcultosC = await getConteudosOcultosIds();

    if (lower.includes('conteudo')) {
        let qConteudos = supabaseClient
            .from("conteudo")
            .select("id_conteudo, nome_conteudo, id_materia")
            .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
        if (idsOcultosC.length > 0) {
            qConteudos = qConteudos.not('id_conteudo', 'in', `(${idsOcultosC.join(',')})`);
        }
        const { data: conteudos } = await qConteudos;
        if (!conteudos || conteudos.length === 0) {
            addMessage('Nenhum conteúdo cadastrado.');
        } else {
            let qMaterias = supabaseClient
                .from("materia")
                .select("id_materia, nome_materia")
                .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
            if (idsOcultasM.length > 0) {
                qMaterias = qMaterias.not('id_materia', 'in', `(${idsOcultasM.join(',')})`);
            }
            const { data: materias } = await qMaterias;
            const mapMaterias = {};
            if (materias) materias.forEach(m => mapMaterias[m.id_materia] = m.nome_materia);
            const nomes = conteudos.map(c => {
                const materiaNome = mapMaterias[c.id_materia] || 'Sem matéria';
                return `${escapeHtml(c.nome_conteudo)} (${escapeHtml(materiaNome)})`;
            }).join(', ');
            addMessage(`📖 <strong>Conteúdos disponíveis:</strong> ${nomes}`);
        }
        setTimeout(() => perguntarVoltarMenu(), 1200);
        return;
    }

    if (lower.includes('lista') || lower.includes('listar') || lower.includes('quai') || lower.includes('mostra') || lower.includes('materia')) {
        let qMaterias = supabaseClient
            .from("materia")
            .select("id_materia, nome_materia")
            .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
        if (idsOcultasM.length > 0) {
            qMaterias = qMaterias.not('id_materia', 'in', `(${idsOcultasM.join(',')})`);
        }
        const { data: materias } = await qMaterias;
        if (!materias || materias.length === 0) {
            addMessage('Nenhuma matéria cadastrada.');
        } else {
            const nomes = materias.map(m => m.nome_materia).join(', ');
            addMessage(`📚 <strong>Matérias disponíveis:</strong> ${escapeHtml(nomes)}`);
        }
        setTimeout(() => perguntarVoltarMenu(), 1200);
        return;
    }

    if (lower === 'voltar' || lower === 'menu' || lower === 'cancelar') {
        setTimeout(() => startConversation(), 300);
        return;
    }

    addMessage('Não entendi. Pode tentar de outro jeito? 😅<br><small>Digite <strong>menu</strong> para voltar ao início.</small>');
    state.passo = 'await_outro';
    setInputEnabled(true);
}

function perguntarVoltarMenu() {
    const conf = addMessage('Deseja voltar ao menu principal?');
    addConfirmButtons(conf,
        () => {
            conf.querySelector('.chatbot-confirm')?.remove();
            setTimeout(() => startConversation(), 300);
        },
        () => {
            conf.querySelector('.chatbot-confirm')?.remove();
            addMessage('OK! Digite algo ou <strong>menu</strong> para voltar.');
            state.passo = 'await_outro';
            setInputEnabled(true);
        }
    );
}

function startConversation() {
    state.passo = 'start';

    const msg = addMessage(`
        <strong>🐨 Olá! Sou o assistente do PontuaAI!</strong><br><br>
        Vou te ajudar com tudo que precisar. Escolha uma opção:
    `);

    const options = addBotOptions([
        { label: '📝 Cadastrar pergunta', value: 'cadastrar' },
        { label: '🙈 Ocultar', value: 'ocultar' },
        { label: '👁️ Visualizar', value: 'visualizar' },
        { label: '💬 Outro', value: 'outro' },
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        switch (value) {
            case 'cadastrar':
                mostrarOpcoesCadastro();
                break;
            case 'ocultar':
                mostrarOpcoesOcultar();
                break;
            case 'visualizar':
                mostrarOpcoesVisualizar();
                break;
            case 'outro':
                iniciarOutro();
                break;
        }
    });
    msg.appendChild(options);
}

function mostrarOpcoesCadastro() {
    const msg = addMessage('Como você quer cadastrar a pergunta?');
    const options = addBotOptions([
        { label: '✏️ Digitar manualmente', value: 'manual' },
        { label: '📄 Enviar arquivo Word', value: 'upload' },
        { label: '⬅️ Voltar', value: 'voltar' },
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => startConversation(), 300);
        } else if (value === 'upload') {
            startUploadFlow();
        } else {
            setTimeout(() => perguntarMateria(), 400);
        }
    });
    msg.appendChild(options);
}

function mostrarOpcoesOcultar() {
    const msg = addMessage('O que você quer ocultar?');
    const options = addBotOptions([
        { label: '🙈 Ocultar matéria', value: 'materia' },
        { label: '🙈 Ocultar conteúdo', value: 'conteudo' },
        { label: '⬅️ Voltar', value: 'voltar' },
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => startConversation(), 300);
        } else if (value === 'materia') {
            iniciarOcultarMateria();
        } else {
            iniciarOcultarConteudo();
        }
    });
    msg.appendChild(options);
}

function mostrarOpcoesVisualizar() {
    const msg = addMessage('O que você quer visualizar?');
    const options = addBotOptions([
        { label: '👁️ Matérias ocultas', value: 'materias' },
        { label: '👁️ Conteúdos ocultos', value: 'conteudos' },
        { label: '⬅️ Voltar', value: 'voltar' },
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => startConversation(), 300);
        } else if (value === 'materias') {
            visualizarMateriasOcultas();
        } else {
            visualizarConteudosOcultos();
        }
    });
    msg.appendChild(options);
}

async function visualizarMateriasOcultas() {
    const userId = getUserId();
    const { data: ocultas } = await supabaseClient
        .from("materia_oculta")
        .select("id_materia, id_usuario")
        .eq("id_usuario", userId);
    if (!ocultas || ocultas.length === 0) {
        addMessage('Nenhuma matéria oculta.');
        setTimeout(() => startConversation(), 1500);
        return;
    }
    const ids = ocultas.map(o => o.id_materia);
    const { data: materias } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia")
        .in("id_materia", ids);
    if (!materias || materias.length === 0) {
        addMessage('Nenhuma matéria oculta.');
        setTimeout(() => startConversation(), 1500);
        return;
    }
    const msg = addMessage('Matérias ocultas — clique para reexibir:');
    const options = addBotOptions([
        ...materias.map(m => ({ label: m.nome_materia, value: String(m.id_materia) })),
        { label: '⬅️ Voltar', value: 'voltar' }
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => mostrarOpcoesVisualizar(), 300);
            return;
        }
        const materia = materias.find(m => String(m.id_materia) === value);
        const conf = addMessage(`Reexibir <strong>${escapeHtml(materia.nome_materia)}</strong>?`);
        addConfirmButtons(conf,
            async () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                const load = addMessage('Reexibindo...', 'loading');
                try {
                    await supabaseClient.from("materia_oculta").delete().eq("id_materia", materia.id_materia).eq("id_usuario", userId);
                    const { data: conteudos } = await supabaseClient
                        .from("conteudo")
                        .select("id_conteudo")
                        .eq("id_materia", materia.id_materia);
                    if (conteudos && conteudos.length > 0) {
                        const idsC = conteudos.map(c => c.id_conteudo);
                        await supabaseClient.from("conteudo_oculto").delete().in("id_conteudo", idsC).eq("id_usuario", userId);
                    }
                    load.remove();
                    addMessage(`👁️ <strong>${escapeHtml(materia.nome_materia)}</strong> e seus conteúdos reexibidos!`);
                    toast("Matéria reexibida!", "success");
                    setTimeout(() => startConversation(), 1500);
                } catch (e) {
                    load.remove();
                    addMessage(`Erro: ${e.message}`, 'system');
                    setTimeout(() => startConversation(), 1500);
                }
            },
            () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                addMessage('OK, cancelado.');
                setTimeout(() => visualizarMateriasOcultas(), 500);
            }
        );
    });
    msg.appendChild(options);
}

async function visualizarConteudosOcultos() {
    const userId = getUserId();
    const { data: ocultos } = await supabaseClient
        .from("conteudo_oculto")
        .select("id_conteudo")
        .eq("id_usuario", userId);
    if (!ocultos || ocultos.length === 0) {
        addMessage('Nenhum conteúdo oculto.');
        setTimeout(() => startConversation(), 1500);
        return;
    }
    const ids = ocultos.map(o => o.id_conteudo);
    const { data: conteudos } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo, id_materia")
        .in("id_conteudo", ids);
    if (!conteudos || conteudos.length === 0) {
        addMessage('Nenhum conteúdo oculto.');
        setTimeout(() => startConversation(), 1500);
        return;
    }
    const { data: materias } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia");
    const mapMaterias = {};
    if (materias) materias.forEach(m => mapMaterias[m.id_materia] = m.nome_materia);

    const msg = addMessage('Conteúdos ocultos — clique para reexibir:');
    const options = addBotOptions([
        ...conteudos.map(c => ({
            label: `${c.nome_conteudo} (${mapMaterias[c.id_materia] || '?'})`,
            value: String(c.id_conteudo)
        })),
        { label: '⬅️ Voltar', value: 'voltar' }
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => mostrarOpcoesVisualizar(), 300);
            return;
        }
        const conteudo = conteudos.find(c => String(c.id_conteudo) === value);
        const conf = addMessage(`Reexibir <strong>${escapeHtml(conteudo.nome_conteudo)}</strong>?`);
        addConfirmButtons(conf,
            async () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                const load = addMessage('Reexibindo...', 'loading');
                try {
                    await supabaseClient.from("conteudo_oculto").delete().eq("id_conteudo", conteudo.id_conteudo).eq("id_usuario", userId);
                    load.remove();
                    addMessage(`👁️ <strong>${escapeHtml(conteudo.nome_conteudo)}</strong> reexibido!`);
                    toast("Conteúdo reexibido!", "success");
                    setTimeout(() => startConversation(), 1500);
                } catch (e) {
                    load.remove();
                    addMessage(`Erro: ${e.message}`, 'system');
                    setTimeout(() => startConversation(), 1500);
                }
            },
            () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                addMessage('OK, cancelado.');
                setTimeout(() => visualizarConteudosOcultos(), 500);
            }
        );
    });
    msg.appendChild(options);
}

async function iniciarOcultarMateria() {
    const userId = getUserId();
    const { data: ocultas } = await supabaseClient
        .from("materia_oculta")
        .select("id_materia")
        .eq("id_usuario", userId);
    const idsOcultas = (ocultas || []).map(o => o.id_materia);

    let query = supabaseClient
        .from("materia")
        .select("id_materia, nome_materia")
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
    if (idsOcultas.length > 0) {
        query = query.not('id_materia', 'in', `(${idsOcultas.join(',')})`);
    }
    const { data: materias } = await query;

    if (!materias || materias.length === 0) {
        addMessage('Nenhuma matéria disponível para ocultar.');
        setTimeout(() => startConversation(), 1500);
        return;
    }

    const msg = addMessage('Qual matéria você quer ocultar da sua conta?');
    const options = addBotOptions([
        ...materias.map(m => ({ label: m.nome_materia, value: String(m.id_materia) })),
        { label: '⬅️ Voltar', value: 'voltar' }
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => startConversation(), 300);
            return;
        }
        const materia = materias.find(m => String(m.id_materia) === value);
        const conf = addMessage(`Ocultar <strong>${escapeHtml(materia.nome_materia)}</strong> da sua conta?`);
        addConfirmButtons(conf,
            async () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                const load = addMessage('Ocultando matéria...', 'loading');
                try {
                    await supabaseClient.from("materia_oculta").insert({ id_materia: materia.id_materia, id_usuario: userId });
                    const { data: conteudos } = await supabaseClient
                        .from("conteudo")
                        .select("id_conteudo")
                        .eq("id_materia", materia.id_materia);
                    if (conteudos && conteudos.length > 0) {
                        await supabaseClient.from("conteudo_oculto").insert(
                            conteudos.map(c => ({ id_conteudo: c.id_conteudo, id_usuario: userId }))
                        );
                    }
                    load.remove();
                    addMessage(`🙈 Matéria <strong>${escapeHtml(materia.nome_materia)}</strong> e seus conteúdos ocultados da sua conta!`);
                    toast("Matéria e conteúdos ocultados!", "success");
                    setTimeout(() => startConversation(), 1500);
                } catch (e) {
                    load.remove();
                    addMessage(`Erro: ${e.message}`, 'system');
                    setTimeout(() => startConversation(), 1500);
                }
            },
            () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                addMessage('OK, cancelado.');
                setTimeout(() => startConversation(), 1000);
            }
        );
    });
    msg.appendChild(options);
}

async function iniciarOcultarConteudo() {
    const userId = getUserId();
    const { data: ocultos } = await supabaseClient
        .from("conteudo_oculto")
        .select("id_conteudo")
        .eq("id_usuario", userId);
    const idsOcultos = (ocultos || []).map(o => o.id_conteudo);

    let query = supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo, id_materia")
        .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
    if (idsOcultos.length > 0) {
        query = query.not('id_conteudo', 'in', `(${idsOcultos.join(',')})`);
    }
    const { data: conteudos } = await query;

    if (!conteudos || conteudos.length === 0) {
        addMessage('Nenhum conteúdo disponível para ocultar.');
        setTimeout(() => startConversation(), 1500);
        return;
    }

    const { data: materias } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia");
    const mapMaterias = {};
    if (materias) materias.forEach(m => mapMaterias[m.id_materia] = m.nome_materia);

    const msg = addMessage('Qual conteúdo você quer ocultar da sua conta?');
    const options = addBotOptions([
        ...conteudos.map(c => ({
            label: `${c.nome_conteudo} (${mapMaterias[c.id_materia] || '?'})`,
            value: String(c.id_conteudo)
        })),
        { label: '⬅️ Voltar', value: 'voltar' }
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'voltar') {
            setTimeout(() => startConversation(), 300);
            return;
        }
        const conteudo = conteudos.find(c => String(c.id_conteudo) === value);
        const materiaNome = mapMaterias[conteudo.id_materia] || '?';
        const conf = addMessage(`Ocultar <strong>${escapeHtml(conteudo.nome_conteudo)}</strong> (${escapeHtml(materiaNome)}) da sua conta?`);
        addConfirmButtons(conf,
            async () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                const load = addMessage('Ocultando conteúdo...', 'loading');
                try {
                    await supabaseClient.from("conteudo_oculto").insert({ id_conteudo: conteudo.id_conteudo, id_usuario: userId });
                    load.remove();
                    addMessage(`🙈 Conteúdo <strong>${escapeHtml(conteudo.nome_conteudo)}</strong> ocultado da sua conta!`);
                    toast("Conteúdo ocultado!", "success");
                    setTimeout(() => startConversation(), 1500);
                } catch (e) {
                    load.remove();
                    addMessage(`Erro: ${e.message}`, 'system');
                    setTimeout(() => startConversation(), 1500);
                }
            },
            () => {
                conf.querySelector('.chatbot-confirm')?.remove();
                addMessage('OK, cancelado.');
                setTimeout(() => startConversation(), 1000);
            }
        );
    });
    msg.appendChild(options);
}

async function iniciarOutro() {
    state.passo = 'await_outro';
    setInputEnabled(true);
    addMessage('Pode perguntar! Tento ajudar com o que precisar. 😊<br><small>Ex: "liste as matérias", "quais conteúdos têm", etc.</small>');
}

function resetState() {
    state.passo = 'start';
    state.dados = { materia: null, materiaObj: null, conteudo: null, conteudoObj: null, enunciado: '', alternativas: [], correta: null, visibilidade: null };
    state.questoes = [];
}

function startUploadFlow() {
    state.questoes = [];
    addMessage('📄 Ótimo! Primeiro, me diga a <strong>matéria</strong> dessas questões:');
    state.passo = 'upload_await_materia';
    setInputEnabled(true);
}

async function uploadFinalizarMateria(texto) {
    const msg = addMessage('Verificando matéria...', 'loading');
    const materia = await buscarMateria(texto);
    msg.remove();

    if (materia) {
        state.dados.materia = materia.nome_materia;
        state.dados.materiaObj = materia;
        addMessage(`Matéria: <strong>${escapeHtml(materia.nome_materia)}</strong> ✅`);
        setTimeout(() => uploadPerguntarConteudo(), 500);
    } else {
        const userId = getUserId();
        const idsOcultasM = await getMateriasOcultasIds();
        let qMaterias = supabaseClient
            .from("materia")
            .select("id_materia, nome_materia")
            .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
        if (idsOcultasM.length > 0) {
            qMaterias = qMaterias.not('id_materia', 'in', `(${idsOcultasM.join(',')})`);
        }
        const { data: todasMaterias } = await qMaterias;
        const sugestao = todasMaterias ? buscarSugestao(texto, todasMaterias, 'nome_materia') : null;

        if (sugestao) {
            const nomeSugerido = sugestao.sugestao.nome_materia;
            const m = addMessage(`Você quis dizer <strong>${escapeHtml(nomeSugerido)}</strong>?`);
            addConfirmButtons(m,
                () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    state.dados.materia = nomeSugerido;
                    state.dados.materiaObj = sugestao.sugestao;
                    addMessage(`Matéria: <strong>${escapeHtml(nomeSugerido)}</strong> ✅`);
                    setTimeout(() => uploadPerguntarConteudo(), 500);
                },
                () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    const m2 = addMessage(`Matéria <strong>${escapeHtml(texto)}</strong> não encontrada. Deseja criar?`);
                    addConfirmButtons(m2,
                        async () => {
                            m2.querySelector('.chatbot-confirm')?.remove();
                            const loading = addMessage('Criando matéria...', 'loading');
                            try {
                                        const nova = await criarMateria(texto);
                                        loading.remove();
                                        state.dados.materia = nova.nome_materia;
                                        state.dados.materiaObj = nova;
                                        state.materiaNova = true;
                                        addMessage(`Matéria <strong>${escapeHtml(nova.nome_materia)}</strong> criada! ✅`);
                                        setTimeout(() => uploadPerguntarConteudo(), 500);
                            } catch (e) {
                                loading.remove();
                                addMessage(`Erro: ${e.message}`, 'system');
                                setTimeout(() => startUploadFlow(), 600);
                            }
                        },
                        () => {
                            m2.querySelector('.chatbot-confirm')?.remove();
                            addMessage('OK, digite outra matéria:');
                        }
                    );
                }
            );
        } else {
            const m = addMessage(`Matéria <strong>${escapeHtml(texto)}</strong> não encontrada. Deseja criar?`);
            addConfirmButtons(m,
                async () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    const loading = addMessage('Criando matéria...', 'loading');
                    try {
                        const nova = await criarMateria(texto);
                        loading.remove();
                        state.dados.materia = nova.nome_materia;
                        state.dados.materiaObj = nova;
                        state.materiaNova = true;
                        addMessage(`Matéria <strong>${escapeHtml(nova.nome_materia)}</strong> criada! ✅`);
                        setTimeout(() => uploadPerguntarConteudo(), 500);
                    } catch (e) {
                        loading.remove();
                        addMessage(`Erro: ${e.message}`, 'system');
                        setTimeout(() => startUploadFlow(), 600);
                    }
                },
                () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    addMessage('OK, digite outra matéria:');
                }
            );
        }
    }
}

function uploadPerguntarConteudo() {
    addMessage(`📖 Agora, qual o <strong>conteúdo</strong> dentro de ${escapeHtml(state.dados.materia)}?`);
    state.passo = 'upload_await_conteudo';
    setInputEnabled(true);
}

async function uploadFinalizarConteudo(texto) {
    if (state.materiaNova) {
        state.materiaNova = false;
        const loading = addMessage('Criando conteúdo...', 'loading');
        try {
            const novo = await criarConteudo(texto, state.dados.materiaObj.id_materia);
            loading.remove();
            state.dados.conteudo = novo.nome_conteudo;
            state.dados.conteudoObj = novo;
            addMessage(`Conteúdo <strong>${escapeHtml(novo.nome_conteudo)}</strong> criado! ✅`);
            setTimeout(() => uploadMostrarArea(), 500);
        } catch (e) {
            loading.remove();
            addMessage(`Erro: ${e.message}`, 'system');
            setTimeout(() => uploadPerguntarConteudo(), 600);
        }
        return;
    }
    const msg = addMessage('Verificando conteúdo...', 'loading');
    const conteudo = await buscarConteudo(texto, state.dados.materiaObj.id_materia);
    msg.remove();

    if (conteudo) {
        state.dados.conteudo = conteudo.nome_conteudo;
        state.dados.conteudoObj = conteudo;
        addMessage(`Conteúdo: <strong>${escapeHtml(conteudo.nome_conteudo)}</strong> ✅`);
        setTimeout(() => uploadMostrarArea(), 500);
    } else {
        const userId = getUserId();
        const idsOcultosC = await getConteudosOcultosIds();
        let qConteudos = supabaseClient
            .from("conteudo")
            .select("id_conteudo, nome_conteudo")
            .eq("id_materia", state.dados.materiaObj.id_materia)
            .or(`id_usuario.is.null,id_usuario.eq.${userId}`);
        if (idsOcultosC.length > 0) {
            qConteudos = qConteudos.not('id_conteudo', 'in', `(${idsOcultosC.join(',')})`);
        }
        const { data: todosConteudos } = await qConteudos;
        const sugestao = todosConteudos ? buscarSugestao(texto, todosConteudos, 'nome_conteudo') : null;

        if (sugestao) {
            const nomeSugerido = sugestao.sugestao.nome_conteudo;
            const m = addMessage(`Você quis dizer <strong>${escapeHtml(nomeSugerido)}</strong>?`);
            addConfirmButtons(m,
                () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    state.dados.conteudo = nomeSugerido;
                    state.dados.conteudoObj = sugestao.sugestao;
                    addMessage(`Conteúdo: <strong>${escapeHtml(nomeSugerido)}</strong> ✅`);
                    setTimeout(() => uploadMostrarArea(), 500);
                },
                () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    const m2 = addMessage(`Conteúdo <strong>${escapeHtml(texto)}</strong> não encontrado. Deseja criar?`);
                    addConfirmButtons(m2,
                        async () => {
                            m2.querySelector('.chatbot-confirm')?.remove();
                            const loading = addMessage('Criando conteúdo...', 'loading');
                            try {
                                const novo = await criarConteudo(texto, state.dados.materiaObj.id_materia);
                                loading.remove();
                                state.dados.conteudo = novo.nome_conteudo;
                                state.dados.conteudoObj = novo;
                                addMessage(`Conteúdo <strong>${escapeHtml(novo.nome_conteudo)}</strong> criado! ✅`);
                                setTimeout(() => uploadMostrarArea(), 500);
                            } catch (e) {
                                loading.remove();
                                addMessage(`Erro: ${e.message}`, 'system');
                                setTimeout(() => uploadPerguntarConteudo(), 600);
                            }
                        },
                        () => {
                            m2.querySelector('.chatbot-confirm')?.remove();
                            addMessage('OK, digite outro conteúdo:');
                        }
                    );
                }
            );
        } else {
            const m = addMessage(`Conteúdo <strong>${escapeHtml(texto)}</strong> não encontrado. Deseja criar?`);
            addConfirmButtons(m,
                async () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    const loading = addMessage('Criando conteúdo...', 'loading');
                    try {
                        const novo = await criarConteudo(texto, state.dados.materiaObj.id_materia);
                        loading.remove();
                        state.dados.conteudo = novo.nome_conteudo;
                        state.dados.conteudoObj = novo;
                        addMessage(`Conteúdo <strong>${escapeHtml(novo.nome_conteudo)}</strong> criado! ✅`);
                        setTimeout(() => uploadMostrarArea(), 500);
                    } catch (e) {
                        loading.remove();
                        addMessage(`Erro: ${e.message}`, 'system');
                        setTimeout(() => uploadPerguntarConteudo(), 600);
                    }
                },
                () => {
                    m.querySelector('.chatbot-confirm')?.remove();
                    addMessage('OK, digite outro conteúdo:');
                }
            );
        }
    }
}

function uploadMostrarArea() {
    state.passo = 'await_file';
    setInputEnabled(false);
    addMessage(`📤 <strong>Tudo pronto!</strong> Matéria: ${escapeHtml(state.dados.materia)} · Conteúdo: ${escapeHtml(state.dados.conteudo)}<br><br>Agora envie o arquivo .docx com as questões.`);
    addMessage(`<small>Formatos reconhecidos: "1. texto", "Questão 1: texto", "a) alt", "I. alt", "a) alt | b) alt". Gabarito pode vir como "Resposta: B" ou "Gabarito: 2".</small>`, 'system');

    const msg = addMessage(`
        <div class="chatbot-upload-area" id="chatUploadArea">
            <i class="fa-regular fa-file-word"></i>
            <span>Clique para selecionar ou arraste o arquivo .docx</span>
            <input type="file" accept=".docx,.doc" id="fileInputInline" style="display:none">
        </div>
    `);

    const area = msg.querySelector('#chatUploadArea');
    const inlineInput = msg.querySelector('#fileInputInline');

    if (area && inlineInput) {
        area.addEventListener('click', (e) => { e.stopPropagation(); inlineInput.click(); });
        inlineInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            addMessage(`📎 <strong>${escapeHtml(file.name)}</strong> selecionado. Processando...`, 'system');
            await processarDocumentoMulti(file);
            inlineInput.value = '';
        });
        area.addEventListener('dragover', (e) => { e.preventDefault(); area.style.borderColor = 'var(--primary-color)'; area.style.background = 'rgba(11, 147, 149, 0.06)'; });
        area.addEventListener('dragleave', () => { area.style.borderColor = ''; area.style.background = ''; });
        area.addEventListener('drop', async (e) => {
            e.preventDefault();
            area.style.borderColor = '';
            area.style.background = '';
            const file = e.dataTransfer.files[0];
            if (!file || !file.name.toLowerCase().endsWith('.docx')) { addMessage('⚠️ Apenas .docx.', 'system'); return; }
            addMessage(`📎 <strong>${escapeHtml(file.name)}</strong> selecionado. Processando...`, 'system');
            await processarDocumentoMulti(file);
        });
    }
}

function extrairPngDeWmf(base64Data) {
    try {
        const raw = atob(base64Data);
        const sig = '\x89PNG\r\n\x1a\n';
        const start = raw.indexOf(sig);
        if (start === -1) return null;
        const iend = raw.lastIndexOf('IEND');
        if (iend === -1) return null;
        const pngRaw = raw.substring(start, iend + 8);
        return 'data:image/png;base64,' + btoa(pngRaw);
    } catch { return null; }
}

function tentarSalvarJSON(texto) {
    try {
        const inicio = texto.indexOf('[');
        if (inicio === -1) return null;
        const candidato = texto.substring(inicio);

        const objetos = [];
        let profundidade = 0;
        let objInicio = -1;
        for (let i = 0; i < candidato.length; i++) {
            const ch = candidato[i];
            if (ch === '{') {
                if (profundidade === 0) objInicio = i;
                profundidade++;
            } else if (ch === '}') {
                profundidade--;
                if (profundidade === 0 && objInicio !== -1) {
                    try {
                        const obj = JSON.parse(candidato.substring(objInicio, i + 1));
                        if (obj.enunciado && Array.isArray(obj.alternativas) && obj.alternativas.length >= 2) {
                            objetos.push(obj);
                        }
                    } catch { }
                    objInicio = -1;
                }
            }
        }
        return objetos.length > 0 ? objetos : null;
    } catch { return null; }
}

function htmlParaMarcadores(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    function inserirQuebras(node) {
        const filhos = Array.from(node.childNodes);
        for (let i = 0; i < filhos.length; i++) {
            const child = filhos[i];
            if (child.nodeType !== 1) continue;
            const tag = child.tagName.toLowerCase();
            if (['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'img'].includes(tag)) {
                if (tag === 'br') {
                    node.insertBefore(document.createTextNode('\n'), child);
                    node.insertBefore(document.createTextNode('\n'), child.nextSibling);
                } else {
                    node.insertBefore(document.createTextNode('\n'), child);
                    if (child.nextSibling) {
                        node.insertBefore(document.createTextNode('\n'), child.nextSibling);
                    }
                }
            }
            inserirQuebras(child);
        }
    }
    inserirQuebras(temp);

    function walk(node) {
        const filhos = Array.from(node.childNodes);
        for (const child of filhos) {
            if (child.nodeType !== 1) continue;
            const tag = child.tagName.toLowerCase();
            const inner = child.innerHTML;
            if (tag === 'strong' || tag === 'b') {
                child.innerHTML = `〖B〗${inner}〖/B〗`;
            } else if (tag === 'em' || tag === 'i') {
                child.innerHTML = `〖I〗${inner}〖/I〗`;
            } else if (tag === 'u') {
                child.innerHTML = `〖U〗${inner}〖/U〗`;
            } else if (tag === 'sub') {
                child.innerHTML = `〖SUB〗${inner}〖/SUB〗`;
            } else if (tag === 'sup') {
                child.innerHTML = `〖SUP〗${inner}〖/SUP〗`;
            }
            walk(child);
        }
    }
    walk(temp);
    return temp.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

function marcadoresParaHtml(texto) {
    return texto
        .replace(/〖B〗([\s\S]*?)〖\/B〗/g, '<strong>$1</strong>')
        .replace(/〖I〗([\s\S]*?)〖\/I〗/g, '<em>$1</em>')
        .replace(/〖U〗([\s\S]*?)〖\/U〗/g, '<u>$1</u>')
        .replace(/〖SUB〗([\s\S]*?)〖\/SUB〗/g, '<sub>$1</sub>')
        .replace(/〖SUP〗([\s\S]*?)〖\/SUP〗/g, '<sup>$1</sup>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

function inserirSeparadores(texto) {
    const linhas = texto.split('\n');
    const saida = [];
    let linhaAnteriorVazia = false;
    let jaTemConteudo = false;

    for (const linha of linhas) {
        const vazia = linha.trim() === '';

        if (!vazia) {
            const pareceInicioQuestao =
                /^\d+\s*\.\s/.test(linha) ||
                /^QUESTÃO\s+\d+/i.test(linha);
            if (pareceInicioQuestao && linhaAnteriorVazia && jaTemConteudo) {
                saida.push('===');
            }
            jaTemConteudo = true;
            linhaAnteriorVazia = false;
        } else {
            linhaAnteriorVazia = true;
        }
        saida.push(linha);
    }
    return saida.join('\n');
}

async function extrairComGemini(html) {
    const imagens = [];
    const htmlComPlaceholders = html.replace(
        /<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi,
        (match) => {
            const idx = imagens.length;
            imagens.push(match);
            return `〖IMG_${idx}〗`;
        }
    );

    const limite = 10000;
    const htmlTruncado = htmlComPlaceholders.length > limite ? htmlComPlaceholders.slice(0, limite) + "..." : htmlComPlaceholders;
    const textoMarcado = htmlParaMarcadores(htmlTruncado);
    const textoComSeparadores = inserirSeparadores(textoMarcado);

    function formatosRenderizaveis(contentType) {
        return /image\/(png|jpeg|jpg|gif|svg(\+xml)?|webp|bmp|ico)/i.test(contentType);
    }

    function restaurarImagens(texto) {
        return texto.replace(/〖IMG_(\d+)〗/g, (_, idx) => {
            const imgTag = imagens[parseInt(idx)];
            if (!imgTag) return '';
            const srcMatch = imgTag.match(/src=["']([^"']*)["']/);
            const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
            const alt = altMatch ? altMatch[1] : '';
            if (!srcMatch) return imgTag;
            const src = srcMatch[1];
            if (!src.startsWith('data:')) return imgTag;
            const ct = src.match(/^data:([^;]+)/);
            const tipo = ct ? ct[1] : '';
            if (tipo && !formatosRenderizaveis(tipo)) {
                const base64 = src.replace(/^data:[^;]+;base64,/, '');
                const png = extrairPngDeWmf(base64);
                if (png) {
                    return imgTag.replace(src, png);
                }
                const ext = tipo.replace('image/', '').toUpperCase();
                return `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin:6px 0;text-align:center;font-size:13px;color:#856404">📷 ${alt ? `"${alt}"` : `Imagem ${ext}`}<br><small>Formato não suportado pelo navegador</small></div>`;
            }
            return imgTag;
        });
    }

    function limparAlternativa(texto) {
        return texto
            .replace(/^[a-zA-Z][\)\.]\s*/, '')
            .replace(/^[a-zA-Z]\s*[-–]\s*/, '')
            .replace(/^[ivxlcdm]+[\)\.]\s*/i, '')
            .replace(/\(correta\)/gi, '')
            .replace(/\(CORRETA\)/gi, '')
            .replace(/\[correta\]/gi, '')
            .replace(/✓\s*$/g, '')
            .replace(/✅\s*$/g, '')
            .trim();
    }

    function processarQuestoes(lista) {
        if (!Array.isArray(lista)) return [];
        lista.forEach(q => {
            q.enunciado = q.enunciado.replace(/^===\s*/gm, '').trim();
            q.enunciado = marcadoresParaHtml(q.enunciado);
            q.enunciado = restaurarImagens(q.enunciado);
            q.alternativas = q.alternativas.map(a => marcadoresParaHtml(a));
            q.alternativas = q.alternativas.map(a => restaurarImagens(a));
            q.alternativas = q.alternativas.map(a => limparAlternativa(a));
        });
        return lista;
    }

    const prompt = `Você é um extrator de múltipla escolha. O texto abaixo usa marcadores para formatação:

〖B〗texto〖/B〗 = negrito (bold)
〖I〗texto〖/I〗 = itálico
〖U〗texto〖/U〗 = sublinhado
〖SUB〗texto〖/SUB〗 = subscrito
〖SUP〗texto〖/SUP〗 = sobrescrito

〖IMG_N〗 = imagem presente no documento original. Preserve 〖IMG_N〗 exatamente onde a imagem aparece.

O texto está dividido em blocos separados por "===". Cada bloco representa UMA questão separada.

Extraia TODAS as questões de múltipla escolha encontradas, preservando os marcadores de formatação no enunciado e nas alternativas.

Para cada questão, identifique:
- O enunciado (texto completo com marcadores preservados)
- As alternativas (com marcadores se houver)
- Qual alternativa está correta (número 1-indexado, ou 0 se não identificada)

CRÍTICO: O enunciado deve conter o TEXTO COMPLETO incluindo numeração (ex: "1. "), cabeçalho da fonte (ex: "VUNESP - 2025 - ..."), e todo o texto antes das alternativas. NÃO remova nada.

CRÍTICO: Cada bloco separado por "===" é uma questão DIFERENTE. NUNCA junte dois blocos em uma mesma questão.

CRÍTICO: Se houver 〖IMG_N〗 no texto, mantenha 〖IMG_N〗 exatamente na posição correta dentro do enunciado ou alternativa. NÃO remova nem modifique.

Responda APENAS com array JSON, sem explicações:
[
  {
    "enunciado": "1. Fonte... texto com 〖B〗negrito〖/B〗 e 〖I〗itálico〖/I〗 e imagem 〖IMG_0〗",
    "alternativas": ["alt 1", "alt 2 com 〖B〗negrito〖/B〗"],
    "correta": 2
  }
]

Regras:
- "correta" é o NÚMERO da alternativa (1, 2, 3...). Use 0 se não identificar.
- NÃO inclua "(correta)", "(CORRETA)", "✓", "✅" ou qualquer marcador de resposta no texto das alternativas.
- Se uma alternativa tiver "correta" ou "✓" ou "✅", remova esses marcadores do texto e use o número dela em "correta".
- Preserve 〖B〗〖/B〗 〖I〗〖/I〗 〖U〗〖/U〗 〖SUB〗〖/SUB〗 〖SUP〗〖/SUP〗.
- Preserve 〖IMG_N〗 se houver.
- Extraia TODAS as questões (um array para CADA bloco ===).
- Se não encontrar, retorne [].
- Escape aspas duplas em JSON: use \\".
- Escape quebras de linha: use \\n.

TEXTO:
${textoComSeparadores}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "openrouter/free",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 4000
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${err}`);
    }

    const json = await response.json();
    let text = json.choices?.[0]?.message?.content?.trim() || "[]";
    text = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error('[ChatBot] JSON inválido da IA. Resposta:', text.substring(0, 300));
        const salvado = tentarSalvarJSON(text);
        if (salvado) {
            return processarQuestoes(salvado);
        }
        throw new Error(`Resposta inválida da IA: ${e.message}`);
    }

    return processarQuestoes(data);
}

function tryCanvasConversion(dataUri) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = dataUri;
    });
}

async function extrairImagensZip(arrayBuffer) {
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const pasta = zip.folder("word/media");
        if (!pasta) return [];
        const arquivos = [];
        pasta.forEach((path, file) => arquivos.push({ path, file }));
        arquivos.sort((a, b) => a.path.localeCompare(b.path));

        const grupos = {};
        for (const a of arquivos) {
            const base = a.path.replace(/\.[^.]+$/, '');
            if (!grupos[base]) grupos[base] = [];
            grupos[base].push(a);
        }

        const prioridade = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'wmf', 'emf'];
        const melhores = [];
        for (const base of Object.keys(grupos).sort()) {
            for (const fmt of prioridade) {
                const found = grupos[base].find(a => a.path.toLowerCase().endsWith('.' + fmt));
                if (found) { melhores.push(found); break; }
            }
        }

        const resultado = [];
        for (const m of melhores) {
            const ext = m.path.split('.').pop().toLowerCase();
            const data = await m.file.async('base64');
            const mimeTypes = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp', wmf: 'image/x-wmf', emf: 'image/x-emf' };
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            const dataUri = `data:${contentType};base64,${data}`;
            let pngUri;
            if (ext === 'wmf' || ext === 'emf') {
                pngUri = extrairPngDeWmf(data) || null;
            } else {
                pngUri = await tryCanvasConversion(dataUri);
            }
            resultado.push({ path: m.path, ext, pngUri: pngUri || dataUri });
        }
        return resultado;
    } catch (e) {
        console.error('[ChatBot] Erro ao extrair imagens do ZIP:', e);
        return [];
    }
}

async function processarDocumentoMulti(file) {

    if (!file.name.toLowerCase().endsWith('.docx')) {
        addMessage('Envie apenas arquivos .docx.', 'system');
        return;
    }
    if (typeof window.mammoth === 'undefined') {
        addMessage('mammoth.js não carregado. Recarregue a página.', 'system');
        return;
    }

    const loadingEl = addMessage('📄 Lendo documento...', 'loading');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const htmlResult = await window.mammoth.convertToHtml({ arrayBuffer });
        let htmlDoc = htmlResult.value.trim();

        const imgMatch = htmlDoc.match(/<img[^>]*>/gi);
        
        let imagensConvertidas = null;

        if (imgMatch && imgMatch.length > 0) {
            loadingEl.innerHTML = '📄 Lendo documento... convertendo imagens...';

            if (typeof JSZip !== 'undefined') {
                imagensConvertidas = await extrairImagensZip(arrayBuffer);
            }

            if (imagensConvertidas) {
                imgMatch.forEach((tag, i) => {
                    if (!imagensConvertidas[i] || !imagensConvertidas[i].pngUri) return;
                    const srcMatch = tag.match(/src=["']([^"']*)["']/);
                    if (!srcMatch) return;
                    const src = srcMatch[0];
                    htmlDoc = htmlDoc.replace(tag, tag.replace(src, `src="${imagensConvertidas[i].pngUri}"`));
                });
            }
        }

        if (!htmlDoc) {
            loadingEl.remove();
            addMessage('Documento vazio ou corrompido.', 'system');
            return;
        }

        loadingEl.remove();

        const analiseEl = addMessage('🐨 Analisando questões com IA...', 'loading');

        try {
            state.questoes = await extrairComGemini(htmlDoc);
        } catch (e) {
            analiseEl.remove();
            addMessage(`Erro ao processar com IA: ${e.message}`, 'system');
            return;
        }

        analiseEl.remove();
        state.questoes.forEach((q, i) => {
            const imgCount = (q.enunciado.match(/<img[^>]*>/gi) || []).length;
        });

        if (!Array.isArray(state.questoes) || state.questoes.length === 0) {
            addMessage('A IA não conseguiu identificar questões no documento. Verifique o formato.', 'system');
            return;
        }

        function renderAlternativas(alternativas, correta) {
            const letras = 'ABCDEFGHIJ';
            return alternativas.map((alt, j) => {
                const isCorreta = (j + 1) === correta;
                const bg = isCorreta ? 'rgba(76,175,80,0.1)' : 'transparent';
                const border = isCorreta ? '1.5px solid #4caf50' : '1px solid transparent';
                return `<div style="padding:4px 8px;margin:2px 0;border-radius:6px;background:${bg};border:${border};font-size:13px">
                    <strong>${letras[j]}.</strong> ${alt} ${isCorreta ? '✅' : ''}</div>`;
            }).join('');
        }

        let html = `📋 <strong>Encontrei ${state.questoes.length} questões!</strong><br><br>`;
        state.questoes.forEach((q, i) => {
            const idToggle = `ver-mais-${i}`;
            const idConteudo = `conteudo-${i}`;
            const curto = q.enunciado.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').substring(0, 80);
            const temMais = q.enunciado.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').length > 80;
            html += `<div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:10px;margin-bottom:8px">`;
            html += `<strong style="color:var(--primary-color)">#${i + 1}</strong> `;
            html += `<span id="${idConteudo}-curto">${escapeHtml(curto)}${temMais ? '...' : ''}</span>`;
            html += `<span id="${idConteudo}-completo" style="display:none">${q.enunciado}</span>`;
            if (temMais) {
                html += ` <button class="msg-option" onclick="document.getElementById('${idConteudo}-curto').style.display='none';document.getElementById('${idConteudo}-completo').style.display='inline';this.style.display='none'" style="font-size:12px;padding:2px 8px;cursor:pointer">Ver tudo</button>`;
            }
            html += `<br>`;
            html += renderAlternativas(q.alternativas, q.correta);
            html += `</div>`;
        });

        addMessage(html);

        const visMsg = addMessage('👁️ Essas questões serão <strong>Públicas</strong> ou <strong>Privadas</strong>?');
        const visOpts = addBotOptions([
            { label: '🌍 Público', value: 'publico' },
            { label: '🔒 Privado', value: 'privado' },
        ], (value) => {
            visMsg.querySelector('.msg-options')?.remove();
            state.dados.visibilidade = value;
            const label = value === 'publico' ? 'Público' : 'Privado';
            visMsg.innerHTML = `👁️ Visibilidade: <strong>${label}</strong> ✅`;

            const confirmMsg = addMessage(`Deseja <strong>cadastrar todas</strong> as ${state.questoes.length} questões?`);
            addConfirmButtons(confirmMsg,
                async () => {
                    confirmMsg.querySelector('.chatbot-confirm')?.remove();
                    await criarMultiplasPerguntas();
                },
                () => {
                    confirmMsg.querySelector('.chatbot-confirm')?.remove();
                    resetState();
                    setTimeout(() => startConversation(), 400);
                }
            );
        });
        visMsg.appendChild(visOpts);

    } catch (e) {
        addMessage(`Erro: ${e.message}`, 'system');
        console.error('[ChatBot]', e);
    }
}

async function criarMultiplasPerguntas() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado) {
        addMessage('Usuário não logado.', 'system');
        return;
    }

    const total = state.questoes.length;
    let criadas = 0;
    const loading = addMessage(`🔄 Cadastrando questões... 0/${total}`, 'loading');

    for (let i = 0; i < total; i++) {
        const q = state.questoes[i];

        const { data: pergunta, error } = await supabaseClient
            .from("perguntas")
            .insert([{
                pergunta_texto: q.enunciado,
                id_conteudo: state.dados.conteudoObj.id_conteudo,
                id_materia: state.dados.materiaObj.id_materia,
                id_usuario: userLogado.id_usuario,
                visibilidade: state.dados.visibilidade || "publico"
            }])
            .select()
            .single();

        if (error) {
            console.error(`[ChatBot] Erro questão ${i + 1}:`, error);
            continue;
        }

        for (let j = 0; j < q.alternativas.length; j++) {
            const { error: altError } = await supabaseClient
                .from("alternativa")
                .insert([{
                    nome_alternativa: q.alternativas[j],
                    id_pergunta: pergunta.id_pergunta,
                    correta: (j + 1) === q.correta
                }]);
            if (altError) console.error(`[ChatBot] Erro alt ${j + 1} questão ${i + 1}:`, altError);
        }

        criadas++;
        loading.innerHTML = `🔄 Cadastrando questões... ${criadas}/${total}`;
    }

    loading.remove();
    addMessage(`✅ <strong>${criadas} de ${total} questões cadastradas com sucesso!</strong>`);
    toast(`${criadas} questões criadas pelo assistente!`, "success");

    const msg = addMessage('Deseja <strong>criar outras questões</strong> com matéria/conteúdo diferentes?');
    addConfirmButtons(msg,
        () => {
            msg.querySelector('.chatbot-confirm')?.remove();
            resetState();
            setTimeout(() => startConversation(), 400);
        },
        () => {
            msg.querySelector('.chatbot-confirm')?.remove();
            addMessage('OK! Se precisar, é só clicar no 💬. 😊');
            state.passo = 'done';
            setInputEnabled(false);
        }
    );
}

function initChat() {
    if (document.getElementById('chatbot-root')) return;

    const root = document.createElement('div');
    root.id = 'chatbot-root';

    chatToggle = document.createElement('button');
    chatToggle.className = 'chatbot-toggle';
    chatToggle.innerHTML = '💬';
    chatToggle.addEventListener('click', toggleChat);
    root.appendChild(chatToggle);

    chatPanel = document.createElement('div');
    chatPanel.className = 'chatbot-panel';
    chatPanel.innerHTML = `
        <div class="chatbot-header">
            <div class="chatbot-header-icon">🐨</div>
            <div class="chatbot-header-text">
                <h3>Assistente PontuaAI</h3>
                <p>Cadastre perguntas rapidamente</p>
            </div>
        </div>
        <div class="chatbot-messages"></div>
        <div class="chatbot-input-area">
            <textarea id="chatInput" placeholder="Digite sua resposta..." autocomplete="off" rows="1"></textarea>
            <button class="chatbot-send" id="chatSend">➤</button>
        </div>
    `;
    root.appendChild(chatPanel);

    document.body.appendChild(root);

    chatMessages = chatPanel.querySelector('.chatbot-messages');
    chatInput = chatPanel.querySelector('#chatInput');
    chatSend = chatPanel.querySelector('#chatSend');

    function autoResizeTextarea() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    }

    chatSend.addEventListener('click', () => sendMessage(chatInput.value));
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatInput.value);
        }
    });
    chatInput.addEventListener('input', autoResizeTextarea);

    setTimeout(() => {
        startConversation();
    }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (userLogado && userLogado.tipo_conta === 'professor') {
        initChat();
    }
});
