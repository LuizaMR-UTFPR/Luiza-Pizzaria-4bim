// cardapio.js
const API_BASE_URL = "http://localhost:3001";

let carrinho = [];
let CLIENTE_ID = null;

document.addEventListener("DOMContentLoaded", () => {
  // Obtém o cliente_id do usuário logado
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  
  if (!usuario || !usuario.id) {
    alert('Você precisa estar logado para fazer pedidos');
    window.location.href = '../login/login.html';
    return;
  }

  CLIENTE_ID = usuario.id;
  carregarCardapio();
});

async function carregarCardapio() {
  try {
    const response = await fetch(`${API_BASE_URL}/pizza`);
    const pizzas = await response.json();
    
    // Buscar imagens de todas as pizzas
    for (const pizza of pizzas) {
      try {
        const imgResponse = await fetch(`${API_BASE_URL}/api/imagem/pizza/${pizza.id_pizza}`);
        if (imgResponse.ok) {
          const imagem = await imgResponse.json();
          // Normalizar caminho retornado (cobre casos antigos que salvaram caminhos absolutos)
          let caminho = imagem.caminho_imagem || null;
          if (caminho) {
            if (!caminho.startsWith('/')) {
              const partes = caminho.split(/[\\/]+/);
              const nome = partes[partes.length - 1];
              caminho = `/imagem/${nome}`;
            }
          } else if (imagem.nome_arquivo) {
            caminho = `/imagem/${imagem.nome_arquivo}`;
          }
          pizza.imagem = caminho;
          console.log('Imagem pizza', pizza.id_pizza, '->', pizza.imagem);
        }
      } catch (error) {
        // Pizza sem imagem, isso é normal
        pizza.imagem = null;
      }
    }
    
    renderizarCardapio(pizzas);
  } catch (error) {
    console.error('Erro:', error);
    mostrarMensagem('Erro ao carregar cardápio', 'error');
  }
}

function renderizarCardapio(pizzas) {
  const container = document.getElementById("cardapioContainer");
  container.innerHTML = "";

  pizzas.forEach((pizza) => {
    const card = document.createElement("div");
    card.classList.add("card-pizza");

    const imagemHTML = pizza.imagem 
      ? `<img src="${pizza.imagem}" alt="${pizza.nome_pizza}" class="pizza-imagem" />`
      : `<div class="pizza-imagem placeholder">Sem imagem</div>`;

    card.innerHTML = `
      ${imagemHTML}
      <h2>${pizza.nome_pizza}</h2>
      <p>${pizza.descricao_pizza || "Sem descrição"}</p>
      <p><strong>R$ ${Number(pizza.preco_pizza).toFixed(2)}</strong></p>
      <label>
        Quantidade:
        <input type="number" id="qtd-${pizza.id_pizza}" min="1" value="1" />
      </label>
      <button class="btn-add" onclick="adicionarAoPedido(${pizza.id_pizza}, '${pizza.nome_pizza}', ${pizza.preco_pizza})">
        Adicionar ao Pedido
      </button>
    `;

    container.appendChild(card);
  });
}

function adicionarAoPedido(id, nome, preco) {
  const qtdInput = document.getElementById(`qtd-${id}`);
  const quantidade = parseInt(qtdInput.value);

  if (quantidade <= 0) return;

  const existente = carrinho.find((item) => item.id === id);

  if (existente) {
    existente.quantidade += quantidade;
  } else {
    carrinho.push({ id, nome, preco, quantidade });
  }

  renderizarTabelaPedido();
}

function renderizarTabelaPedido() {
  const tabela = document.getElementById("tabelaPedido");
  tabela.innerHTML = "";

  if (carrinho.length === 0) {
    tabela.innerHTML = "<tr><td colspan='4'>Nenhum item no pedido.</td></tr>";
    return;
  }

  carrinho.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.nome}</td>
      <td>${item.quantidade}</td>
      <td>R$ ${(item.preco * item.quantidade).toFixed(2)}</td>
      <td><button onclick="removerItem(${index})">❌</button></td>
    `;
    tabela.appendChild(row);
  });

  const total = carrinho.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const totalRow = document.createElement("tr");
  totalRow.innerHTML = `
    <td colspan="2"><strong>Total</strong></td>
    <td colspan="2"><strong>R$ ${total.toFixed(2)}</strong></td>
  `;
  tabela.appendChild(totalRow);
}

function removerItem(index) {
  carrinho.splice(index, 1);
  renderizarTabelaPedido();
}

async function finalizarPedido() {
  if (carrinho.length === 0) {
    alert("Adicione pizzas ao pedido antes de finalizar!");
    return;
  }

  const valorTotal = carrinho.reduce(
    (sum, item) => sum + item.preco * item.quantidade,
    0
  );

  // Busca os dados completos das pizzas (nome, preço, etc)
  const pedido = {
    cliente_pessoa_id_pessoa: CLIENTE_ID,
    valor_total: valorTotal,
    pizzas: carrinho.map((item) => ({
      pizza_id_pizza: item.id,
      nome_pizza: item.nome,
      preco_pizza: item.preco,
      quantidade: item.quantidade
    })),
  };

  localStorage.setItem('pedidoResumo', JSON.stringify(pedido));
  window.location.href = 'resumoPedido.html';
}
