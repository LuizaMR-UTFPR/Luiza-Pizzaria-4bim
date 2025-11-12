const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

const form = document.getElementById('funcionarioForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('funcionariosTableBody');
const messageContainer = document.getElementById('messageContainer');
const pessoaIdInput = document.getElementById('pessoa_id_pessoa');

document.addEventListener('DOMContentLoaded', () => {
  mostrarBotoes(true, false, false, false, false, false);
  document.getElementById('listSection').style.display = 'none';
});

btnBuscar.addEventListener('click', buscar);
btnIncluir.addEventListener('click', incluir);
btnAlterar.addEventListener('click', alterar);
btnExcluir.addEventListener('click', excluir);
btnCancelar.addEventListener('click', cancelar);
btnSalvar.addEventListener('click', salvar);

function mostrarMensagem(txt, tipo='info'){ 
  messageContainer.innerHTML=`<div class="message ${tipo}">${txt}</div>`; 
  setTimeout(()=>messageContainer.innerHTML='',3000); 
}
function limparFormulario(){ form.reset(); }
function mostrarBotoes(b1,b2,b3,b4,b5,b6){ 
  btnBuscar.style.display=b1?'inline-block':'none'; 
  btnIncluir.style.display=b2?'inline-block':'none'; 
  btnAlterar.style.display=b3?'inline-block':'none'; 
  btnExcluir.style.display=b4?'inline-block':'none'; 
  btnSalvar.style.display=b5?'inline-block':'none'; 
  btnCancelar.style.display=b6?'inline-block':'none'; 
}

async function buscar(){
  const id = searchId.value.trim();
  if (!id) return mostrarMensagem('Digite um ID', 'warning');
  try {
    const res = await fetch(`${API_BASE_URL}/funcionario/${id}`);
    if (res.ok) {
      const funcionario = await res.json();
      preencherFormulario(funcionario);
      mostrarBotoes(true, false, true, true, false, false);
      document.getElementById('listSection').style.display = 'block';
      renderizar([funcionario]);
    } else {
      limparFormulario();
      mostrarBotoes(true, true, false, false, false, false);
      mostrarMensagem('Funcionário não encontrado', 'info');
      document.getElementById('listSection').style.display = 'none';
      renderizar([]);
    }
  } catch {
    mostrarMensagem('Erro ao buscar', 'error');
    document.getElementById('listSection').style.display = 'none';
    renderizar([]);
  }
}

function preencherFormulario(f){
  currentId = f.pessoa_id_pessoa;
  searchId.value = f.pessoa_id_pessoa || '';
  pessoaIdInput.value = f.pessoa_id_pessoa || '';
  document.getElementById('cargo_funcionario').value = f.cargo_funcionario || '';
  document.getElementById('salario_funcionario').value = f.salario_funcionario || '';
}

function incluir(){
  limparFormulario();
  searchId.value = '';
  pessoaIdInput.value = '';
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'incluir';
}

function alterar(){
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'alterar';
}

function excluir(){
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'excluir';
}

async function salvar(){
  // Usa o campo pessoa_id_pessoa do formulário
  const pessoa_id_pessoa = pessoaIdInput.value.trim();
  const cargo_funcionario = document.getElementById('cargo_funcionario').value;
  const salario_funcionario = document.getElementById('salario_funcionario').value;
  const obj = { pessoa_id_pessoa, cargo_funcionario, salario_funcionario };
  let res;
  try {
    if (operacao === 'incluir') {
      res = await fetch(`${API_BASE_URL}/funcionario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
    } else if (operacao === 'alterar') {
      res = await fetch(`${API_BASE_URL}/funcionario/${currentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      });
    } else if (operacao === 'excluir') {
      res = await fetch(`${API_BASE_URL}/funcionario/${currentId}`, { method: 'DELETE' });
    }
    if (res && res.ok) {
      mostrarMensagem('Operação realizada com sucesso', 'success');
      limparFormulario();
      document.getElementById('listSection').style.display = 'none';
      renderizar([]);
    } else {
      mostrarMensagem('Erro na operação', 'error');
    }
  } catch {
    mostrarMensagem('Erro na operação', 'error');
  }
  mostrarBotoes(true, false, false, false, false, false);
}

function cancelar(){
  limparFormulario();
  mostrarBotoes(true, false, false, false, false, false);
  mostrarMensagem('Cancelado', 'info');
  document.getElementById('listSection').style.display = 'none';
  renderizar([]);
}

function renderizar(funcionarios){
  tableBody.innerHTML = '';
  funcionarios.forEach(f => {
    const row = document.createElement('tr');
    row.innerHTML = `<td><button class="btn-id" onclick="selecionar(${f.pessoa_id_pessoa})">${f.pessoa_id_pessoa}</button></td><td>${f.cargo_funcionario}</td><td>R$ ${Number(f.salario_funcionario).toFixed(2)}</td>`;
    tableBody.appendChild(row);
  });
}

async function selecionar(id){
  searchId.value = id;
  await buscar();
}