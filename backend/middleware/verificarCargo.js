const db = require('../database');

// verificarCargo aceita string ou array de strings. Ex: verificarCargo('Cozinheiro') ou verificarCargo(['Gerente','Entregador'])
module.exports = function verificarCargo(allowed) {
  const allowedArr = Array.isArray(allowed) 
    ? allowed.map(a => String(a).toLowerCase()) 
    : [String(allowed).toLowerCase()];

  return async (req, res, next) => {
    try {
      const user = req.user; // assume verifyToken já setou req.user (com id)
      if (!user || !user.id) {
        console.warn('Usuário não autenticado:', user);
        return res.status(401).json({ message: 'Não autenticado' });
      }

      console.log(`Verificando cargo para user ${user.id}, allowed: ${allowedArr}`);

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
      console.log(`Cargo encontrado: ${cargo}, permitidos: ${allowedArr}`);

      if (allowedArr.includes(cargo)) {
        console.log(`Cargo ${cargo} autorizado`);
        return next();
      }

      return res.status(403).json({ message: `Acesso negado: cargo '${cargo}' não autorizado` });
    } catch (err) {
      console.error('Erro no middleware verificarCargo:', err);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  };
};