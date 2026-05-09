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
    },
    questoes: []
};

let chatContainer = null;
let chatMessages = null;
let chatInput = null;
let chatSend = null;
let chatToggle = null;
let chatPanel = null;
let chatFileInput = null;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

async function buscarMateria(nome) {
    const nomes = nome.trim();
    const { data: exato } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia")
        .ilike("nome_materia", nomes)
        .maybeSingle();
    if (exato) return exato;

    const { data: todas } = await supabaseClient
        .from("materia")
        .select("id_materia, nome_materia");

    if (!todas) return null;

    const normalizado = normalizar(nomes);
    return todas.find(m => normalizar(m.nome_materia) === normalizado) || null;
}

async function buscarConteudo(nome, idMateria) {
    const nomes = nome.trim();
    const { data: exato } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria)
        .ilike("nome_conteudo", nomes)
        .maybeSingle();
    if (exato) return exato;

    const { data: todos } = await supabaseClient
        .from("conteudo")
        .select("id_conteudo, nome_conteudo")
        .eq("id_materia", idMateria);

    if (!todos) return null;

    const normalizado = normalizar(nomes);
    return todos.find(c => normalizar(c.nome_conteudo) === normalizado) || null;
}

async function criarMateria(nome) {
    const { data, error } = await supabaseClient
        .from("materia")
        .insert([{ nome_materia: nome.trim() }])
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function criarConteudo(nome, idMateria) {
    const { data, error } = await supabaseClient
        .from("conteudo")
        .insert([{ nome_conteudo: nome.trim(), id_materia: idMateria }])
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
            visibilidade: "publico"
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

    if (lower === 'cancelar' || lower === 'voltar') {
        state.passo = 'start';
        state.dados = { materia: null, materiaObj: null, conteudo: null, conteudoObj: null, enunciado: '', alternativas: [], correta: null };
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
                const m = addMessage(`Encontrei a matéria <strong>${escapeHtml(materia.nome_materia)}</strong>! ✅`);
                setTimeout(() => perguntarConteudo(), 600);
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
            break;
        }

        case 'await_conteudo': {
            const msg = addMessage('Verificando conteúdo...', 'loading');
            const conteudo = await buscarConteudo(texto, state.dados.materiaObj.id_materia);
            msg.remove();

            if (conteudo) {
                state.dados.conteudo = conteudo.nome_conteudo;
                state.dados.conteudoObj = conteudo;
                const m = addMessage(`Encontrei o conteúdo <strong>${escapeHtml(conteudo.nome_conteudo)}</strong>! ✅`);
                setTimeout(() => perguntarEnunciado(), 600);
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
            setTimeout(() => mostrarResumo(), 400);
            break;
        }

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
        setTimeout(() => mostrarResumo(), 200);
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
            state.dados = { materia: null, materiaObj: null, conteudo: null, conteudoObj: null, enunciado: '', alternativas: [], correta: null };
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

function startConversation() {
    state.passo = 'start';

    const msg = addMessage(`
        👋 <strong>Olá! Sou o assistente do PontuaAI!</strong><br><br>
        Vou te ajudar a cadastrar perguntas de forma rápida.<br><br>
        Como você quer começar?
    `);

    const options = addBotOptions([
        { label: '⌨️ Digitar manualmente', value: 'manual' },
        { label: '📄 Enviar arquivo Word (várias questões)', value: 'upload' },
    ], (value) => {
        msg.querySelector('.msg-options')?.remove();
        if (value === 'upload') {
            startUploadFlow();
        } else {
            setTimeout(() => perguntarMateria(), 400);
        }
    });
    msg.appendChild(options);
}

function resetState() {
    state.passo = 'start';
    state.dados = { materia: null, materiaObj: null, conteudo: null, conteudoObj: null, enunciado: '', alternativas: [], correta: null };
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

function uploadPerguntarConteudo() {
    addMessage(`📖 Agora, qual o <strong>conteúdo</strong> dentro de ${escapeHtml(state.dados.materia)}?`);
    state.passo = 'upload_await_conteudo';
    setInputEnabled(true);
}

async function uploadFinalizarConteudo(texto) {
    const msg = addMessage('Verificando conteúdo...', 'loading');
    const conteudo = await buscarConteudo(texto, state.dados.materiaObj.id_materia);
    msg.remove();

    if (conteudo) {
        state.dados.conteudo = conteudo.nome_conteudo;
        state.dados.conteudoObj = conteudo;
        addMessage(`Conteúdo: <strong>${escapeHtml(conteudo.nome_conteudo)}</strong> ✅`);
        setTimeout(() => uploadMostrarArea(), 500);
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

async function extrairComGemini(texto) {
    const limite = 15000;
    const textoTruncado = texto.length > limite ? texto.slice(0, limite) + "..." : texto;

    const prompt = `Você é um extrator de questões de múltipla escolha. Analise o texto abaixo e extraia TODAS as questões de múltipla escolha encontradas.

Para cada questão, identifique:
- O enunciado (a pergunta em si)
- As alternativas (as opções de resposta)
- Qual alternativa está correta (número 1-indexado, ou 0 se não identificada)

Responda APENAS com um array JSON válido no seguinte formato, sem explicações:
[
  {
    "enunciado": "texto completo da pergunta",
    "alternativas": ["alternativa 1", "alternativa 2", "alternativa 3", ...],
    "correta": 2
  }
]

Regras importantes:
- O campo "correta" é o NÚMERO da alternativa correta (1, 2, 3, ...). Use 0 se não conseguir identificar.
- Extraia TODAS as questões que encontrar no texto.
- Se não encontrar nenhuma questão, retorne um array vazio [].

TEXTO:
${textoTruncado}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 4096
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenRouter ${response.status}: ${err}`);
    }

    const json = await response.json();
    const text = json.choices?.[0]?.message?.content?.trim() || "[]";
    const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    return Array.isArray(data) ? data : [];
}

async function processarDocumentoMulti(file) {
    console.log('[ChatBot] Processando documento multi:', file.name);

    if (!file.name.toLowerCase().endsWith('.docx')) {
        addMessage('⚠️ Envie apenas arquivos .docx.', 'system');
        return;
    }
    if (typeof window.mammoth === 'undefined') {
        addMessage('⚠️ mammoth.js não carregado. Recarregue a página.', 'system');
        return;
    }

    const loadingEl = addMessage('📄 Lendo documento...', 'loading');

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        const text = result.value.trim();

        if (!text) {
            loadingEl.remove();
            addMessage('⚠️ Documento vazio ou corrompido.', 'system');
            return;
        }

        loadingEl.remove();

        const analiseEl = addMessage('🤖 Analisando questões com IA...', 'loading');

        try {
            state.questoes = await extrairComGemini(text);
        } catch (e) {
            analiseEl.remove();
            addMessage(`⚠️ Erro ao processar com IA: ${e.message}`, 'system');
            return;
        }

        analiseEl.remove();
        console.log('[ChatBot] Questões extraídas:', state.questoes.length);

        if (!Array.isArray(state.questoes) || state.questoes.length === 0) {
            addMessage('⚠️ A IA não conseguiu identificar questões no documento. Verifique o formato.', 'system');
            return;
        }

        let html = `📋 <strong>Encontrei ${state.questoes.length} questões!</strong><br><br>`;
        state.questoes.forEach((q, i) => {
            html += `<div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:10px;padding:10px;margin-bottom:8px">`;
            html += `<strong style="color:var(--primary-color)">#${i + 1}</strong> ${escapeHtml(q.enunciado.substring(0, 80))}${q.enunciado.length > 80 ? '...' : ''}<br>`;
            html += `<span style="font-size:12px;color:var(--text-gray)">${q.alternativas.length} alternativas${q.correta ? ' · correta: ' + q.correta : ''}</span>`;
            html += `</div>`;
        });

        addMessage(html);

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

    } catch (e) {
        addMessage(`⚠️ Erro: ${e.message}`, 'system');
        console.error('[ChatBot]', e);
    }
}

async function criarMultiplasPerguntas() {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado) {
        addMessage('⚠️ Usuário não logado.', 'system');
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
                visibilidade: "publico"
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
            <div class="chatbot-header-icon">🤖</div>
            <div class="chatbot-header-text">
                <h3>Assistente PontuaAI</h3>
                <p>Cadastre perguntas rapidamente</p>
            </div>
        </div>
        <div class="chatbot-messages"></div>
        <div class="chatbot-input-area">
            <button class="chatbot-file-btn" id="chatFileBtn" title="Enviar arquivo Word">
                📎
                <input type="file" accept=".docx" id="chatFileInput">
            </button>
            <textarea id="chatInput" placeholder="Digite sua resposta..." autocomplete="off" rows="1"></textarea>
            <button class="chatbot-send" id="chatSend">➤</button>
        </div>
    `;
    root.appendChild(chatPanel);

    document.body.appendChild(root);

    chatMessages = chatPanel.querySelector('.chatbot-messages');
    chatInput = chatPanel.querySelector('#chatInput');
    chatSend = chatPanel.querySelector('#chatSend');
    chatFileInput = chatPanel.querySelector('#chatFileInput');

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

    chatFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (chatPanel.classList.contains('open') && state.dados.materiaObj) {
            addMessage(`📎 <strong>${escapeHtml(file.name)}</strong> selecionado. Processando...`, 'system');
            await processarDocumentoMulti(file);
        }
        chatFileInput.value = '';
    });

    document.getElementById('chatFileBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        chatFileInput.click();
    });

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
