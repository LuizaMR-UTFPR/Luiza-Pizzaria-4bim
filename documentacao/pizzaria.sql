-- Criando o schema e configurando o search_path
SET search_path TO public;

-- =======================
-- Tabela pessoa (clientes, funcionários, gerentes)
-- =======================
CREATE TABLE pessoa (
  id_pessoa SERIAL PRIMARY KEY,
  nome_pessoa VARCHAR(50) NOT NULL,
  email_pessoa VARCHAR(70) NOT NULL UNIQUE,
  senha_pessoa VARCHAR(32) NOT NULL,
  telefone_pessoa VARCHAR(20),
  primeiro_acesso_pessoa BOOLEAN NOT NULL DEFAULT TRUE,
  data_nascimento TIMESTAMP DEFAULT NULL
);

-- =======================
-- Tabela cliente
-- =======================
CREATE TABLE cliente (
  pessoa_id_pessoa INTEGER PRIMARY KEY,
  endereco_cliente VARCHAR(100) NOT NULL
);

-- =======================
-- Tabela funcionario
-- =======================
CREATE TABLE funcionario (
  pessoa_id_pessoa INTEGER PRIMARY KEY,
  cargo_funcionario VARCHAR(45) NOT NULL,
  salario_funcionario NUMERIC(10,2) NOT NULL
);

-- =======================
-- Tabela gerente
-- =======================
CREATE TABLE gerente (
  pessoa_id_pessoa INTEGER PRIMARY KEY
);

-- =======================
-- Tabela cozinheiro
-- =======================
CREATE TABLE cozinheiro (
  pessoa_id_pessoa INTEGER PRIMARY KEY
);

-- =======================
-- Tabela entregador
-- =======================
CREATE TABLE entregador (
  pessoa_id_pessoa INTEGER PRIMARY KEY
);

-- =======================
-- Tabela pizza
-- =======================
CREATE TABLE pizza (
  id_pizza SERIAL PRIMARY KEY,
  nome_pizza VARCHAR(50) NOT NULL,
  descricao_pizza VARCHAR(255),
  preco_pizza NUMERIC(10,2) NOT NULL
);

-- =======================
-- Tabela pizza_imagem (imagem da pizza)
-- =======================
CREATE TABLE pizza_imagem (
  id_imagem SERIAL PRIMARY KEY,
  pizza_id_pizza INTEGER NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_imagem VARCHAR(255) NOT NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pizza_id_pizza) REFERENCES pizza (id_pizza) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE(pizza_id_pizza)
);

-- Índice para melhorar consultas por pizza
CREATE INDEX IF NOT EXISTS idx_pizza_imagem_pizza_id ON pizza_imagem(pizza_id_pizza);

-- =======================
-- Tabela sabor
-- =======================
CREATE TABLE sabor (
  id_sabor SERIAL PRIMARY KEY,
  nome_sabor VARCHAR(50) NOT NULL,
  descricao_sabor VARCHAR(255)
);

-- =======================
-- Relacionamento pizza x sabor (N:N)
-- =======================
CREATE TABLE pizza_has_sabor (
  pizza_id_pizza INTEGER NOT NULL,
  sabor_id_sabor INTEGER NOT NULL,
  PRIMARY KEY (pizza_id_pizza, sabor_id_sabor)
);

-- =======================
-- Tabela pedido
-- =======================
CREATE TABLE pedido (
  id_pedido SERIAL PRIMARY KEY,
  cliente_pessoa_id_pessoa INTEGER NOT NULL,
  data_pedido TIMESTAMP NOT NULL DEFAULT NOW(),
  status_pedido VARCHAR(20) NOT NULL DEFAULT 'Pendente',
  valor_total NUMERIC(10,2) NOT NULL
);

-- =======================
-- Relacionamento pedido x pizza (N:N)
-- =======================
CREATE TABLE pedido_has_pizza (
  pedido_id_pedido INTEGER NOT NULL,
  pizza_id_pizza INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (pedido_id_pedido, pizza_id_pizza)
);

-- =======================
-- CONSTRAINTS
-- =======================
ALTER TABLE cliente ADD CONSTRAINT fk_cliente_pessoa
  FOREIGN KEY (pessoa_id_pessoa)
  REFERENCES pessoa (id_pessoa)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE funcionario ADD CONSTRAINT fk_funcionario_pessoa
  FOREIGN KEY (pessoa_id_pessoa)
  REFERENCES pessoa (id_pessoa)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE gerente ADD CONSTRAINT fk_gerente_pessoa
  FOREIGN KEY (pessoa_id_pessoa)
  REFERENCES pessoa (id_pessoa)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pizza_has_sabor ADD CONSTRAINT fk_pizza_sabor_pizza
  FOREIGN KEY (pizza_id_pizza)
  REFERENCES pizza (id_pizza)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pizza_has_sabor ADD CONSTRAINT fk_pizza_sabor_sabor
  FOREIGN KEY (sabor_id_sabor)
  REFERENCES sabor (id_sabor)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido ADD CONSTRAINT fk_pedido_cliente
  FOREIGN KEY (cliente_pessoa_id_pessoa)
  REFERENCES cliente (pessoa_id_pessoa)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido_has_pizza ADD CONSTRAINT fk_pedido_pizza_pedido
  FOREIGN KEY (pedido_id_pedido)
  REFERENCES pedido (id_pedido)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE pedido_has_pizza ADD CONSTRAINT fk_pedido_pizza_pizza
  FOREIGN KEY (pizza_id_pizza)
  REFERENCES pizza (id_pizza)
  ON DELETE CASCADE ON UPDATE CASCADE;

---------------------------------------------------------------------------------------
-- DROP TABLE --
---------------------------------------------------------------------------------------
DROP TABLE IF EXISTS pedido_has_pizza CASCADE;

CREATE TABLE pedido_has_pizza (
  pedido_id_pedido INTEGER NOT NULL,
  pizza_id_pizza INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  nome_pizza VARCHAR(50) NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  valor_total_item NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (pedido_id_pedido, pizza_id_pizza),
  CONSTRAINT fk_pedido_pizza_pedido FOREIGN KEY (pedido_id_pedido)
    REFERENCES pedido (id_pedido)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pedido_pizza_pizza FOREIGN KEY (pizza_id_pizza)
    REFERENCES pizza (id_pizza)
    ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE pedido CASCADE;
DROP TABLE pedido_has_pizza CASCADE;

-- Tabela pedido
CREATE TABLE pedido (
  id_pedido SERIAL PRIMARY KEY,
  cliente_pessoa_id_pessoa INTEGER NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  status_pedido VARCHAR(50) DEFAULT 'Pendente',
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela pedido_has_pizza (relacionamento N:N entre pedido e pizza)
CREATE TABLE pedido_has_pizza (
  pedido_id_pedido INTEGER NOT NULL,
  pizza_id_pizza INTEGER NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (pedido_id_pedido, pizza_id_pizza),
  FOREIGN KEY (pedido_id_pedido) REFERENCES pedido (id_pedido) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (pizza_id_pizza) REFERENCES pizza (id_pizza) ON DELETE CASCADE ON UPDATE CASCADE
);