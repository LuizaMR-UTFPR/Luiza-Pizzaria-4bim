const { query } = require('../database');
const path = require('path');

exports.abrirCrudPizza = (req, res) => {
  console.log('pizzaController - Rota /abrirCrudPizza - abrir o crudPizza');
  res.sendFile(path.join(__dirname, '../../frontend/pizza/pizza.html'));
};

exports.listarPizzas = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pizza ORDER BY id_pizza');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pizzas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.criarPizza = async (req, res) => {
  try {
    const { nome_pizza, descricao_pizza, preco_pizza } = req.body;

    if (!nome_pizza || !preco_pizza) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const result = await query(
      'INSERT INTO pizza (nome_pizza, descricao_pizza, preco_pizza) VALUES ($1, $2, $3) RETURNING *',
      [nome_pizza, descricao_pizza, preco_pizza]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pizza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterPizza = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM pizza WHERE id_pizza = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pizza não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pizza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarPizza = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_pizza, descricao_pizza, preco_pizza } = req.body;

    const existing = await query('SELECT * FROM pizza WHERE id_pizza = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pizza não encontrada' });
    }

    const current = existing.rows[0];
    const updated = {
      nome: nome_pizza ?? current.nome_pizza,
      descricao: descricao_pizza ?? current.descricao_pizza,
      preco: preco_pizza ?? current.preco_pizza
    };

    const result = await query(
      'UPDATE pizza SET nome_pizza = $1, descricao_pizza = $2, preco_pizza = $3 WHERE id_pizza = $4 RETURNING *',
      [updated.nome, updated.descricao, updated.preco, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pizza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarPizza = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await query('SELECT * FROM pizza WHERE id_pizza = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pizza não encontrada' });
    }

    await query('DELETE FROM pizza WHERE id_pizza = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pizza:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
