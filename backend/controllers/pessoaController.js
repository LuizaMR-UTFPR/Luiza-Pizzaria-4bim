const { query } = require('../database');
const path = require('path');

// Abrir página do CRUD
exports.abrirCrudPessoa = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
};

// Listar todas as pessoas
exports.listarPessoas = async (req, res) => {
  try {
    const result = await query('SELECT id_pessoa, nome_pessoa, email_pessoa, telefone_pessoa, primeiro_acesso_pessoa, data_nascimento FROM pessoa ORDER BY id_pessoa');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar pessoa
exports.criarPessoa = async (req, res) => {
  try {
    const { nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, primeiro_acesso_pessoa, data_nascimento } = req.body;
    if (!nome_pessoa || !email_pessoa || !senha_pessoa) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    const result = await query(
      'INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, primeiro_acesso_pessoa, data_nascimento) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        nome_pessoa,
        email_pessoa,
        senha_pessoa,
        telefone_pessoa ?? null,
        primeiro_acesso_pessoa === 'false' ? false : true,
        data_nascimento && data_nascimento.trim() !== '' ? data_nascimento : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter pessoa por ID
exports.obterPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT id_pessoa, nome_pessoa, email_pessoa, telefone_pessoa, primeiro_acesso_pessoa, data_nascimento FROM pessoa WHERE id_pessoa = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar pessoa
exports.atualizarPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, primeiro_acesso_pessoa, data_nascimento } = req.body;
    const result = await query(
      'UPDATE pessoa SET nome_pessoa = $1, email_pessoa = $2, senha_pessoa = $3, telefone_pessoa = $4, primeiro_acesso_pessoa = $5, data_nascimento = $6 WHERE id_pessoa = $7 RETURNING *',
      [
        nome_pessoa,
        email_pessoa,
        senha_pessoa,
        telefone_pessoa ?? null,
        primeiro_acesso_pessoa === 'false' ? false : true,
        data_nascimento && data_nascimento.trim() !== '' ? data_nascimento : null,
        id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar pessoa
exports.deletarPessoa = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('DELETE FROM pessoa WHERE id_pessoa = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};