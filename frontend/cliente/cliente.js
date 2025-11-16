const API_BASE_URL = 'http://localhost:3001';
let currentId = null;
let operacao = null;

const form = document.getElementById('clienteForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const tableBody = document.getElementById('clientesTableBody');
const messageContainer = document.getElementById('messageContainer');

document.addEventListener('DOMContentLoaded', carregar);

btnBuscar.addEventListener('click', buscar);
btnIncluir.addEventListener('click', incluir);
btnAlterar.addEventListener('click', alterar);
btnExcluir.addEventListener('click', excluir);
btnCancelar.addEventListener('click', cancelar);
btnSalvar.addEventListener('click', salvar);

mostrarBotoes(true, false, false, false, false, false);

function mostrarMensagem(txt, tipo='info'){ messageContainer.innerHTML=`<div class="message ${tipo}">${txt}</div>`; setTimeout(()=>messageContainer.innerHTML='',3000); }
function limparFormulario(){ form.reset(); }
function mostrarBotoes(b1,b2,b3,b4,b5,b6){ btnBuscar.style.display=b1?'inline-block':'none'; btnIncluir.style.display=b2?'inline-block':'none'; btnAlterar.style.display=b3?'inline-block':'none'; btnExcluir.style.display=b4?'inline-block':'none'; btnSalvar.style.display=b5?'inline-block':'none'; btnCancelar.style.display=b6?'inline-block':'none'; }

// cliente.js
async function carregar(){
  // Não exibe lista ao carregar a página
  document.getElementById('listSection').style.display = 'none';
  renderizar([]);
}

async function buscar(){
  const id = searchId.value.trim();
  if (!id) return mostrarMensagem('Digite um ID', 'warning');
  try {
    const res = await fetch(`${API_BASE_URL}/cliente/${id}`);
    if (res.ok) {
      const cliente = await res.json();
      preencherFormulario(cliente);
      mostrarBotoes(true, false, true, true, false, false);
      document.getElementById('listSection').style.display = 'block';
      renderizar([cliente]);
    } else {
      limparFormulario();
      mostrarBotoes(true, true, false, false, false, false);
      mostrarMensagem('Cliente não encontrado', 'info');
      document.getElementById('listSection').style.display = 'none';
      renderizar([]);
    }
  } catch {
    mostrarMensagem('Erro ao buscar', 'error');
    document.getElementById('listSection').style.display = 'none';
    renderizar([]);
  }
}
function preencherFormulario(cliente){ currentId=cliente.pessoa_id_pessoa; searchId.value=cliente.pessoa_id_pessoa; document.getElementById('endereco_cliente').value=cliente.endereco_cliente||''; }
function incluir(){ limparFormulario(); searchId.value=''; mostrarBotoes(false,false,false,false,true,true); operacao='incluir'; }
function alterar(){ mostrarBotoes(false,false,false,false,true,true); operacao='alterar'; }
function excluir(){ mostrarBotoes(false,false,false,false,true,true); operacao='excluir'; }

async function salvar(){
  const obj={ pessoa_id_pessoa: searchId.value, endereco_cliente: document.getElementById('endereco_cliente').value };
  let res;
  try{
    if(operacao==='incluir'){res=await fetch(`${API_BASE_URL}/cliente`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});}
    else if(operacao==='alterar'){res=await fetch(`${API_BASE_URL}/cliente/${currentId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});}
    else if(operacao==='excluir'){res=await fetch(`${API_BASE_URL}/cliente/${currentId}`,{method:'DELETE'});}
    if(res&&res.ok){mostrarMensagem('Operação realizada com sucesso','success'); limparFormulario(); carregar();}
    else mostrarMensagem('Erro na operação','error');
  }catch{mostrarMensagem('Erro na operação','error');}
  mostrarBotoes(true,false,false,false,false,false);
}
function cancelar(){ limparFormulario(); mostrarBotoes(true,false,false,false,false,false); mostrarMensagem('Cancelado','info'); }

async function carregar(){
  try{const res=await fetch(`${API_BASE_URL}/cliente`); if(res.ok){const clientes=await res.json(); renderizar(clientes);} }
  catch{mostrarMensagem('Erro ao carregar','error');}
}
function renderizar(clientes){
  tableBody.innerHTML=''; clientes.forEach(c=>{ const row=document.createElement('tr'); row.innerHTML=`<td><button class="btn-id" onclick="selecionar(${c.pessoa_id_pessoa})">${c.pessoa_id_pessoa}</button></td><td>${c.endereco_cliente}</td>`; tableBody.appendChild(row); });
}
async function selecionar(id){ searchId.value=id; await buscar(); }
