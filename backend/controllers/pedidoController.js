const { query } = require('../database');
const path = require('path');

// Abre a página do CRUD
exports.abrirCrudPedido = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
};

// Lista todos os pedidos
exports.listarPedidos = async (req, res) => {
  try {
    const pedidos = await query('SELECT * FROM pedido ORDER BY id_pedido');
    for (const pedido of pedidos.rows) {
      const itens = await query(
        'SELECT pizza_id_pizza, quantidade FROM pedido_has_pizza WHERE pedido_id_pedido = $1',
        [pedido.id_pedido]
      );
      pedido.pizzas = itens.rows;
    }
    res.json(pedidos.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// Cria um novo pedido e seus itens
exports.criarPedido = async (req, res) => {
  try {
    const { cliente_pessoa_id_pessoa, valor_total, status_pedido, pizzas } = req.body;

    if (!cliente_pessoa_id_pessoa || !valor_total || !Array.isArray(pizzas) || pizzas.length === 0) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    // Gera automaticamente a data/hora atual do pedido (hora local - 2 horas)
    const agora = new Date();
    agora.setHours(agora.getHours() - 2);
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(agora);
    const dataPedido = dataFormatada;

    const pedidoResult = await query(
      `INSERT INTO pedido (cliente_pessoa_id_pessoa, valor_total, status_pedido, data_pedido)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cliente_pessoa_id_pessoa, valor_total, status_pedido ?? 'Pendente', dataPedido]
    );

    const pedido = pedidoResult.rows[0];

    for (const item of pizzas) {
      await query(
        `INSERT INTO pedido_has_pizza (pedido_id_pedido, pizza_id_pizza, quantidade)
         VALUES ($1, $2, $3)`,
        [pedido.id_pedido, item.pizza_id_pizza, item.quantidade ?? 1]
      );
    }

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};


// Busca um pedido por ID
exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pedidoResult = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    const pedido = pedidoResult.rows[0];
    const itens = await query(
      'SELECT pizza_id_pizza, quantidade FROM pedido_has_pizza WHERE pedido_id_pedido = $1',
      [id]
    );
    pedido.pizzas = itens.rows;
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualiza pedido e seus itens
exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { cliente_pessoa_id_pessoa, valor_total, status_pedido, data_pedido, pizzas } = req.body;
    const pedidoResult = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    const current = pedidoResult.rows[0];
    const updated = {
      cliente: cliente_pessoa_id_pessoa ?? current.cliente_pessoa_id_pessoa,
      valor: valor_total ?? current.valor_total,
      status: status_pedido ?? current.status_pedido,
      data: data_pedido && data_pedido.trim() !== '' ? data_pedido : current.data_pedido
    };
    const result = await query(
      'UPDATE pedido SET cliente_pessoa_id_pessoa = $1, valor_total = $2, status_pedido = $3, data_pedido = $4 WHERE id_pedido = $5 RETURNING *',
      [updated.cliente, updated.valor, updated.status, updated.data, id]
    );
    // Atualiza os itens do pedido
    if (Array.isArray(pizzas)) {
      await query('DELETE FROM pedido_has_pizza WHERE pedido_id_pedido = $1', [id]);
      for (const item of pizzas) {
        await query(
          'INSERT INTO pedido_has_pizza (pedido_id_pedido, pizza_id_pizza, quantidade) VALUES ($1, $2, $3)',
          [id, item.pizza_id_pizza, item.quantidade ?? 1]
        );
      }
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Exclui pedido e seus itens
exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pedidoResult = await query('SELECT * FROM pedido WHERE id_pedido = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    await query('DELETE FROM pedido_has_pizza WHERE pedido_id_pedido = $1', [id]);
    await query('DELETE FROM pedido WHERE id_pedido = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Endpoints para cozinheiros

// Lista pedidos pendentes e em preparo
exports.listarPedidosCozinha = async (req, res) => {
  try {
    const pedidos = await query(`
      SELECT p.id_pedido, p.cliente_pessoa_id_pessoa, p.data_pedido, p.status_pedido, p.valor_total, 
             ps.nome_pessoa as cliente_nome
      FROM pedido p
      JOIN pessoa ps ON p.cliente_pessoa_id_pessoa = ps.id_pessoa
      WHERE p.status_pedido IN ('Pendente', 'Em Preparo')
      ORDER BY p.data_pedido DESC
    `);

    // Adiciona os itens de cada pedido
    for (const pedido of pedidos.rows) {
      const itens = await query(`
        SELECT php.quantidade, pz.nome_pizza 
        FROM pedido_has_pizza php
        JOIN pizza pz ON php.pizza_id_pizza = pz.id_pizza
        WHERE php.pedido_id_pedido = $1
      `, [pedido.id_pedido]);
      
      pedido.items = itens.rows;
    }

    res.json(pedidos.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos da cozinha:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
};

// Inicia o preparo de um pedido
exports.iniciarPreparo = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      'UPDATE pedido SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *',
      ['Em Preparo', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao iniciar preparo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Marca pedido como pronto
exports.marcarPronto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      'UPDATE pedido SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *',
      ['Pronto', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao marcar pedido como pronto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Endpoints para entregadores

// Lista pedidos prontos e em entrega
exports.listarPedidosEntrega = async (req, res) => {
  try {
    console.log('Iniciando listagem de pedidos para entrega...');
    
    // Primeiro verifica se existem pedidos com esses status
    const checkPedidos = await query(`
      SELECT COUNT(*) as total FROM pedido 
      WHERE status_pedido IN ('Pronto', 'Em Entrega')
    `);
    console.log(`Pedidos com status Pronto/Em Entrega: ${checkPedidos.rows[0].total}`);

    const pedidos = await query(`
      SELECT p.id_pedido, p.cliente_pessoa_id_pessoa, p.data_pedido, p.status_pedido, p.valor_total, 
             ps.nome_pessoa as cliente_nome, COALESCE(c.endereco_cliente, 'Endereço não fornecido') as endereco_cliente
      FROM pedido p
      JOIN pessoa ps ON p.cliente_pessoa_id_pessoa = ps.id_pessoa
      LEFT JOIN cliente c ON p.cliente_pessoa_id_pessoa = c.pessoa_id_pessoa
      WHERE p.status_pedido IN ('Pronto', 'Em Entrega')
      ORDER BY p.data_pedido DESC
    `);

    console.log(`Pedidos encontrados: ${pedidos.rows.length}`);

    // Adiciona os itens de cada pedido
    for (const pedido of pedidos.rows) {
      try {
        const itens = await query(`
          SELECT php.quantidade, pz.nome_pizza 
          FROM pedido_has_pizza php
          JOIN pizza pz ON php.pizza_id_pizza = pz.id_pizza
          WHERE php.pedido_id_pedido = $1
        `, [pedido.id_pedido]);
        
        pedido.items = itens.rows;
      } catch (itemError) {
        console.error(`Erro ao buscar itens do pedido ${pedido.id_pedido}:`, itemError);
        pedido.items = [];
      }
    }

    console.log('Pedidos processados com sucesso');
    res.json(pedidos.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos de entrega:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Erro ao buscar pedidos para entrega', error: error.message });
  }
};

// Inicia a entrega de um pedido
exports.iniciarEntrega = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      'UPDATE pedido SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *',
      ['Em Entrega', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao iniciar entrega:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

// Marca pedido como entregue
exports.marcarEntregue = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query(
      'UPDATE pedido SET status_pedido = $1 WHERE id_pedido = $2 RETURNING *',
      ['Entregue', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao marcar pedido como entregue:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};