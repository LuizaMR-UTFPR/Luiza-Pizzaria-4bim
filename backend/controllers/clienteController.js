const db = require('../database');
const path = require('path');

exports.abrirCrudCliente = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/cliente/cliente.html'));
};

// Listar todos os clientes
exports.listarClientes = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT pessoa_id_pessoa, endereco_cliente FROM cliente ORDER BY pessoa_id_pessoa'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro ao listar clientes' });
  }
};

// Criar cliente
exports.criarCliente = async (req, res) => {
  try {
    const { pessoa_id_pessoa, endereco_cliente } = req.body;
    const result = await db.query(
      'INSERT INTO cliente (pessoa_id_pessoa, endereco_cliente) VALUES ($1, $2) RETURNING *',
      [pessoa_id_pessoa, endereco_cliente]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
};

// Obter cliente por ID (pessoa_id_pessoa)
exports.obterCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.query(
      'SELECT pessoa_id_pessoa, endereco_cliente FROM cliente WHERE pessoa_id_pessoa = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
};

// Atualizar cliente
exports.atualizarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { endereco_cliente } = req.body;
    const result = await db.query(
      'UPDATE cliente SET endereco_cliente = $1 WHERE pessoa_id_pessoa = $2 RETURNING *',
      [endereco_cliente, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
};

// Deletar cliente
exports.deletarCliente = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.query(
      'DELETE FROM cliente WHERE pessoa_id_pessoa = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ message: 'Cliente excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
};
