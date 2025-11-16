const API_BASE_URL = 'http://localhost:3001';
let currentPizzaId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pizzaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pizzasTableBody = document.getElementById('pizzasTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', () => {
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('listSection').style.display = 'none';
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPizza);
btnIncluir.addEventListener('click', incluirPizza);
btnAlterar.addEventListener('click', alterarPizza);
btnExcluir.addEventListener('click', excluirPizza);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

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
}

function limparFormulario() { form.reset(); }

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function buscarPizza() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        document.getElementById('listSection').style.display = 'none';
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/pizza/${id}`);
        if (response.ok) {
            const pizza = await response.json();
            preencherFormulario(pizza);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pizza encontrada!', 'success');
            document.getElementById('listSection').style.display = 'block';
            renderizarTabelaPizzas([pizza]);
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pizza não encontrada. Você pode incluir uma nova.', 'info');
            document.getElementById('listSection').style.display = 'none';
            renderizarTabelaPizzas([]);
        } else {
            throw new Error('Erro ao buscar pizza');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao buscar pizza', 'error');
        document.getElementById('listSection').style.display = 'none';
        renderizarTabelaPizzas([]);
    }
}

function preencherFormulario(pizza) {
    currentPizzaId = pizza.id_pizza;
    searchId.value = pizza.id_pizza;
    document.getElementById('nome_pizza').value = pizza.nome_pizza || '';
    document.getElementById('descricao_pizza').value = pizza.descricao_pizza || '';
    document.getElementById('preco_pizza').value = pizza.preco_pizza || '';
}

function incluirPizza() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    searchId.value = '';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pizza').focus();
    operacao = 'incluir';
}

function alterarPizza() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pizza').focus();
    operacao = 'alterar';
}

function excluirPizza() {
    mostrarMensagem('Excluindo pizza...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pizza = {
        id_pizza: searchId.value,
        nome_pizza: formData.get('nome_pizza'),
        descricao_pizza: formData.get('descricao_pizza'),
        preco_pizza: formData.get('preco_pizza')
    };
    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pizza`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pizza)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pizza/${currentPizzaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pizza)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pizza/${currentPizzaId}`, { method: 'DELETE' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Pizza ${operacao} com sucesso!`, 'success');
            limparFormulario();
            carregarPizzas();
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar pizza', 'error');
        } else {
            mostrarMensagem('Pizza excluída com sucesso!', 'success');
            limparFormulario();
            carregarPizzas();
        }
    } catch (error) {
        console.error(error);
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

async function carregarPizzas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pizza`);
        if (response.ok) {
            const pizzas = await response.json();
            renderizarTabelaPizzas(pizzas);
        } else {
            throw new Error('Erro ao carregar pizzas');
        }
    } catch (error) {
        console.error(error);
        mostrarMensagem('Erro ao carregar pizzas', 'error');
    }
}

function renderizarTabelaPizzas(pizzas) {
    pizzasTableBody.innerHTML = '';
    pizzas.forEach(pizza => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn-id" onclick="selecionarPizza(${pizza.id_pizza})">${pizza.id_pizza}</button></td>
            <td>${pizza.nome_pizza}</td>
            <td>${pizza.descricao_pizza || ''}</td>
            <td>R$ ${Number(pizza.preco_pizza).toFixed(2)}</td>
        `;
        pizzasTableBody.appendChild(row);
    });
}

async function selecionarPizza(id) {
    searchId.value = id;
    await buscarPizza();
}
