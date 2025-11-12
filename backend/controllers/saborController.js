const db = require('../database');
const path = require('path');

exports.abrirCrudSabor = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/sabor/sabor.html'));
};

exports.listarSabores = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sabor ORDER BY id_sabor');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar sabores' });
  }
};

exports.criarSabor = async (req, res) => {
  try {
    const { nome_sabor, descricao_sabor } = req.body;
    const result = await db.query(
      'INSERT INTO sabor (nome_sabor, descricao_sabor) VALUES ($1, $2) RETURNING *',
      [nome_sabor, descricao_sabor]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar sabor' });
  }
};

exports.obterSabor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.query('SELECT * FROM sabor WHERE id_sabor = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sabor não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar sabor' });
  }
};

exports.atualizarSabor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_sabor, descricao_sabor } = req.body;
    const result = await db.query(
      'UPDATE sabor SET nome_sabor = $1, descricao_sabor = $2 WHERE id_sabor = $3 RETURNING *',
      [nome_sabor, descricao_sabor, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sabor não encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar sabor' });
  }
};

exports.deletarSabor = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM sabor WHERE id_sabor = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar sabor' });
  }
};
