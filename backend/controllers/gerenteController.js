const { query } = require('../database');

// Listar gerentes
exports.listarGerentes = async (req, res) => {
  try {
    const result = await query('SELECT * FROM gerente ORDER BY pessoa_id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar gerentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter gerente
exports.obterGerente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM gerente WHERE pessoa_id_pessoa = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gerente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter gerente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar gerente
exports.criarGerente = async (req, res) => {
  try {
    const { pessoa_id_pessoa } = req.body;

    const result = await query(
      'INSERT INTO gerente (pessoa_id_pessoa) VALUES ($1) RETURNING *',
      [pessoa_id_pessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar gerente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar gerente
exports.deletarGerente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await query('SELECT * FROM gerente WHERE pessoa_id_pessoa = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Gerente não encontrado' });
    }

    await query('DELETE FROM gerente WHERE pessoa_id_pessoa = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar gerente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
