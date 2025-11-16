const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const SECRET = 'segredo_super_seguro'; // ideal usar variável de ambiente

// Função para gerar token
function gerarToken(user, cargo = null) {
  // inclui cargo no token para facilitar verificações rápidas (opcional)
  const payload = { id: user.id_pessoa, email: user.email_pessoa };
  if (cargo) payload.cargo = cargo;
  return jwt.sign(payload, SECRET, { expiresIn: '2h' });
}

// Middleware para verificar token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

// 🧱 Cadastro
exports.registerUser = async (req, res) => {
  try {
    const { nome, email, senha, telefone, data_nascimento, endereco } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const pessoaResult = await db.query(
      `INSERT INTO pessoa (nome_pessoa, email_pessoa, senha_pessoa, telefone_pessoa, data_nascimento)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_pessoa`,
      [nome, email, senhaHash, telefone, data_nascimento]
    );

    const idPessoa = pessoaResult.rows[0].id_pessoa;

    // Por padrão, cadastrar como cliente
    await db.query(
      `INSERT INTO cliente (pessoa_id_pessoa, endereco_cliente) VALUES ($1, $2)`,
      [idPessoa, endereco]
    );

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao cadastrar usuário' });
  }
};

// 🔑 Login
exports.loginUser = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const userResult = await db.query(
      'SELECT * FROM pessoa WHERE email_pessoa = $1',
      [email]
    );

    if (userResult.rows.length === 0)
      return res.status(404).json({ message: 'Usuário não encontrado' });

    const user = userResult.rows[0];

    // tenta validar com bcrypt
    let senhaValida = false;
    try {
      senhaValida = await bcrypt.compare(senha, user.senha_pessoa);
    } catch (e) {
      senhaValida = false;
    }

    // se não bater, compara direto (caso senha esteja em texto puro no banco)
    if (!senhaValida && senha === user.senha_pessoa) {
      senhaValida = true;
    }

    if (!senhaValida) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    // 🔍 Verifica se o usuário é gerente (está na tabela gerente)
    const gerenteResult = await db.query(
      'SELECT * FROM gerente WHERE pessoa_id_pessoa = $1',
      [user.id_pessoa]
    );
    const isGerente = gerenteResult.rowCount > 0;

    // Verifica cargo na tabela funcionario (se existir)
    let cargo = null;
    try {
      const funcRes = await db.query('SELECT cargo_funcionario FROM funcionario WHERE pessoa_id_pessoa = $1', [user.id_pessoa]);
      if (funcRes.rows.length > 0) cargo = funcRes.rows[0].cargo_funcionario;
    } catch (e) {
      // ignora erro se tabela/registro não existir
      cargo = null;
    }
    const isCozinheiro = cargo && String(cargo).toLowerCase() === 'cozinheiro';
    const isEntregador = cargo && String(cargo).toLowerCase() === 'entregador';

    // 🔑 Gera o token JWT
  const token = gerarToken(user, cargo);

    // ✅ Resposta final do login
    res.json({
      message: 'Login bem-sucedido',
      token,
      usuario: {
        id: user.id_pessoa,
        nome: user.nome_pessoa,
        email: user.email_pessoa,
        cargo,
        isGerente,
        isCozinheiro,
        isEntregador
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no login' });
  }
};

// 👤 Perfil do usuário
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const result = await db.query(
      'SELECT id_pessoa, nome_pessoa, email_pessoa, telefone_pessoa, data_nascimento FROM pessoa WHERE id_pessoa = $1',
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};
