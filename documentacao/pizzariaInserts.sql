-- =======================
-- INSERTS EXEMPLO
-- =======================

-- Pessoas (clientes e funcionários)
INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, data_nascimento) VALUES
('Ana Souza', 'ana@email.com', 'senha123', '11999990000', '1995-05-10'),
('Bruno Lima', 'bruno@email.com', 'senha234', '11988887777', '1988-08-20'),
('Carlos Oliveira', 'carlos@email.com', 'senha345', '11977776666', '1980-01-15');

-- Clientes
INSERT INTO cliente (pessoa_id_pessoa, endereco_cliente) VALUES
(1, 'Rua das Flores, 123'),
(2, 'Av. Paulista, 1000');

-- Funcionário
INSERT INTO funcionario (pessoa_id_pessoa, cargo_funcionario, salario_funcionario) VALUES
(3, 'Pizzaiolo', 2500.00);

-- Gerente
INSERT INTO gerente (pessoa_id_pessoa) VALUES
(3);

-- Criar a pessoa (caso ainda não exista)
INSERT INTO pessoa (id_pessoa, nome_pessoa, email_pessoa, senha_pessoa)
VALUES (21, 'Gerente Mestre', 'mestre@pizzaria.com', 'senha_mestre')
ON CONFLICT (id_pessoa) DO NOTHING;

-- Tornar o ID 21 um gerente
INSERT INTO gerente (pessoa_id_pessoa) VALUES (21)
ON CONFLICT (pessoa_id_pessoa) DO NOTHING;


-- Sabores
INSERT INTO sabor (nome_sabor, descricao_sabor) VALUES
('Mussarela', 'Queijo mussarela derretido'),
('Calabresa', 'Calabresa fatiada com cebola'),
('Portuguesa', 'Presunto, ovo, cebola, azeitona e ervilha');

-- Pizzas
INSERT INTO pizza (nome_pizza, descricao_pizza, preco_pizza) VALUES
('Pizza Mussarela', 'Pizza simples de queijo', 40.00),
('Pizza Calabresa', 'Pizza de calabresa com cebola', 45.00);

-- Relacionamento pizza x sabor
INSERT INTO pizza_has_sabor (pizza_id_pizza, sabor_id_sabor) VALUES
(1, 1), -- Mussarela
(2, 2); -- Calabresa

-- Pedido
INSERT INTO pedido (cliente_pessoa_id_pessoa, valor_total) VALUES
(1, 85.00);

-- Pedido x Pizza
INSERT INTO pedido_has_pizza (pedido_id_pedido, pizza_id_pizza, quantidade) VALUES
(1, 1, 1),
(1, 2, 1);