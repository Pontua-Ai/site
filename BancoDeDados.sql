CREATE DATABASE pontuaai;
use pontuaai;

CREATE TABLE usuario(
    id_usuario int primary key auto_increment,
    username varchar(20) not null unique,
    email varchar(100) not null unique,
    senha varchar(100) not null
);

CREATE TABLE materia(
    id_materia int primary key auto_increment,
    nome_materia varchar(200)
);

CREATE TABLE conteudo(
    id_conteudo int primary key auto_increment,
    nome_conteudo varchar (200)
);

CREATE TABLE questoes(
    id_questoes int primary key auto_increment,
    nome_materia varchar(200),
    nome_conteudo varchar(200),
    descricao text(1000),
    alternativa_Verdadeira text(500),
    alternativa_Falso_1 text(500),
    alternativa_Falso_2 text(500),
    alternativa_Falso_3 text(500),
    alternativa_Falso_4 text(500),
    FOREIGN KEY (nome_materia) REFERENCES materia(nome_materia),
    FOREIGN KEY (nome_conteudo) REFERENCES conteudo(nome_conteudo)
);

CREATE TABLE pontuacao(
    id_pontuacao int primary key auto_increment,
    id_usuario int,
    valor decimal
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);