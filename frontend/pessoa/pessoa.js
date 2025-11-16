const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', () => {
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

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

function limparFormulario() {
    form.reset();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

function formatarData(dataString) {
    if (!dataString) return '';
    const d = new Date(dataString);
    return d.toISOString().slice(0, 10);
}

async function buscarPessoa() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${id}`);
        if (response.ok) {
            const pessoa = await response.json();
            preencherFormulario(pessoa);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');
            document.getElementById('listSection').style.display = 'block';
            renderizarTabelaPessoas([pessoa]);
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova.', 'info');
            document.getElementById('listSection').style.display = 'none';
        } else {
            throw new Error('Erro ao buscar pessoa');
        }
    } catch (error) {
        mostrarMensagem('Erro ao buscar pessoa', 'error');
        document.getElementById('listSection').style.display = 'none';
    }
}

function preencherFormulario(pessoa) {
    currentPersonId = pessoa.id_pessoa;
    searchId.value = pessoa.id_pessoa || '';
    document.getElementById('nome_pessoa').value = pessoa.nome_pessoa || '';
    document.getElementById('email_pessoa').value = pessoa.email_pessoa || '';
    document.getElementById('senha_pessoa').value = pessoa.senha_pessoa || '';
    document.getElementById('telefone_pessoa').value = pessoa.telefone_pessoa || '';
    document.getElementById('primeiro_acesso_pessoa').value = pessoa.primeiro_acesso_pessoa ? 'true' : 'false';
    document.getElementById('data_nascimento').value = formatarData(pessoa.data_nascimento);
}

function incluirPessoa() {
    mostrarMensagem('Digite os dados!', 'success');
    limparFormulario();
    searchId.value = '';
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
    operacao = 'incluir';
}

function alterarPessoa() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
    operacao = 'alterar';
}

function excluirPessoa() {
    mostrarMensagem('Excluindo pessoa...', 'info');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const pessoa = {
        nome_pessoa: formData.get('nome_pessoa'),
        email_pessoa: formData.get('email_pessoa'),
        senha_pessoa: formData.get('senha_pessoa'),
        telefone_pessoa: formData.get('telefone_pessoa'),
        primeiro_acesso_pessoa: formData.get('primeiro_acesso_pessoa'),
        data_nascimento: formData.get('data_nascimento')
    };
    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoa)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoa)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, { method: 'DELETE' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Pessoa ${operacao} com sucesso!`, 'success');
            limparFormulario();
            document.getElementById('listSection').style.display = 'none';
        } else if (operacao !== 'excluir') {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar pessoa', 'error');
        } else {
            mostrarMensagem('Pessoa excluída com sucesso!', 'success');
            limparFormulario();
            document.getElementById('listSection').style.display = 'none';
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
    document.getElementById('listSection').style.display = 'none';
}

function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';
    pessoas.forEach(pessoa => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pessoa.id_pessoa || ''}</td>
            <td>${pessoa.nome_pessoa || ''}</td>
            <td>${pessoa.email_pessoa || ''}</td>
            <td>${pessoa.telefone_pessoa || ''}</td>
            <td>${pessoa.primeiro_acesso_pessoa ? 'Sim' : 'Não'}</td>
            <td>${pessoa.data_nascimento ? formatarData(pessoa.data_nascimento) : ''}</td>
        `;
        pessoasTableBody.appendChild(row);
    });
}