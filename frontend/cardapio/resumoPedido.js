const pedido = JSON.parse(localStorage.getItem('pedidoResumo'));
const resumoContainer = document.getElementById('resumoContainer');
const btnCancelar = document.getElementById('btnCancelar');
const btnConfirmar = document.getElementById('btnConfirmar');

async function obterNomeCliente(id) {
  try {
    const res = await fetch(`http://localhost:3001/pessoa/${id}`);
    if (res.ok) {
      const pessoa = await res.json();
      return pessoa.nome_pessoa || `Cliente ${id}`;
    }
  } catch {}
  return `Cliente ${id}`;
}

async function renderizarResumo() {
  if (!pedido) {
    resumoContainer.innerHTML = '<p>Nenhum pedido para mostrar.</p>';
    btnCancelar.style.display = 'none';
    btnConfirmar.style.display = 'none';
    return;
  }
  let html = ''; // Removido: `<h2>Cliente: ...</h2>`
  html += `<table>
    <thead>
      <tr>
        <th>Pizza</th>
        <th>Quantidade</th>
        <th>Preço Unitário</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>`;
  pedido.pizzas.forEach(pizza => {
    html += `<tr>
      <td>${pizza.nome_pizza || pizza.pizza_id_pizza}</td>
      <td>${pizza.quantidade}</td>
      <td>R$ ${Number(pizza.preco_pizza).toFixed(2)}</td>
      <td>R$ ${(pizza.preco_pizza * pizza.quantidade).toFixed(2)}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  html += `<h3>Total: R$ ${Number(pedido.valor_total).toFixed(2)}</h3>`;
  resumoContainer.innerHTML = html;
}

// ...existing code...

btnCancelar.onclick = () => {
  localStorage.removeItem('pedidoResumo');
  window.location.href = 'cardapio.html';
};

btnConfirmar.onclick = async () => {
  try {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (!usuario || !usuario.id) {
      alert('Erro: usuário não identificado');
      return;
    }

    const pedido = JSON.parse(localStorage.getItem('pedidoResumo'));
    const pedidoParaEnviar = {
      cliente_pessoa_id_pessoa: usuario.id,
      valor_total: pedido.valor_total,
      status_pedido: 'Pendente',
      pizzas: pedido.pizzas.map(p => ({
        pizza_id_pizza: p.pizza_id_pizza,
        quantidade: p.quantidade
      }))
    };

    const response = await fetch('http://localhost:3001/pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedidoParaEnviar)
    });

    if (response.ok) {
      alert('Pedido criado com sucesso!');
      // NÃO REMOVE pedidoResumo aqui! A página de pagamento precisa ler esse dado
      // O pagamento.html vai limpar o localStorage após confirmar o pagamento
      window.location.href = '../pagamento/pagamento.html';
    } else {
      const erro = await response.json();
      alert('Erro ao confirmar pedido: ' + (erro.error || 'Erro desconhecido'));
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro de conexão com o servidor.');
  }
};

// Chama o renderizarResumo ao carregar
renderizarResumo();