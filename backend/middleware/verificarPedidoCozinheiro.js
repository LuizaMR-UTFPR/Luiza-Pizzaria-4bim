const db = require('../database');

// Middleware para verificar se o pedido pertence ao cozinheiro e está no status correto
async function verificarPedidoCozinheiro(req, res, next) {
  try {
    const idPedido = parseInt(req.params.id);
    const result = await db.query('SELECT status_pedido FROM pedido WHERE id_pedido = $1', [idPedido]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    const pedido = result.rows[0];
    const statusPermitidos = {
      '/preparo': ['Pendente'],
      '/pronto': ['Em Preparo']
    };

    // Verifica se o status atual permite a ação desejada
    const endpoint = req.path.substring(req.path.lastIndexOf('/'));
    if (!statusPermitidos[endpoint]?.includes(pedido.status_pedido)) {
      return res.status(400).json({ 
        message: `Não é possível realizar esta ação. Status atual: ${pedido.status_pedido}`
      });
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar pedido:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

module.exports = verificarPedidoCozinheiro;