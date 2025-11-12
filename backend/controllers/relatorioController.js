const db = require('../database');

// ----------------------
// MÊS COM MAIS VENDAS
// ----------------------
exports.mesMaisVendas = async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', data_pedido), 'TMMonth') AS mes,
        COUNT(*) AS total
      FROM pedido
      WHERE data_pedido IS NOT NULL
      GROUP BY DATE_TRUNC('month', data_pedido)
      ORDER BY total DESC
      LIMIT 1;
    `;

    const result = await db.pool.query(query);

    if (result.rows.length === 0) {
      return res.json({ mes: 'Nenhum pedido encontrado', total: 0 });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar mês com mais vendas:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de mês mais vendido' });
  }
};

// ----------------------
// PIZZAS MAIS VENDIDAS
// ----------------------
exports.pizzasMaisVendidas = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.nome_pizza AS nome,
        SUM(pp.quantidade) AS quantidade
      FROM pedido_has_pizza pp
      JOIN pizza p ON p.id_pizza = pp.pizza_id_pizza
      GROUP BY p.nome_pizza
      ORDER BY quantidade DESC
      LIMIT 10;
    `;

    const result = await db.pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pizzas mais vendidas:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório de pizzas mais vendidas' });
  }
};

// ----------------------
// TODOS OS MESES (para gráfico)
// ----------------------
exports.todosOsMeses = async (req, res) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', data_pedido), 'TMMonth') AS mes,
        COUNT(*) AS total
      FROM pedido
      WHERE data_pedido IS NOT NULL
      GROUP BY DATE_TRUNC('month', data_pedido)
      ORDER BY DATE_PART('month', MIN(data_pedido));
    `;

    const result = await db.pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar todos os meses:', error);
    res.status(500).json({ error: 'Erro ao listar meses' });
  }
};
