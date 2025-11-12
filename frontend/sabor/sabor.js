const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

// DOM
const form = document.getElementById('saborForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('saboresTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', carregar);

btnBuscar.addEventListener('click', buscar);
btnIncluir.addEventListener('click', incluir);
btnAlterar.addEventListener('click', alterar);
btnExcluir.addEventListener('click', excluir);
btnCancelar.addEventListener('click', cancelar);
btnSalvar.addEventListener('click', salvar);

mostrarBotoes(true, false, false, false, false, false);

function mostrarMensagem(texto, tipo = 'info') {
  messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
  setTimeout(() => { messageContainer.innerHTML = ''; }, 3000);
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

async function carregar() {
  // Não exibe lista ao carregar a página
  document.getElementById('listSection').style.display = 'none';
  renderizar([]);
}

async function buscar() {
  const id = searchId.value.trim();
  if (!id) return mostrarMensagem('Digite um ID', 'warning');
  try {
    const res = await fetch(`${API_BASE_URL}/sabor/${id}`);
    if (res.ok) {
      const sabor = await res.json();
      preencherFormulario(sabor);
      mostrarBotoes(true, false, true, true, false, false);
      document.getElementById('listSection').style.display = 'block';
      renderizar([sabor]);
    } else {
      limparFormulario();
      mostrarBotoes(true, true, false, false, false, false);
      mostrarMensagem('Sabor não encontrado', 'info');
      document.getElementById('listSection').style.display = 'none';
      renderizar([]);
    }
  } catch {
    mostrarMensagem('Erro ao buscar', 'error');
    document.getElementById('listSection').style.display = 'none';
    renderizar([]);
  }
}

function preencherFormulario(sabor) {
  currentId = sabor.id_sabor;
  searchId.value = sabor.id_sabor;
  document.getElementById('nome_sabor').value = sabor.nome_sabor || '';
  document.getElementById('descricao_sabor').value = sabor.descricao_sabor || '';
}

function incluir() {
  limparFormulario();
  searchId.value = '';
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'incluir';
}
function alterar() { mostrarBotoes(false, false, false, false, true, true); operacao = 'alterar'; }
function excluir() { mostrarBotoes(false, false, false, false, true, true); operacao = 'excluir'; }

async function salvar() {
  const formData = new FormData(form);
  const obj = {
    id_sabor: searchId.value,
    nome_sabor: formData.get('nome_sabor'),
    descricao_sabor: formData.get('descricao_sabor')
  };
  let res;
  try {
    if (operacao === 'incluir') {
      res = await fetch(`${API_BASE_URL}/sabor`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
    } else if (operacao === 'alterar') {
      res = await fetch(`${API_BASE_URL}/sabor/${currentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
    } else if (operacao === 'excluir') {
      res = await fetch(`${API_BASE_URL}/sabor/${currentId}`, { method: 'DELETE' });
    }

    if (res && res.ok) {
      mostrarMensagem('Operação realizada com sucesso', 'success');
      limparFormulario();
      carregar();
    } else {
      mostrarMensagem('Erro na operação', 'error');
    }
  } catch { mostrarMensagem('Erro na operação', 'error'); }

  mostrarBotoes(true, false, false, false, false, false);
}

function cancelar() {
  limparFormulario();
  mostrarBotoes(true, false, false, false, false, false);
  mostrarMensagem('Cancelado', 'info');
}

function renderizar(sabores) {
  tableBody.innerHTML = '';
  sabores.forEach(sabor => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><button class="btn-id" onclick="selecionar(${sabor.id_sabor})">${sabor.id_sabor}</button></td>
      <td>${sabor.nome_sabor}</td>
      <td>${sabor.descricao_sabor || ''}</td>
    `;
    tableBody.appendChild(row);
  });
}

async function selecionar(id) {
  searchId.value = id;
  await buscar();
}
