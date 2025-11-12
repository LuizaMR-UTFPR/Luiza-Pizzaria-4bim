const { query } = require('../database');

// Listar todas as relações pizza ↔ sabor
exports.listarPizzaSabores = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pizza_has_sabor ORDER BY pizza_id_pizza, sabor_id_sabor');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pizza_sabor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar
exports.criarPizzaSabor = async (req, res) => {
  try {
    const { pizza_id_pizza, sabor_id_sabor } = req.body;

    const result = await query(
      'INSERT INTO pizza_has_sabor (pizza_id_pizza, sabor_id_sabor) VALUES ($1, $2) RETURNING *',
      [pizza_id_pizza, sabor_id_sabor]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pizza_sabor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar
exports.deletarPizzaSabor = async (req, res) => {
  try {
    const { pizza_id_pizza, sabor_id_sabor } = req.params;

    const result = await query(
      'DELETE FROM pizza_has_sabor WHERE pizza_id_pizza = $1 AND sabor_id_sabor = $2 RETURNING *',
      [pizza_id_pizza, sabor_id_sabor]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Relação pizza ↔ sabor não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pizza_sabor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
