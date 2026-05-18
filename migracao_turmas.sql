-- Script para criar as tabelas de Turmas no Supabase
-- Execute isso no SQL Editor do Supabase Dashboard

-- 1. Tabela de turmas
CREATE TABLE IF NOT EXISTS public.turma (
    id_turma SERIAL PRIMARY KEY,
    nome_turma VARCHAR NOT NULL,
    id_professor INTEGER NOT NULL REFERENCES public.users(id_usuario),
    codigo_acesso VARCHAR UNIQUE
);

-- 2. Relação turma x aluno
CREATE TABLE IF NOT EXISTS public.turma_aluno (
    id_turma INTEGER NOT NULL REFERENCES public.turma(id_turma) ON DELETE CASCADE,
    id_aluno INTEGER NOT NULL REFERENCES public.users(id_usuario) ON DELETE CASCADE,
    PRIMARY KEY (id_turma, id_aluno)
);

-- 3. Relação matéria x turma
CREATE TABLE IF NOT EXISTS public.materia_turma (
    id_materia INTEGER NOT NULL REFERENCES public.materia(id_materia) ON DELETE CASCADE,
    id_turma INTEGER NOT NULL REFERENCES public.turma(id_turma) ON DELETE CASCADE,
    PRIMARY KEY (id_materia, id_turma)
);
