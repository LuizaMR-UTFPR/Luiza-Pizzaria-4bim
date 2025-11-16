const API_BASE_URL = 'http://localhost:3001';
let currentPedidoId = null;
let operacao = null;
let pizzasPedido = [];
let pizzasDisponiveis = [];

const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');
const pizzasList = document.getElementById('pizzasList');
const pizzaSelect = document.getElementById('pizzaSelect');
const pizzaQuantidade = document.getElementById('pizzaQuantidade');
const btnAddPizza = document.getElementById('btnAddPizza');

document.addEventListener('DOMContentLoaded', async () => {
    await carregarPizzasDisponiveis();
    carregarPedidos();
});

btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);
btnAddPizza.addEventListener('click', adicionarPizzaAoPedido);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) input.disabled = bloquearPrimeiro;
        else input.disabled = !bloquearPrimeiro;
    });
    pizzaSelect.disabled = !bloquearPrimeiro;
    pizzaQuantidade.disabled = !bloquearPrimeiro;
    btnAddPizza.disabled = !bloquearPrimeiro;
}

function limparFormulario() {
    form.reset();
    pizzasPedido = [];
    renderizarPizzasPedido();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function carregarPizzasDisponiveis() {
    try {
        const response = await fetch(`${API_BASE_URL}/pizza`);
        if (response.ok) {
            pizzasDisponiveis = await response.json();
            pizzaSelect.innerHTML = pizzasDisponiveis.map(pizza =>
                `<option value="${pizza.id_pizza}">${pizza.nome_pizza || 'Pizza ' + pizza.id_pizza}</option>`
            ).join('');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar pizzas disponíveis', 'error');
    }
}

function adicionarPizzaAoPedido() {
    const pizzaId = parseInt(pizzaSelect.value);
    const quantidade = parseInt(pizzaQuantidade.value);
    if (!pizzaId || !quantidade || quantidade < 1) {
        mostrarMensagem('Selecione uma pizza e quantidade válida', 'warning');
        return;
    }
    const existente = pizzasPedido.find(p => p.pizza_id_pizza === pizzaId);
    if (existente) {
        existente.quantidade += quantidade;
    } else {
        pizzasPedido.push({ pizza_id_pizza: pizzaId, quantidade });
    }
    renderizarPizzasPedido();
}

function removerPizzaDoPedido(pizzaId) {
    pizzasPedido = pizzasPedido.filter(p => p.pizza_id_pizza !== pizzaId);
    renderizarPizzasPedido();
}

function renderizarPizzasPedido() {
    pizzasList.innerHTML = '';
    if (pizzasPedido.length === 0) {
        pizzasList.innerHTML = '<em>Nenhuma pizza adicionada.</em>';
        return;
    }
    pizzasPedido.forEach(item => {
        const pizza = pizzasDisponiveis.find(p => p.id_pizza === item.pizza_id_pizza);
        const nome = pizza ? pizza.nome_pizza : 'Pizza ' + item.pizza_id_pizza;
        const div = document.createElement('div');
        div.innerHTML = `${nome} - Quantidade: ${item.quantidade} <button type="button" onclick="removerPizzaDoPedido(${item.pizza_id_pizza})">Remover</button>`;
        pizzasList.appendChild(div);
    });
}

async function buscarPedido() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pedido encontrado!', 'success');
            // Exibe a lista e mostra apenas o pedido buscado
            document.getElementById('listSection').style.display = 'block';
            renderizarTabelaPedidos([pedido]);
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pedido não encontrado. Você pode incluir um novo.', 'info');
            document.getElementById('listSection').style.display = 'none';
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        mostrarMensagem('Erro ao buscar pedido', 'error');
        document.getElementById('listSection').style.display = 'none';
    }
}

function preencherFormulario(pedido) {
    currentPedidoId = pedido.id_pedido;
    searchId.value = pedido.id_pedido;
    document.getElementById('cliente_pessoa_id_pessoa').value = pedido.cliente_pessoa_id_pessoa || '';
    document.getElementById('valor_total').value = pedido.valor_total || '';
    document.getElementById('status_pedido').value = pedido.status_pedido || '';
    document.getElementById('data_pedido').value = pedido.data_pedido
        ? pedido.data_pedido.slice(0, 16)
        : '';
    pizzasPedido = Array.isArray(pedido.pizzas) ? pedido.pizzas.map(p => ({
        pizza_id_pizza: p.pizza_id_pizza,
        quantidade: p.quantidade
    })) : [];
    renderizarPizzasPedido();
}

function incluirPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    searchId.value = '';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('cliente_pessoa_id_pessoa').focus();
    operacao = 'incluir';
}

function alterarPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('cliente_pessoa_id_pessoa').focus();
    operacao = 'alterar';
}

function excluirPedido() {
    mostrarMensagem('Excluindo pedido...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pedido = {
        cliente_pessoa_id_pessoa: formData.get('cliente_pessoa_id_pessoa'),
        valor_total: formData.get('valor_total'),
        status_pedido: formData.get('status_pedido'),
        data_pedido: formData.get('data_pedido'),
        pizzas: pizzasPedido
    };
    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, { method: 'DELETE' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Pedido ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarPedidos();
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar pedido', 'error');
        } else {
            mostrarMensagem('Pedido excluído com sucesso!', 'success');
            limparFormulario();
            carregarPedidos();
        }
    } catch (error) {
        mostrarMensagem('Erro na operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    mostrarMensagem('Operação cancelada', 'info');
}

async function carregarPedidos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedido`);
        if (response.ok) {
            const pedidos = await response.json();
            renderizarTabelaPedidos(pedidos);
        } else {
            throw new Error('Erro ao carregar pedidos');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar pedidos', 'error');
    }
}

function renderizarTabelaPedidos(pedidos) {
    pedidosTableBody.innerHTML = '';
    pedidos.forEach(pedido => {
        const pizzasStr = Array.isArray(pedido.pizzas)
            ? pedido.pizzas.map(p => {
                const pizza = pizzasDisponiveis.find(pd => pd.id_pizza === p.pizza_id_pizza);
                const nome = pizza ? pizza.nome_pizza : 'Pizza ' + p.pizza_id_pizza;
                return `${nome} (x${p.quantidade})`;
            }).join(', ')
            : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarPedido(${pedido.id_pedido})">${pedido.id_pedido}</button></td>
            <td>${pedido.cliente_pessoa_id_pessoa}</td>
            <td>R$ ${Number(pedido.valor_total).toFixed(2)}</td>
            <td>${pedido.status_pedido}</td>
            <td>${pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleString() : ''}</td>
            <td>${pizzasStr}</td>
        `;
        pedidosTableBody.appendChild(row);
    });
}

async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}

// Permite remover pizza do pedido (usado no botão "Remover" de cada pizza)
window.removerPizzaDoPedido = removerPizzaDoPedido;