const db = require('../database');

// Middleware específico para acessar a cozinha (cozinheiros + gerente mestre)
async function verificarAcessoCozinha(req, res, next) {
  try {
    const user = req.user; // assume verifyToken já setou req.user (com id)
    if (!user || !user.id) {
      console.warn('Usuário não autenticado:', user);
      return res.status(401).json({ message: 'Não autenticado' });
    }

    console.log(`Verificando acesso à cozinha para user ${user.id}`);

    // Gerente mestre (ID 21) tem acesso automático
    if (user.id === 21) {
      console.log(`Gerente mestre ${user.id} autorizado`);
      return next();
    }

    // Tenta ler cargo na tabela funcionario
    const funcRes = await db.query(
      'SELECT cargo_funcionario FROM funcionario WHERE pessoa_id_pessoa = $1', 
      [user.id]
    );

    if (funcRes.rows.length === 0) {
      console.warn(`Funcionário não encontrado para pessoa_id: ${user.id}`);
      return res.status(403).json({ message: 'Acesso negado: usuário não é funcionário' });
    }

    const cargo = String(funcRes.rows[0].cargo_funcionario).toLowerCase();
    console.log(`Cargo encontrado: ${cargo}`);

    // Permite apenas cozinheiros
    if (cargo === 'cozinheiro') {
      console.log(`Cozinheiro ${user.id} autorizado`);
      return next();
    }

    return res.status(403).json({ message: `Acesso negado: cargo '${cargo}' não autorizado. Apenas cozinheiros podem acessar.` });
  } catch (err) {
    console.error('Erro no middleware verificarAcessoCozinha:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
}

module.exports = verificarAcessoCozinha;