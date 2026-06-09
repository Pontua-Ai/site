-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  token_confirmacao text,
  confirmado boolean DEFAULT false,
  auth_id uuid UNIQUE,
  token_recuperacao text,
  senha text,
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  id_usuario integer NOT NULL DEFAULT nextval('users_id_usuario_seq'::regclass),
  tipo_conta character varying DEFAULT 'professor'::character varying,
  foto_url text,
  data_criacao timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id_usuario)
);
CREATE TABLE public.materia (
  id_usuario integer,
  nome_materia character varying NOT NULL,
  id_materia integer NOT NULL DEFAULT nextval('materia_id_materia_seq'::regclass),
  CONSTRAINT materia_pkey PRIMARY KEY (id_materia),
  CONSTRAINT materia_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.conteudo (
  id_usuario integer,
  nome_conteudo character varying NOT NULL,
  id_materia integer,
  id_conteudo integer NOT NULL DEFAULT nextval('conteudo_id_conteudo_seq'::regclass),
  CONSTRAINT conteudo_pkey PRIMARY KEY (id_conteudo),
  CONSTRAINT conteudo_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario),
  CONSTRAINT conteudo_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia)
);
CREATE TABLE public.perguntas (
  id_materia integer,
  id_usuario integer,
  visibilidade character varying DEFAULT 'publico'::character varying,
  data_pergunta timestamp without time zone DEFAULT now(),
  id_conteudo integer,
  id_pergunta integer NOT NULL DEFAULT nextval('perguntas_id_pergunta_seq'::regclass),
  pergunta_texto text NOT NULL,
  CONSTRAINT perguntas_pkey PRIMARY KEY (id_pergunta),
  CONSTRAINT perguntas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario),
  CONSTRAINT perguntas_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia),
  CONSTRAINT perguntas_id_conteudo_fkey FOREIGN KEY (id_conteudo) REFERENCES public.conteudo(id_conteudo)
);
CREATE TABLE public.alternativa (
  nome_alternativa character varying NOT NULL,
  id_pergunta integer,
  id_alternativa integer NOT NULL DEFAULT nextval('alternativa_id_alternativa_seq'::regclass),
  correta boolean NOT NULL DEFAULT false,
  CONSTRAINT alternativa_pkey PRIMARY KEY (id_alternativa),
  CONSTRAINT alternativa_id_pergunta_fkey FOREIGN KEY (id_pergunta) REFERENCES public.perguntas(id_pergunta)
);
CREATE TABLE public.pontuacao_atividade (
  id_usuario integer,
  id_materia integer,
  id_conteudo integer,
  data_atividade timestamp without time zone DEFAULT now(),
  id_alternativa integer,
  id_pontuacao_atividade integer NOT NULL DEFAULT nextval('pontuacao_atividade_id_pontuacao_atividade_seq'::regclass),
  pontos_atividade integer NOT NULL DEFAULT 0,
  CONSTRAINT pontuacao_atividade_pkey PRIMARY KEY (id_pontuacao_atividade),
  CONSTRAINT pontuacao_atividade_id_alternativa_fkey FOREIGN KEY (id_alternativa) REFERENCES public.alternativa(id_alternativa),
  CONSTRAINT pontuacao_atividade_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario),
  CONSTRAINT pontuacao_atividade_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia),
  CONSTRAINT pontuacao_atividade_id_conteudo_fkey FOREIGN KEY (id_conteudo) REFERENCES public.conteudo(id_conteudo)
);
CREATE TABLE public.redacao (
  id_usuario integer,
  texto_redacao text,
  id_redacao integer NOT NULL DEFAULT nextval('redacao_id_redacao_seq'::regclass),
  pontos_redacao integer NOT NULL DEFAULT 0,
  data_redacao date DEFAULT now(),
  CONSTRAINT redacao_pkey PRIMARY KEY (id_redacao),
  CONSTRAINT redacao_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.materia_oculta (
  id_materia integer NOT NULL,
  id_usuario integer NOT NULL,
  CONSTRAINT materia_oculta_pkey PRIMARY KEY (id_materia, id_usuario),
  CONSTRAINT materia_oculta_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia),
  CONSTRAINT materia_oculta_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.conteudo_oculto (
  id_conteudo integer NOT NULL,
  id_usuario integer NOT NULL,
  CONSTRAINT conteudo_oculto_pkey PRIMARY KEY (id_conteudo, id_usuario),
  CONSTRAINT conteudo_oculto_id_conteudo_fkey FOREIGN KEY (id_conteudo) REFERENCES public.conteudo(id_conteudo),
  CONSTRAINT conteudo_oculto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.turma (
  nome_turma character varying NOT NULL,
  id_professor integer NOT NULL,
  codigo_acesso character varying UNIQUE,
  id_turma integer NOT NULL DEFAULT nextval('turma_id_turma_seq'::regclass),
  CONSTRAINT turma_pkey PRIMARY KEY (id_turma),
  CONSTRAINT turma_id_professor_fkey FOREIGN KEY (id_professor) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.turma_aluno (
  id_turma integer NOT NULL,
  id_aluno integer NOT NULL,
  CONSTRAINT turma_aluno_pkey PRIMARY KEY (id_turma, id_aluno),
  CONSTRAINT turma_aluno_id_turma_fkey FOREIGN KEY (id_turma) REFERENCES public.turma(id_turma),
  CONSTRAINT turma_aluno_id_aluno_fkey FOREIGN KEY (id_aluno) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.materia_turma (
  id_materia integer NOT NULL,
  id_turma integer NOT NULL,
  CONSTRAINT materia_turma_pkey PRIMARY KEY (id_materia, id_turma),
  CONSTRAINT materia_turma_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia),
  CONSTRAINT materia_turma_id_turma_fkey FOREIGN KEY (id_turma) REFERENCES public.turma(id_turma)
);