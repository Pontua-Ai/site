class CorretorRedacao {
    constructor() {
        this.tema = '';
        this.texto = '';
        this.resultados = {
            competencias: {},
            pontuacaoTotal: 0,
            feedback: '',
            sugestoes: []
        };
    }

    analisarRedacao(tema, texto) {
        this.tema = tema.toLowerCase();
        this.texto = texto.toLowerCase();
        
        this.analisarCompetencia1();
        this.analisarCompetencia2();
        this.analisarCompetencia3();
        this.analisarCompetencia4();
        this.analisarCompetencia5();
        
        this.calcularPontuacaoTotal();
        this.gerarFeedback();
        this.gerarSugestoes();
        
        return this.resultados;
    }

    analisarCompetencia1() {
        let pontos = 0;
        const erros = [];
        
        const regrasGramaticais = [
            { regex: /\b(é|foi|está|são|estão)\b/g, tipo: 'Verbo ser/estar' },
            { regex: /\b(que|porque|porquê|por que)\b/g, tipo: 'Conjunções' },
            { regex: /\b(a|à)\s/g, tipo: 'Crase' },
            { regex: /\b(mas|mais)\b/g, tipo: 'Mas/Mais' },
            { regex: /\[.,;:!?]+\s*[a-z]/g, tipo: 'Pontuação' }
        ];

        const frases = this.texto.split(/[.!?]+/).filter(f => f.trim().length > 0);
        let totalFrases = frases.length;
        let frasesComErros = 0;

        regrasGramaticais.forEach(regra => {
            const matches = this.texto.match(regra.regex);
            if (matches) {
                frasesComErros += Math.min(matches.length, totalFrases * 0.3);
            }
        });

        const palavras = this.texto.split(/\s+/).filter(p => p.length > 0);
        const palavrasPorcentagem = frasesComErros / totalFrases;

        if (palavrasPorcentagem < 0.1) {
            pontos = 200;
        } else if (palavrasPorcentagem < 0.2) {
            pontos = 160;
        } else if (palavrasPorcentagem < 0.3) {
            pontos = 120;
        } else if (palavrasPorcentagem < 0.4) {
            pontos = 80;
        } else {
            pontos = 40;
        }

        this.resultados.competencias.competencia1 = {
            pontos,
            maxPontos: 200,
            detalhes: erros.length > 0 ? erros : ['Domínio adequado da norma culta'],
            nivel: this.classificarNivel(pontos, 200)
        };
    }

    analisarCompetencia2() {
        let pontos = 0;
        const detalhes = [];

        const palavrasTema = this.tema.split(/\s+/);
        const palavrasTexto = this.texto.split(/\s+/);
        
        let relevanciaTema = 0;
        palavrasTema.forEach(palavra => {
            if (palavra.length > 3) {
                const ocorrencias = (this.texto.match(new RegExp(palavra, 'g')) || []).length;
                relevanciaTema += ocorrencias;
            }
        });

        const densidadeTematica = relevanciaTema / palavrasTexto.length;

        if (densidadeTematica >= 0.05) {
            pontos = 200;
            detalhes.push('Excelente abordagem do tema proposto');
        } else if (densidadeTematica >= 0.03) {
            pontos = 160;
            detalhes.push('Boa abordagem do tema');
        } else if (densidadeTematica >= 0.02) {
            pontos = 120;
            detalhes.push('Abordagem adequada do tema');
        } else if (densidadeTematica >= 0.01) {
            pontos = 80;
            detalhes.push('Abordagem superficial do tema');
        } else {
            pontos = 40;
            detalhes.push('Fuga parcial ao tema proposto');
        }

        if (this.texto.length < 500) {
            pontos = Math.max(pontos - 40, 40);
            detalhes.push('Texto muito curto para desenvolvimento adequado');
        }

        this.resultados.competencias.competencia2 = {
            pontos,
            maxPontos: 200,
            detalhes,
            nivel: this.classificarNivel(pontos, 200)
        };
    }

    analisarCompetencia3() {
        let pontos = 0;
        const detalhes = [];

        const frases = this.texto.split(/[.!?]+/).filter(f => f.trim().length > 0);
        const paragrafos = this.texto.split(/\n\n+/).filter(p => p.trim().length > 0);
        
        const argumentos = this.identificarArgumentos();
        const dadosEstatisticos = this.identificarDadosEstatisticos();
        const exemplosConcretos = this.identificarExemplos();

        let estruturaAdequada = false;
        if (paragrafos.length >= 4 && paragrafos.length <= 8) {
            estruturaAdequada = true;
        }

        let qualidadeArgumentacao = 0;
        qualidadeArgumentacao += argumentos.length * 20;
        qualidadeArgumentacao += dadosEstatisticos.length * 15;
        qualidadeArgumentacao += exemplosConcretos.length * 10;

        if (estruturaAdequada && qualidadeArgumentacao >= 60) {
            pontos = 200;
            detalhes.push('Excelente estrutura dissertativa');
            detalhes.push('Argumentação consistente e bem fundamentada');
        } else if (estruturaAdequada && qualidadeArgumentacao >= 40) {
            pontos = 160;
            detalhes.push('Boa estrutura dissertativa');
            detalhes.push('Argumentação adequada');
        } else if (estruturaAdequada && qualidadeArgumentacao >= 20) {
            pontos = 120;
            detalhes.push('Estrutura adequada');
            detalhes.push('Argumentação presente, mas pode ser melhorada');
        } else {
            pontos = 80;
            detalhes.push('Estrutura dissertativa limitada');
            detalhes.push('Argumentação insuficiente');
        }

        if (argumentos.length === 0) {
            pontos = Math.max(pontos - 40, 40);
            detalhes.push('Falta de argumentos consistentes');
        }

        this.resultados.competencias.competencia3 = {
            pontos,
            maxPontos: 200,
            detalhes,
            nivel: this.classificarNivel(pontos, 200)
        };
    }

    analisarCompetencia4() {
        let pontos = 0;
        const detalhes = [];

        const conectivos = [
            'portanto', 'pois', 'porque', 'assim', 'logo', 'então',
            'no entanto', 'mas', 'contudo', 'todavia', 'entretanto',
            'além disso', 'ademais', 'também', 'outro aspecto',
            'primeiramente', 'segundamente', 'por fim', 'finalmente',
            'nesse sentido', 'desse modo', 'dessa forma'
        ];

        let conectivosEncontrados = 0;
        conectivos.forEach(conectivo => {
            const regex = new RegExp(`\\b${conectivo}\\b`, 'g');
            const matches = this.texto.match(regex);
            if (matches) conectivosEncontrados += matches.length;
        });

        const frases = this.texto.split(/[.!?]+/).filter(f => f.trim().length > 0);
        let coerenciaTemática = this.verificarCoerenciaTemática();
        let progressaoArgumentativa = this.verificarProgressaoArgumentativa();

        let pontuacaoConectivos = Math.min(conectivosEncontrados * 10, 60);
        let pontuacaoCoerencia = coerenciaTemática ? 70 : 35;
        let pontuacaoProgressao = progressaoArgumentativa ? 70 : 35;

        pontos = Math.min(pontuacaoConectivos + pontuacaoCoerencia + pontuacaoProgressao, 200);

        if (pontos >= 160) {
            detalhes.push('Excelente coerência textual');
            detalhes.push('Uso adequado de conectivos');
        } else if (pontos >= 120) {
            detalhes.push('Boa coerência textual');
            detalhes.push('Uso adequado de conectivos');
        } else if (pontos >= 80) {
            detalhes.push('Coerência textual adequada');
            detalhes.push('Pode melhorar o uso de conectivos');
        } else {
            detalhes.push('Coerência textual limitada');
            detalhes.push('Necessidade melhorar conectivos e coesão');
        }

        this.resultados.competencias.competencia4 = {
            pontos,
            maxPontos: 200,
            detalhes,
            nivel: this.classificarNivel(pontos, 200)
        };
    }

    analisarCompetencia5() {
        let pontos = 0;
        const detalhes = [];

        const indicadoresProposta = [
            'propõe', 'sugere', 'recomenda', 'defende', 'aposta',
            'solução', 'medida', 'ação', 'iniciativa', 'projeto',
            'política pública', 'programa', 'campanha', 'intervenção'
        ];

        const indicadoresDetalhamento = [
            'governo', 'sociedade', 'escolas', 'empresas', 'cidadãos',
            'deve', 'precisa', 'necessário', 'importante', 'fundamental'
        ];

        let temProposta = false;
        let detalhamentoAdequado = false;
        let agenteClaro = false;
        let meioClaro = false;
        let finalidadeClara = false;

        indicadoresProposta.forEach(indicador => {
            if (this.texto.includes(indicador)) {
                temProposta = true;
            }
        });

        indicadoresDetalhamento.forEach(indicador => {
            if (this.texto.includes(indicador)) {
                detalhamentoAdequado = true;
            }
        });

        if (this.texto.includes('governo') || this.texto.includes('estado') || 
            this.texto.includes('sociedade') || this.texto.includes('instituições')) {
            agenteClaro = true;
        }

        if (this.texto.includes('lei') || this.texto.includes('política') || 
            this.texto.includes('programa') || this.texto.includes('campanha') ||
            this.texto.includes('educação') || this.texto.includes('conscientização')) {
            meioClaro = true;
        }

        if (this.texto.includes('reduzir') || this.texto.includes('melhorar') || 
            this.texto.includes('combater') || this.texto.includes('promover') ||
            this.texto.includes('aumentar') || this.texto.includes('diminuir')) {
            finalidadeClara = true;
        }

        let criteriosAtendidos = 0;
        if (temProposta) criteriosAtendidos++;
        if (detalhamentoAdequado) criteriosAtendidos++;
        if (agenteClaro) criteriosAtendidos++;
        if (meioClaro) criteriosAtendidos++;
        if (finalidadeClara) criteriosAtendidos++;

        if (criteriosAtendidos === 5) {
            pontos = 200;
            detalhes.push('Proposta de intervenção completa e detalhada');
            detalhes.push('Agente, meio e finalidade bem definidos');
        } else if (criteriosAtendidos === 4) {
            pontos = 160;
            detalhes.push('Boa proposta de intervenção');
            detalhes.push('Pode aprimorar alguns aspectos');
        } else if (criteriosAtendidos === 3) {
            pontos = 120;
            detalhes.push('Proposta de intervenção adequada');
            detalhes.push('Necessita mais detalhamento');
        } else if (criteriosAtendidos === 2) {
            pontos = 80;
            detalhes.push('Proposta de intervenção limitada');
            detalhes.push('Faltam elementos essenciais');
        } else {
            pontos = 0;
            detalhes.push('Não apresenta proposta de intervenção adequada');
        }

        this.resultados.competencias.competencia5 = {
            pontos,
            maxPontos: 200,
            detalhes,
            nivel: this.classificarNivel(pontos, 200)
        };
    }

    identificarArgumentos() {
        const marcadoresArgumento = [
            'porque', 'visto que', 'já que', 'uma vez que', 'pois',
            'devido a', 'em virtude de', 'graças a', 'a fim de'
        ];

        const argumentos = [];
        marcadoresArgumento.forEach(marcador => {
            const regex = new RegExp(`[^.!?]*\\b${marcador}\\b[^.!?]*[.!?]`, 'gi');
            const matches = this.texto.match(regex);
            if (matches) {
                argumentos.push(...matches);
            }
        });

        return argumentos.slice(0, 5);
    }

    identificarDadosEstatisticos() {
        const regexNumeros = /\b\d+%|\b\d+\s*(mil|milhão|milhões|bilhão|bilhões)\b/gi;
        return this.texto.match(regexNumeros) || [];
    }

    identificarExemplos() {
        const marcadoresExemplo = [
            'por exemplo', 'como', 'isto é', 'ou seja', 'a saber',
            'caso de', 'exemplo de', 'ilustra'
        ];

        const exemplos = [];
        marcadoresExemplo.forEach(marcador => {
            const regex = new RegExp(`[^.!?]*\\b${marcador}\\b[^.!?]*[.!?]`, 'gi');
            const matches = this.texto.match(regex);
            if (matches) {
                exemplos.push(...matches);
            }
        });

        return exemplos.slice(0, 3);
    }

    verificarCoerenciaTemática() {
        const palavrasTema = this.tema.split(/\s+/).filter(p => p.length > 3);
        const paragrafos = this.texto.split(/\n\n+/).filter(p => p.trim().length > 0);
        
        let paragrafosCoerentes = 0;
        paragrafos.forEach(paragrafo => {
            let relevanciaParagrafo = 0;
            palavrasTema.forEach(palavra => {
                if (paragrafo.includes(palavra)) {
                    relevanciaParagrafo++;
                }
            });
            if (relevanciaParagrafo >= palavrasTema.length * 0.3) {
                paragrafosCoerentes++;
            }
        });

        return paragrafosCoerentes / paragrafos.length >= 0.7;
    }

    verificarProgressaoArgumentativa() {
        const frases = this.texto.split(/[.!?]+/).filter(f => f.trim().length > 0);
        let progressao = 0;
        
        for (let i = 1; i < frases.length; i++) {
            const fraseAnterior = frases[i-1].split(/\s+/);
            const fraseAtual = frases[i].split(/\s+/);
            const palavrasComuns = fraseAnterior.filter(palavra => 
                fraseAtual.includes(palavra) && palavra.length > 3
            ).length;
            
            if (palavrasComuns > 0 && palavrasComuns <= 3) {
                progressao++;
            }
        }

        return progressao / frases.length >= 0.4;
    }

    calcularPontuacaoTotal() {
        this.resultados.pontuacaoTotal = Object.values(this.resultados.competencias)
            .reduce((total, comp) => total + comp.pontos, 0);
    }

    gerarFeedback() {
        const pontuacao = this.resultados.pontuacaoTotal;
        
        if (pontuacao >= 900) {
            this.resultados.feedback = "Excelente redação! Demonstrou domínio excepcional em todas as competências exigidas pelo ENEM.";
        } else if (pontuacao >= 700) {
            this.resultados.feedback = "Ótima redação! Apresenta um desempenho muito bom, com pequenos aspectos a serem aprimorados.";
        } else if (pontuacao >= 500) {
            this.resultados.feedback = "Boa redação! Atende aos requisitos básicos, mas precisa de melhorias em algumas competências.";
        } else if (pontuacao >= 300) {
            this.resultados.feedback = "Redação adequada. Apresenta dificuldades em algumas competências que precisam ser trabalhadas.";
        } else {
            this.resultados.feedback = "Redação precisa de desenvolvimento. Recomenda-se estudar mais sobre estrutura dissertativa e argumentação.";
        }
    }

    gerarSugestoes() {
        this.resultados.sugestoes = [];

        Object.entries(this.resultados.competencias).forEach(([key, comp]) => {
            if (comp.pontos < 160) {
                switch(key) {
                    case 'competencia1':
                        this.resultados.sugestoes.push("Revise regras gramaticais e pontuação. Estude concordância verbal e nominal.");
                        break;
                    case 'competencia2':
                        this.resultados.sugestoes.push("Aprofunde a análise do tema. Use mais palavras-chave relacionadas ao assunto.");
                        break;
                    case 'competencia3':
                        this.resultados.sugestoes.push("Estruture melhor seus argumentos. Inclua dados, exemplos e fatos concretos.");
                        break;
                    case 'competencia4':
                        this.resultados.sugestoes.push("Melhore a coesão usando mais conectivos. Verifique a progressão de ideias.");
                        break;
                    case 'competencia5':
                        this.resultados.sugestoes.push("Detalhe sua proposta de intervenção. Defina claramente agente, meio e finalidade.");
                        break;
                }
            }
        });
    }

    classificarNivel(pontos, maxPontos) {
        const percentual = (pontos / maxPontos) * 100;
        if (percentual >= 80) return 'Excelente';
        if (percentual >= 60) return 'Bom';
        if (percentual >= 40) return 'Regular';
        if (percentual >= 20) return 'Insuficiente';
        return 'Ruim';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const redacaoTextarea = document.getElementById('redacao');
    const temaInput = document.getElementById('tema');
    const corrigirBtn = document.getElementById('corrigirBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const resultsSection = document.getElementById('resultsSection');
    const charCount = document.getElementById('charCount');
    const lineCount = document.getElementById('lineCount');
    const wordCount = document.getElementById('wordCount');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const exportBtn = document.getElementById('exportBtn');
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Mobile menu toggle
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) && 
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });

    function updateCounts() {
        const text = redacaoTextarea.value;
        charCount.textContent = text.length;
        
        const lines = text.split('\n').length;
        lineCount.textContent = lines;
        
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        wordCount.textContent = words.length;
    }

    redacaoTextarea.addEventListener('input', updateCounts);

    function corrigirRedacao() {
        const tema = temaInput.value.trim();
        const redacao = redacaoTextarea.value.trim();

        if (!tema) {
            alert('Por favor, digite o tema da redação.');
            return;
        }

        if (!redacao || redacao.length < 200) {
            alert('Por favor, escreva uma redação com pelo menos 200 caracteres.');
            return;
        }

        const btnText = corrigirBtn.querySelector('.btn-text');
        const btnLoading = corrigirBtn.querySelector('.btn-loading');
        
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        corrigirBtn.disabled = true;

        setTimeout(() => {
            const corretor = new CorretorRedacao();
            const resultado = corretor.analisarRedacao(tema, redacao);
            
            // Store result for export
            window.lastResult = resultado;

            exibirResultados(resultado);

            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            corrigirBtn.disabled = false;

            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }, 2000);
    }

    function exibirResultados(resultado) {
        document.getElementById('totalScore').textContent = resultado.pontuacaoTotal;
        
        // Update score grade
        const scoreGrade = document.getElementById('scoreGrade');
        const pontuacao = resultado.pontuacaoTotal;
        if (pontuacao >= 900) scoreGrade.textContent = 'A+';
        else if (pontuacao >= 800) scoreGrade.textContent = 'A';
        else if (pontuacao >= 700) scoreGrade.textContent = 'B+';
        else if (pontuacao >= 600) scoreGrade.textContent = 'B';
        else if (pontuacao >= 500) scoreGrade.textContent = 'C+';
        else if (pontuacao >= 400) scoreGrade.textContent = 'C';
        else scoreGrade.textContent = 'D';

        Object.entries(resultado.competencias).forEach(([key, comp]) => {
            const compNum = key.replace('competencia', '');
            document.getElementById(`comp${compNum}Score`).textContent = comp.pontos;
            
            // Update progress bar
            const progressBar = document.getElementById(`comp${compNum}Progress`);
            const progressPercent = (comp.pontos / comp.maxPontos) * 100;
            progressBar.style.width = `${progressPercent}%`;
            
            // Update level text
            document.getElementById(`comp${compNum}Level`).textContent = comp.nivel;
            
            // Update details
            const detailsList = document.getElementById(`comp${compNum}Details`);
            detailsList.innerHTML = '';
            comp.detalhes.forEach(det => {
                const li = document.createElement('li');
                li.textContent = det;
                detailsList.appendChild(li);
            });

            // Update card class
            const card = document.querySelector(`[data-competency="${compNum}"]`);
            card.className = `competency-card nivel-${comp.nivel.toLowerCase()}`;
        });

        document.getElementById('feedbackContent').textContent = resultado.feedback;

        const suggestionsContent = document.getElementById('suggestionsContent');
        suggestionsContent.innerHTML = '';
        if (resultado.sugestoes.length > 0) {
            const ul = document.createElement('ul');
            resultado.sugestoes.forEach(sugestao => {
                const li = document.createElement('li');
                li.textContent = sugestao;
                ul.appendChild(li);
            });
            suggestionsContent.appendChild(ul);
        } else {
            suggestionsContent.innerHTML = '<p>Sua redação está muito boa! Continue praticando para manter o excelente desempenho.</p>';
        }

        resultsSection.style.display = 'block';
    }

    function novaAnalise() {
        temaInput.value = '';
        redacaoTextarea.value = '';
        resultsSection.style.display = 'none';
        updateCounts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function limparTexto() {
        if (redacaoTextarea.value.trim()) {
            if (confirm('Tem certeza que deseja limpar todo o texto?')) {
                redacaoTextarea.value = '';
                temaInput.value = '';
                updateCounts();
            }
        }
    }

    function salvarTexto() {
        const tema = temaInput.value.trim();
        const texto = redacaoTextarea.value.trim();
        
        if (!tema && !texto) {
            alert('Não há conteúdo para salvar!');
            return;
        }
        
        const dados = {
            tema: tema || 'Sem título',
            texto: texto,
            data: new Date().toLocaleString('pt-BR')
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `redacao_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportarResultado() {
        const resultado = {
            tema: temaInput.value.trim(),
            texto: redacaoTextarea.value.trim(),
            resultado: window.lastResult,
            data: new Date().toLocaleString('pt-BR')
        };
        
        const blob = new Blob([JSON.stringify(resultado, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resultado_redacao_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    corrigirBtn.addEventListener('click', corrigirRedacao);
    newAnalysisBtn.addEventListener('click', novaAnalise);
    clearBtn.addEventListener('click', limparTexto);
    saveBtn.addEventListener('click', salvarTexto);
    exportBtn.addEventListener('click', exportarResultado);

    updateCounts();
});