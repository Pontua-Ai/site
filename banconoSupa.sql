CREATE TABLE public.alternativa (
  id_alternativa integer NOT NULL DEFAULT nextval('alternativa_id_alternativa_seq'::regclass),
  nome_alternativa character varying NOT NULL,
  id_pergunta integer,
  correta boolean NOT NULL DEFAULT false,
  CONSTRAINT alternativa_pkey PRIMARY KEY (id_alternativa),
  CONSTRAINT alternativa_id_pergunta_fkey FOREIGN KEY (id_pergunta) REFERENCES public.perguntas(id_pergunta)
);
CREATE TABLE public.conteudo (
  id_conteudo integer NOT NULL DEFAULT nextval('conteudo_id_conteudo_seq'::regclass),
  nome_conteudo character varying NOT NULL,
  id_materia integer,
  CONSTRAINT conteudo_pkey PRIMARY KEY (id_conteudo),
  CONSTRAINT conteudo_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia)
);
CREATE TABLE public.materia (
  id_materia integer NOT NULL DEFAULT nextval('materia_id_materia_seq'::regclass),
  nome_materia character varying NOT NULL,
  CONSTRAINT materia_pkey PRIMARY KEY (id_materia)
);
CREATE TABLE public.perguntas (
  id_pergunta integer NOT NULL DEFAULT nextval('perguntas_id_pergunta_seq'::regclass),
  pergunta_texto text NOT NULL,
  id_conteudo integer,
  id_materia integer,
  CONSTRAINT perguntas_pkey PRIMARY KEY (id_pergunta),
  CONSTRAINT perguntas_id_conteudo_fkey FOREIGN KEY (id_conteudo) REFERENCES public.conteudo(id_conteudo),
  CONSTRAINT perguntas_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.materia(id_materia)
);
CREATE TABLE public.pontuacao_atividade (
  id_pontuacao_atividade integer NOT NULL DEFAULT nextval('pontuacao_atividade_id_pontuacao_atividade_seq'::regclass),
  id_alternativa integer,
  pontos_atividade integer NOT NULL DEFAULT 0,
  CONSTRAINT pontuacao_atividade_pkey PRIMARY KEY (id_pontuacao_atividade),
  CONSTRAINT pontuacao_atividade_id_alternativa_fkey FOREIGN KEY (id_alternativa) REFERENCES public.alternativa(id_alternativa)
);
CREATE TABLE public.redacao (
  id_redacao integer NOT NULL DEFAULT nextval('redacao_id_redacao_seq'::regclass),
  id_usuario integer,
  pontos_redacao integer NOT NULL DEFAULT 0,
  texto_redacao text,
  data_redacao date DEFAULT now(),
  CONSTRAINT redacao_pkey PRIMARY KEY (id_redacao),
  CONSTRAINT redacao_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.users(id_usuario)
);
CREATE TABLE public.users (
  id_usuario integer NOT NULL DEFAULT nextval('users_id_usuario_seq'::regclass),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  senha character varying NOT NULL,
  tipo_conta character varying DEFAULT 'professor'::character varying,
  foto_url text,
  data_criacao timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id_usuario)
);

-- Função para validar email institucional e definir tipo de conta
CREATE OR REPLACE FUNCTION validar_email_institucional()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se é email institucional
  IF NEW.email NOT LIKE '%@cps.sp.gov.br' AND NEW.email NOT LIKE '%@aluno.cps.sp.gov.br' THEN
    RAISE EXCEPTION 'Apenas emails institucionais (@cps.sp.gov.br ou @aluno.cps.sp.gov.br) são permitidos.';
  END IF;

  -- Define o tipo de conta baseado no domínio
  IF NEW.email LIKE '%@aluno.cps.sp.gov.br' THEN
    NEW.tipo_conta := 'aluno';
  ELSE
    NEW.tipo_conta := 'professor';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar antes de inserir/atualizar usuário
CREATE TRIGGER trigger_validar_email
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION validar_email_institucional();