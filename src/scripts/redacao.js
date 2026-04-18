import { GoogleGenAI } from "https://esm.run/@google/genai";
import { toast } from "./utils.js";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyDYNrj-aPPtQFoCe6t2fKD0Q1wYJw3jpDw"
});

let estaCorrigindo = false;

window.corrigir = async function () {
  if (estaCorrigindo) return;

  const botao = document.querySelector('button[onclick="corrigir()"]');
  const texto = document.getElementById("texto").value;
  const titulo = document.getElementById("title").value;
  const vestibular = document.getElementById("vestibular").value;

  if (!texto.trim()) {
    toast("Por favor, escreva uma redação primeiro!", "error");
    return;
  }

  estaCorrigindo = true;
  botao.disabled = true;
  botao.textContent = "Carregando...";
  console.log("[DEBUG] Iniciando correção da redação...");
  console.log("[DEBUG] Titulo capturado:", titulo);
  console.log("[DEBUG] Texto capturado, tamanho:", texto.length, "caracteres");
  console.log("[DEBUG] Vestibular selecionado:", vestibular);

  const prompts = {
    enem: `
Corrija a redação no padrão ENEM.
Seguindo os seguintes critérios:
Competencia 1: Demonstrar domínio da modalidade escrita formal da língua portuguesa
  Atribui-se 200 pontos para essa competencia caso: Demonstre excelente domínio da modalidade escrita formal da língua portuguesa e de escolha de registro. Desvios gramaticais ou de convenções da escrita serão aceitos somente como excepcionalidade e quando não caracterizarem reincidência.
  Atribui-se 160 pontos para essa competencia caso: Demonstra bom domínio da modalidade escrita formal da língua portuguesa e de escolha de registro, com poucos desvios gramaticais e de convenções da escrita.
  Atribui-se 120 pontos para essa competencia caso: Demonstra domínio mediano da modalidade escrita formal da língua portuguesa e de escolha de registro, com alguns desvios gramaticais e de convenções da escrita.
  Atribui-se 80 pontos para essa competencia caso: Demonstra domínio insuficiente da modalidade escrita formal da língua portuguesa, com muitos desvios gramaticais, de escolha de registro e de convenções da escrita.
  Atribui-se 40 pontos para essa competencia caso: Demonstra domínio precário da modalidade escrita formal da língua portuguesa, de forma sistemática, com diversificados e frequentes desvios gramaticais, de escolha de registro e de convenções da escrita.
  Atribui-se 0 pontos para essa competencia caso: Demonstra desconhecimento da modalidade escrita formal da língua portuguesa.

Competencia 2: Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema dentro dos limites estruturais do texto dissertativo-argumentativo em prosa.
  Atribui-se 200 pontos para essa competencia caso: Desenvolve o tema por meio de argumentação consistente, a partir de um repertório sociocultural produtivo, e apresenta excelente domínio do texto dissertativo-argumentativo.
  Atribui-se 160 pontos para essa competencia caso: Desenvolve o tema por meio de argumentação consistente e apresenta bom domínio do texto dissertativo-argumentativo, com proposição, argumentação e conclusão.
  Atribui-se 120 pontos para essa competencia caso: Desenvolve o tema por meio de argumentação previsível e apresenta domínio mediano do texto dissertativo-argumentativo, com proposição, argumentação e conclusão.
  Atribui-se 80 pontos para essa competencia caso: Desenvolve o tema recorrendo à cópia de trechos dos textos motivadores ou apresenta domínio insuficiente do texto dissertativo-argumentativo, não atendendo à estrutura com proposição, argumentação e conclusão.
  Atribui-se 40 pontos para essa competencia caso: Apresenta o assunto, tangenciando o tema, ou demonstra domínio precário do texto dissertativo-argumentativo, com traços constantes de outros tipos textuais.
  Atribui-se 0 pontos para essa competencia caso: Fuga ao tema/não atendimento à estrutura dissertativo-argumentativa. Nestes casos a redação recebe nota 0 (zero) e é anulada.

Competencia 3: Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista.
  Atribui-se 200 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema proposto, de forma consistente e organizada, configurando autoria, em defesa de um ponto de vista.
  Atribui-se 160 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema, de forma organizada, com indícios de autoria, em defesa de um ponto de vista.
  Atribui-se 120 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema, limitados aos argumentos dos textos motivadores e pouco organizados, em defesa de um ponto de vista.
  Atribui-se 80 pontos para essa competencia caso: Apresenta informações, fatos e opiniões relacionados ao tema, mas desorganizados ou contraditórios e limitados aos argumentos dos textos motivadores, em defesa de um ponto de vista.
  Atribui-se 40 pontos para essa competencia caso: Apresenta informações, fatos e opiniões pouco relacionados ao tema ou incoerentes e sem defesa de um ponto de vista.
  Atribui-se 0 pontos para essa competencia caso: Apresenta informações, fatos e opiniões não relacionados ao tema e sem defesa de um ponto de vista.

Competencia 4: Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação.
  Atribui-se 200 pontos para essa competencia caso: Articula bem as partes do texto e apresenta repertório diversificado de recursos coesivos.
  Atribui-se 160 pontos para essa competencia caso: Articula as partes do texto, com poucas inadequações, e apresenta repertório diversificado de recursos coesivos.
  Atribui-se 120 pontos para essa competencia caso: Articula as partes do texto, de forma mediana, com inadequações, e apresenta repertório pouco diversificado de recursos coesivos.
  Atribui-se 80 pontos para essa competencia caso: Articula as partes do texto, de forma insuficiente, com muitas inadequações, e apresenta repertório limitado de recursos coesivos.
  Atribui-se 40 pontos para essa competencia caso: Articula as partes do texto de forma precária.
  Atribui-se 0 pontos para essa competencia caso: Não articula as informações.

Competencia 5: Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.
  Atribui-se 200 pontos para essa competencia caso: Elabora muito bem proposta de intervenção, detalhada, relacionada ao tema e articulada à discussão desenvolvida no texto.
  Atribui-se 160 pontos para essa competencia caso: Elabora bem proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto.
  Atribui-se 120 pontos para essa competencia caso: Elabora, de forma mediana, proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto.
  Atribui-se 80 pontos para essa competencia caso: Elabora, de forma insuficiente, proposta de intervenção relacionada ao tema, ou não articulada com a discussão desenvolvida no texto.
  Atribui-se 40 pontos para essa competencia caso: Apresenta proposta de intervenção vaga, precária ou relacionada apenas ao assunto.
  Atribui-se 0 pontos para essa competencia caso: Não apresenta proposta de intervenção ou apresenta proposta não relacionada ao tema ou ao assunto

E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "C1": { "nota": number, "motivo": string },
  "C2": { "nota": number, "motivo": string },
  "C3": { "nota": number, "motivo": string },
  "C4": { "nota": number, "motivo": string },
  "C5": { "nota": number, "motivo": string },
  "nota_final": number,
}
Titulo:
${titulo}

Texto:
${texto}
    `,
    vunesp: `
Corrija a redação no padrão VUNESP.
Critérios de avaliação:
A) Tema: avalia-se, neste critério, se o texto do candidato
atende ao tema proposto. A fuga completa ao tema
proposto é motivo suficiente para que a redação não
seja corrigida em qualquer outro de seus aspectos,
recebendo nota 0 (zero) tota
B) Estrutura (gênero/tipo de texto e coerência):
consideram-se aqui, conjuntamente, os aspectos
referentes ao gênero/tipo de texto proposto e à
coerência das ideias. A fuga completa ao gênero/tipo
de texto é motivo suficiente para que a redação não
seja corrigida em qualquer outro de seus aspectos,
recebendo nota 0 (zero) total. Na avaliação do gênero/
tipo de texto, observa-se como o candidato sustenta
a sua tese, em termos argumentativos, e como essa
argumentação está organizada, considerando-se
a macroestrutura do texto dissertativo (introdução,
desenvolvimento e conclusão). Sabe-se que é comum,
em textos dissertativos, a exposição de fatos e opiniões,
mas é imprescindível que haja um posicionamento por
parte do autor da redação, a partir da defesa (clara)
de um ponto de vista. No gênero/tipo de texto, avaliase também o tipo de interlocução construída: por
se tratar de uma dissertação-argumentativa, devese prezar pela objetividade. Sendo assim, o uso de
primeira pessoa do singular e de segunda pessoa
(singular e plural) poderá ser penalizado. Além disso,
também poderá ser penalizada a referência direta
à situação imediata de produção textual (ex.: como
afirma o autor do primeiro texto/da coletânea/do texto
I; como solicitado nesta prova/proposta de redação),
porque é importante que o texto escrito pelo candidato
tenha autonomia, isto é, não dependa da consulta
(por parte do leitor) da proposta de redação (textos
de apoio e frase temática) para ser amplamente
compreendido. Na coerência, serão observados o nível
de compreensão (por parte do candidato) dos textos
de apoio da proposta, o conhecimento de mundo
(repertório) do candidato, a pertinência dos argumentos
mobilizados para a defesa do ponto de vista adotado e
a capacidade do candidato para desenvolver, relacionar
e encadear satisfatoriamente as informações e ideias
abordadas no texto. Assim, na avaliação deste critério,
serão consideradas aspectos negativos: a falta de
partes da macroestrutura dissertativa, a falta de um
posicionamento (por parte do autor da redação) na
defesa de um determinado ponto de vista, a falta de
autonomia do texto, a presença de contradição entre
as ideias, a falta de desenvolvimento dos argumentos
e a presença de conclusões não decorrentes do que foi previamente exposto.
C) Língua (modalidade e registro): avalia-se, neste
critério, a adequação do texto à modalidade escrita
e ao registro formal da língua portuguesa. Serão
examinados, neste item, aspectos gramaticais e de
convenção da escrita, tais como concordância (verbal e
nominal), regência, ortografia, acentuação, pontuação
etc., bem como a escolha lexical (precisão vocabular)
e o grau de formalidade/informalidade expresso em
palavras e expressões
D)Coesão: avalia-se, neste item, o emprego dos recursos
coesivos da língua (anáforas, catáforas, substituições,
conjunções etc.), responsáveis por tornar mais clara
e precisa a relação entre palavras, orações, períodos
e parágrafos do texto. Serão considerados aspectos
negativos o emprego inadequado ou ausência de
conectivos, a falta de divisão do texto em parágrafos
(redações em forma de monobloco), as quebras
indevidas entre frases ou parágrafos, a repetição
excessiva de um mesmo recurso coesivo e a
predominância de parágrafos muito curtos ou muito
longos, constituídos de apenas um período.
Será atribuída nota zero à redação que:
a) fugir ao tema e/ou gênero propostos;
b) apresentar nome, rubrica, assinatura, sinal, iniciais
ou marcas que permitam a identificação do candidato;
c) estiver em branco;
d) apresentar textos sob forma não articulada
verbalmente (apenas com desenhos, números e/ou
palavras soltas);
e) for escrita em outra língua que não a portuguesa;
f) estiver predominantemente ilegível e/ou com letra
incompreensível;
g) apresentar o texto definitivo fora do espaço
reservado para tal;
h) apresentar 7 (sete) linhas ou menos (sem contar o
título);
i) apresentar menos de 8 (oito) linhas AUTORAIS (não
copiadas da prova, dos textos de apoio, de modelos
prontos de redação ou de outras fontes) contínuas e/
ou for composta PREDOMINANTEMENTE por cópia de
trechos da coletânea ou de quaisquer outras partes
da prova e/ou por reproduções (plágio) de textos
divulgados em mídias digitais (sobretudo internet) ou
impressas;
j) for idêntica ou muito semelhante a outra(s)
redação(ões) deste processo seletivo ou de outro(s);
k) apresentar formas propositais de anulação, como
impropérios, trechos jocosos ou a recusa explícita em
cumprir o tema proposto.
Observações importantes:
Cada redação é avaliada por dois examinadores
independentes e, quando há discrepância na atribuição
das notas, o texto é reavaliado por um terceiro
examinador independente. Quando a discrepância
permanece, a prova é avaliada pelos coordenadores
da banca.
O espaço para rascunho no caderno de questões é de preenchimento facultativo. Em hipótese alguma, o
rascunho elaborado pelo candidato será considerado
na correção da prova de redação pela Banca
Examinadora.
Em hipótese alguma o título da redação será
considerado na avaliação do texto. Ainda que o título
contenha elementos relacionados à abordagem
temática, a nota do critério que avalia o tema só será
atribuída a partir do que estiver escrito no corpo do
texto. Sempre será considerada título a reprodução da
frase temática fora do corpo do texto (inclusive quando
não houver o espaço de uma linha pulada ou qualquer
marca que indique a separação entre a reprodução
da frase temática e o que se considera, efetivamente,
corpo do texto – esteja essa reprodução nas linhas
iniciais ou finais da redação).
Redações com 20 (vinte) linhas ou menos não poderão
alcançar a nota máxima nos critérios C e D. Além disso,
textos muito curtos, com 15 (quinze) linhas ou menos,
perderão um ponto nos critérios C e D.
Será reduzida a nota, no critério C, de redações
que contenham palavras escritas com letra
incompreensível. A redação será anulada (nota 0), se
estiver predominantemente ilegível.
Não é necessário elaborar conclusões com proposta
de intervenção, nas redações dos processos seletivos
promovidos pela Fundação Vunesp.
A banca examinadora da Fundação Vunesp leva
em consideração, na avaliação do critério B, o
conhecimento de mundo dos candidatos. Contudo,
é muito importante que o repertório mobilizado no
texto estabeleça uma relação consistente com o tema
abordado e contribua, efetivamente, para a defesa da
tese adotada pelo candidato. Assim, a mera referência
a pensadores, obras ou teorias não garante uma nota
alta nos processos seletivos da Fundação Vunesp –
ao contrário, a redação será penalizada, quando esse
repertório não estiver devidamente concatenado com
o tema abordado e com a tese defendida.
As propostas de redação da Fundação Vunesp
apresentam uma coletânea de textos motivadores
que servem como ponto de partida para a reflexão
sobre o tema que deverá ser abordado. Redações
compostas, predominantemente, por cópia desses
textos motivadores receberão nota zero e redações em
que sejam identificados trechos de cópia da coletânea
(sem predominância) ou predominância de paráfrase
desses textos motivadores (em relação a trechos
autorais) terão a nota final diminuída drasticamente,
com atribuição de pontuação mínima aos critérios B,
C e D.
Serão anuladas as redações em que seja identificada
predominância de reprodução de modelos prontos
de redação disponibilizados na internet ou em outras
fontes. A predominância de reprodução de modelos
será identificada por comparação entre modelos
disponíveis para consulta em fontes de acesso público,
bem como pela comparação entre as redações apresentadas pelos candidatos, quando evidenciada a
utilização de um mesmo modelo. Ademais, também
serão penalizadas, com atribuição de nota mínima aos
critérios B, C e D, redações que, embora não sejam
predominantemente copiadas, apresentem trechos
reproduzidos (copiados ou parafraseados) de modelos
prontos.
Atribua nota de 0 a 7 para cada critério A, B, C, D (total máximo 28 pontos).
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `,
    fuvest: `
Corrija a redação no padrão FUVEST.
Critérios de avaliação:
Desenvolvimento do tema, uso da coletânea e autoria
Espera-se que o(a) candidato(a) estabeleça relações de intertextualidade e interdiscursividade
para apropriar-se da coletânea e utilizá-la de forma referenciada para a produção de um texto
inédito, com indícios de autoria. Neste quesito, é importante que o(a) candidato(a) assuma seu
lugar de autor, a imagem que se pretende construir, bem como o leitor pretendido, além de
considerar o contexto sócio-histórico em questão.
Compreensão e atendimento da proposta quanto ao gênero e tipo de texto
Verifica-se, neste critério, se o gênero e o tipo de texto estão adequados. Essa conferência tem
como objetivo averiguar se o(a) candidato(a) empregou os traços composicionais do gênero e
do tipo de texto solicitados. Neste momento, não se avalia o desenvolvimento do texto, mas sim o
atendimento ao gênero e tipo de texto.

Recursos linguísticos (coesão e coerência) e progressão textual
Avalia-se a capacidade do(a) candidato(a) de relacionar fatos e organizá-los com estrutura
bem definida (início, meio e fim) e, também, sua habilidade para o planejamento e a construção
significativa do texto, empregando adequadamente recursos coesivos que auxiliem na coerência
e na progressão temática do texto. Avalia-se, ainda, a relação entre a estrutura composicional e
gêneros/modalidades ou tipologias textuais
Convenções da escrita e adequação vocabular
Avalia-se o domínio da norma-padrão da Língua Portuguesa. Serão examinados aspectos
gramaticais, como ortografia, morfossintaxe e pontuação, e o emprego adequado e expressivo
do vocabulário. Espera-se que o(a) candidato(a) revele competência para expor com precisão
e concisão o conteúdo adotado, evitando o uso de clichês ou frases feitas. Avalia-se, também, a
seleção adequada do vocabulário, tendo em vista as peculiaridades do tipo de texto exigido.
Atribua nota de 0 a 12,5 para cada critério A, B, C, D (total máximo 50).
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `,
    unicamp: `
Corrija a redação no padrão UNICAMP.
Critérios de avaliação:
1) proposta temática: os candidatos devem cumprir a(s) tarefa(s) que está(ão) sendo solicitada(s),
observando o recorte temático e as instruções do enunciado;
2) gênero: o texto elaborado deve ser representativo do gênero discursivo solicitado tendo em
vista a situação de produção, circulação e os interlocutores nela implicados;
3) leitura: é esperado que os candidatos façam uma leitura crítica do(s) texto(s) fornecido(s)
na proposta e saibam mobilizá-lo(s) em função do seu projeto de escrita, e não simplesmente
reproduzir o(s) texto(s) ou partes dele(s) em forma de colagem;
4) articulação escrita: os textos produzidos pelos candidatos devem propiciar uma leitura fluida
e envolvente, apresentar uma articulação sintático-semântica ancorada no emprego adequado
de elementos coesivos e de outros recursos necessários à organização e clareza dos enunciados.
Os candidatos também devem demonstrar competência na seleção lexical apropriada ao estilo
dos gêneros discursivos solicitados na prova e no emprego de regras gramaticais e ortográficas
que atendem ao registro de linguagem esperado no gênero, levando sempre em consideração
a situação de produção e circulação do texto a ser elaborado.
Uma redação pode ser anulada nas seguintes situações:
1. Se o candidato abordar outro tema que não o da proposta escolhida;
2. Se o candidato não cumprir as tarefas solicitadas na proposta nem cumprir o gênero discursivo
solicitado nela;
3. Se o candidato simplesmente reproduzir os textos da prova (ou partes dos mesmos) em forma
de colagem, sejam do enunciado, sejam da coletânea da proposta escolhida.
Atribua nota de 0 a 3 para cada critério A, B, C, D (total máximo 12).
E de uma justificativa para cada nota.
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `,
    ita: `
Corrija a redação no padrão ITA/IME.
Critérios de avaliação:
A) Tema: atendimento ao tema proposto. Fuga total = desclassificação.
B) Tipo de texto: estrutura dissertativo-argumentativa, extensão 25-35 linhas.
C) Coerência: argumentação clara, repertório atualizado, defesa do ponto de vista.
D) Coesão: recursos coesivos, articulação entre partes do texto.
E) Modalidade escrita: norma-padrão, ortografia, concordância, pontuação.
Atribua nota de 0 a 2 para cada critério A, B, C, D, E (total máximo 10).
Retorne em JSON no formato:
{
  "A": { "nota": number, "motivo": string },
  "B": { "nota": number, "motivo": string },
  "C": { "nota": number, "motivo": string },
  "D": { "nota": number, "motivo": string },
  "E": { "nota": number, "motivo": string },
  "nota_final": number
}
Titulo:
${titulo}

Texto:
${texto}
    `
  };

  const prompt = prompts[vestibular];

  console.log("[DEBUG] Enviando requisição para a API Gemini...");

  async function fazerRequisicao(retentativas = 3) {
    for (let i = 0; i < retentativas; i++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        return response;
      } catch (error) {
        if (i < retentativas - 1) {
          const tempo = Math.pow(2, i) * 1000;
          await new Promise(r => setTimeout(r, tempo));
        } else {
          throw error;
        }
      }
    }
  }

  try {
    const response = await fazerRequisicao();
    console.log("[DEBUG] Resposta recebida da API!");
    console.log("[DEBUG] Response text:", response.text);

    const data = JSON.parse(response.text);

    console.log("[DEBUG] Exibindo resultado na tela...");

    let resultadoHtml = "";
    if (vestibular === "enem") {
      resultadoHtml = `
<span class="titulo-competencia">Competência 1 (Domínio da norma culta):</span>
${data.C1.nota} / 200
Motivo: ${data.C1.motivo}
<span class="titulo-competencia">Competência 2 (Compreensão do tema):</span>
${data.C2.nota} / 200
Motivo: ${data.C2.motivo}
<span class="titulo-competencia">Competência 3 (Argumentação):</span>
${data.C3.nota} / 200
Motivo: ${data.C3.motivo}
<span class="titulo-competencia">Competência 4 (Coesão):</span>
${data.C4.nota} / 200
Motivo: ${data.C4.motivo}
<span class="titulo-competencia">Competência 5 (Intervenção):</span>
${data.C5.nota} / 200
Motivo: ${data.C5.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 1000</strong>
`;
    } else if (vestibular === "vunesp") {
      resultadoHtml = `
<span class="titulo-competencia">A) Tema:</span>
${data.A.nota} / 7
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Estrutura:</span>
${data.B.nota} / 7
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Língua:</span>
${data.C.nota} / 7
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Coesão:</span>
${data.D.nota} / 7
Motivo: ${data.D.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 28</strong>
`;
    } else if (vestibular === "fuvest") {
      resultadoHtml = `
<span class="titulo-competencia">A) Tema e autoria:</span>
${data.A.nota} / 50
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Gênero e tipo:</span>
${data.B.nota} / 50
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Coesão e coerência:</span>
${data.C.nota} / 50
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Convenções da escrita:</span>
${data.D.nota} / 50
Motivo: ${data.D.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 50</strong>
`;
    } else if (vestibular === "unicamp") {
      resultadoHtml = `
<span class="titulo-competencia">A) Proposta temática:</span>
${data.A.nota} / 3
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Gênero:</span>
${data.B.nota} / 3
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Leitura:</span>
${data.C.nota} / 3
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Articulação escrita:</span>
${data.D.nota} / 3
Motivo: ${data.D.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 12</strong>
`;
    } else if (vestibular === "ita") {
      resultadoHtml = `
<span class="titulo-competencia">A) Tema:</span>
${data.A.nota} / 2
Motivo: ${data.A.motivo}
<span class="titulo-competencia">B) Tipo de texto:</span>
${data.B.nota} / 2
Motivo: ${data.B.motivo}
<span class="titulo-competencia">C) Coerência:</span>
${data.C.nota} / 2
Motivo: ${data.C.motivo}
<span class="titulo-competencia">D) Coesão:</span>
${data.D.nota} / 2
Motivo: ${data.D.motivo}
<span class="titulo-competencia">E) Modalidade escrita:</span>
${data.E.nota} / 2
Motivo: ${data.E.motivo}
<br><br>
<strong>Nota Final: ${data.nota_final} / 10</strong>
`;
    }

    document.getElementById("resultado").innerHTML = resultadoHtml;
  } catch (error) {
    document.getElementById("resultado").textContent = "Erro ao corrigir redação. Tente novamente mais tarde.";
  }

  estaCorrigindo = false;
  botao.disabled = false;
  botao.textContent = "Avaliar";
  document.querySelector(".resultado-box").scrollIntoView({
    behavior: "smooth"
  });
};