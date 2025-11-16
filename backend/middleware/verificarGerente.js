// middleware/verificarGerente.js
module.exports = async function verificarGerente(req, res, next) {
  try {
    const db = req.db; // conexão que já vem do middleware no server.js
    const { id_pessoa } = req.user; // id do usuário autenticado no token

    // Verifica se é gerente
    const result = await db.query(
      'SELECT * FROM gerente WHERE pessoa_id_pessoa = $1',
      [id_pessoa]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({ message: 'Acesso negado. Usuário não é gerente.' });
    }

    // Marca o tipo de gerente
    req.user.isGerente = true;
    req.user.isGerenteMestre = id_pessoa === 21; // ✅ Aqui define o gerente mestre

    next();
  } catch (error) {
    console.error('Erro ao verificar gerente:', error);
    res.status(500).json({ message: 'Erro no servidor ao verificar gerente.' });
  }
};
