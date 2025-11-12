// Script de diagnóstico para problemas de entrega
const { query } = require('./backend/database');

async function debugarEntregas() {
  try {
    console.log('=== DIAGNÓSTICO DE ENTREGAS ===\n');

    // 1. Verifica se há pedidos com status Pronto ou Em Entrega
    console.log('1. Buscando pedidos com status "Pronto" ou "Em Entrega"...');
    const pedidos = await query(`
      SELECT p.id_pedido, p.cliente_pessoa_id_pessoa, p.status_pedido, p.valor_total
      FROM pedido p
      WHERE p.status_pedido IN ('Pronto', 'Em Entrega')
      ORDER BY p.data_pedido DESC
    `);
    console.log(`Encontrados ${pedidos.rows.length} pedidos\n`);
    
    if (pedidos.rows.length > 0) {
      console.log('Primeiros 3 pedidos:');
      pedidos.rows.slice(0, 3).forEach(p => {
        console.log(`- Pedido #${p.id_pedido}: Cliente ID ${p.cliente_pessoa_id_pessoa}, Status: ${p.status_pedido}`);
      });
      console.log('');
    }

    // 2. Verifica se os clientes existem
    if (pedidos.rows.length > 0) {
      console.log('2. Verificando se clientes existem na tabela "pessoa"...');
      const clienteIds = pedidos.rows.map(p => p.cliente_pessoa_id_pessoa);
      const clientes = await query(`
        SELECT id_pessoa, nome_pessoa FROM pessoa WHERE id_pessoa = ANY($1::int[])
      `, [clienteIds]);
      console.log(`Encontradas ${clientes.rows.length} pessoas para ${clienteIds.length} pedidos\n`);
      
      if (clientes.rows.length !== clienteIds.length) {
        const idsEncontrados = clientes.rows.map(c => c.id_pessoa);
        const idsFaltando = clienteIds.filter(id => !idsEncontrados.includes(id));
        console.log(`⚠️  Clientes faltando: ${idsFaltando.join(', ')}\n`);
      }
    }

    // 3. Testa a query completa
    console.log('3. Testando query completa com LEFT JOIN...');
    try {
      const resultado = await query(`
        SELECT p.id_pedido, p.cliente_pessoa_id_pessoa, p.data_pedido, p.status_pedido, p.valor_total, 
               ps.nome_pessoa as cliente_nome, c.endereco_cliente
        FROM pedido p
        JOIN pessoa ps ON p.cliente_pessoa_id_pessoa = ps.id_pessoa
        LEFT JOIN cliente c ON p.cliente_pessoa_id_pessoa = c.pessoa_id_pessoa
        WHERE p.status_pedido IN ('Pronto', 'Em Entrega')
        ORDER BY p.data_pedido DESC
      `);
      console.log(`✅ Query executada com sucesso! ${resultado.rows.length} pedidos retornados\n`);
      
      if (resultado.rows.length > 0) {
        console.log('Exemplo de resultado:');
        console.log(JSON.stringify(resultado.rows[0], null, 2));
      }
    } catch (e) {
      console.log(`❌ Query falhou: ${e.message}\n`);
    }

    // 4. Verifica estrutura das tabelas
    console.log('4. Verificando se as tabelas existem...');
    const tables = ['pedido', 'pessoa', 'cliente', 'pedido_has_pizza', 'pizza'];
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table}: ${result.rows[0].count} registros`);
      } catch (e) {
        console.log(`❌ ${table}: Tabela não encontrada ou erro de acesso`);
      }
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugarEntregas();
