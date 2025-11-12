const { query, transaction } = require('../database');

// Listar funcionários
exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query('SELECT * FROM funcionario ORDER BY pessoa_id_pessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter funcionário
exports.obterFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await query('SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar funcionário
exports.criarFuncionario = async (req, res) => {
  try {
    const { pessoa_id_pessoa, cargo_funcionario, salario_funcionario } = req.body;

    // Usa transação para garantir consistência entre funcionario e gerente
    const result = await transaction(async (client) => {
      const insertRes = await client.query(
        'INSERT INTO funcionario (pessoa_id_pessoa, cargo_funcionario, salario_funcionario) VALUES ($1, $2, $3) RETURNING *',
        [pessoa_id_pessoa, cargo_funcionario, salario_funcionario]
      );

      // Se o cargo for Gerente, cria / garante a entrada em gerente
      if (cargo_funcionario && String(cargo_funcionario).toLowerCase() === 'gerente') {
        await client.query(
          'INSERT INTO gerente (pessoa_id_pessoa) VALUES ($1) ON CONFLICT (pessoa_id_pessoa) DO NOTHING',
          [pessoa_id_pessoa]
        );
      }

      // Se o cargo for Cozinheiro, cria / garante a entrada em cozinheiro
      if (cargo_funcionario && String(cargo_funcionario).toLowerCase() === 'cozinheiro') {
        await client.query(
          'INSERT INTO cozinheiro (pessoa_id_pessoa) VALUES ($1) ON CONFLICT (pessoa_id_pessoa) DO NOTHING',
          [pessoa_id_pessoa]
        );
      }

      // Se o cargo for Entregador, cria / garante a entrada em entregador
      if (cargo_funcionario && String(cargo_funcionario).toLowerCase() === 'entregador') {
        await client.query(
          'INSERT INTO entregador (pessoa_id_pessoa) VALUES ($1) ON CONFLICT (pessoa_id_pessoa) DO NOTHING',
          [pessoa_id_pessoa]
        );
      }

      return insertRes;
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar funcionário
exports.atualizarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { cargo_funcionario, salario_funcionario } = req.body;

    // Faz a atualização dentro de uma transação para sincronizar a tabela gerente
    const result = await transaction(async (client) => {
      const existing = await client.query('SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);
      if (existing.rows.length === 0) {
        const err = new Error('Funcionário não encontrado');
        err.statusCode = 404;
        throw err;
      }

      const current = existing.rows[0];
      const newCargo = cargo_funcionario ?? current.cargo_funcionario;
      const newSalario = salario_funcionario ?? current.salario_funcionario;

      const updateRes = await client.query(
        'UPDATE funcionario SET cargo_funcionario = $1, salario_funcionario = $2 WHERE pessoa_id_pessoa = $3 RETURNING *',
        [newCargo, newSalario, id]
      );

      // Verifica mudanças de cargo para sincronizar gerente, cozinheiro e entregador
      const wasGerente = current.cargo_funcionario && String(current.cargo_funcionario).toLowerCase() === 'gerente';
      const isGerenteNow = newCargo && String(newCargo).toLowerCase() === 'gerente';

      const wasCozinheiro = current.cargo_funcionario && String(current.cargo_funcionario).toLowerCase() === 'cozinheiro';
      const isCozinheiroNow = newCargo && String(newCargo).toLowerCase() === 'cozinheiro';

      const wasEntregador = current.cargo_funcionario && String(current.cargo_funcionario).toLowerCase() === 'entregador';
      const isEntregadorNow = newCargo && String(newCargo).toLowerCase() === 'entregador';

      // gerente
      if (!wasGerente && isGerenteNow) {
        await client.query('INSERT INTO gerente (pessoa_id_pessoa) VALUES ($1) ON CONFLICT (pessoa_id_pessoa) DO NOTHING', [id]);
      } else if (wasGerente && !isGerenteNow) {
        await client.query('DELETE FROM gerente WHERE pessoa_id_pessoa = $1', [id]);
      }

      // cozinheiro
      if (!wasCozinheiro && isCozinheiroNow) {
        await client.query('INSERT INTO cozinheiro (pessoa_id_pessoa) VALUES ($1) ON CONFLICT (pessoa_id_pessoa) DO NOTHING', [id]);
      } else if (wasCozinheiro && !isCozinheiroNow) {
        await client.query('DELETE FROM cozinheiro WHERE pessoa_id_pessoa = $1', [id]);
      }

      // entregador
      if (!wasEntregador && isEntregadorNow) {
        await client.query('INSERT INTO entregador (pessoa_id_pessoa) VALUES ($1) ON CONFLICT (pessoa_id_pessoa) DO NOTHING', [id]);
      } else if (wasEntregador && !isEntregadorNow) {
        await client.query('DELETE FROM entregador WHERE pessoa_id_pessoa = $1', [id]);
      }

      return updateRes;
    });

    res.json(result.rows[0]);
  } catch (error) {
    if (error && error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar funcionário
exports.deletarFuncionario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Use transação para remover funcionario e, se existir, a entrada em gerente
    await transaction(async (client) => {
      const existing = await client.query('SELECT * FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);
      if (existing.rows.length === 0) {
        const err = new Error('Funcionário não encontrado');
        err.statusCode = 404;
        throw err;
      }

      // Deleta o funcionário
      await client.query('DELETE FROM funcionario WHERE pessoa_id_pessoa = $1', [id]);

      // Remove também da tabela gerente caso exista (manter consistência)
      await client.query('DELETE FROM gerente WHERE pessoa_id_pessoa = $1', [id]);

      // Remove também da tabela cozinheiro e entregador caso existam
      await client.query('DELETE FROM cozinheiro WHERE pessoa_id_pessoa = $1', [id]);
      await client.query('DELETE FROM entregador WHERE pessoa_id_pessoa = $1', [id]);
    });

    res.status(204).send();
  } catch (error) {
    if (error && error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error('Erro ao deletar funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
