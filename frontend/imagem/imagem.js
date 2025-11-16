const API_BASE_URL = 'http://localhost:3001';
let currentImagemId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('imagemForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pizzaSelect = document.getElementById('pizzaSelect');
const imagemInput = document.getElementById('imagemInput');
const previewImagem = document.getElementById('previewImagem');
const imagensTableBody = document.getElementById('imagensTableBody');
const listSection = document.getElementById('listSection');

document.addEventListener('DOMContentLoaded', () => {
  mostrarBotoes(true, false, false, false, false, false);
  bloquearCampos(false);
  carregarPizzas();
  carregarImagens();
});

// Event listeners
btnBuscar.addEventListener('click', buscarImagem);
btnIncluir.addEventListener('click', incluirImagem);
btnAlterar.addEventListener('click', alterarImagem);
btnExcluir.addEventListener('click', excluirImagem);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

imagemInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImagem.src = event.target.result;
      previewImagem.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    previewImagem.style.display = 'none';
  }
});

function mostrarMensagem(texto, tipo = 'info') {
  const messageContainer = document.getElementById('messageContainer') || document.createElement('div');
  if (!document.getElementById('messageContainer')) {
    messageContainer.id = 'messageContainer';
    document.body.appendChild(messageContainer);
  }
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

function limparFormulario() { form.reset(); previewImagem.style.display = 'none'; currentImagemId = null; }

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
  btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
  btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
  btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
  btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
  btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
  btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

async function carregarPizzas() {
  try {
    const response = await fetch(`${API_BASE_URL}/pizza`);
    const pizzas = await response.json();
    pizzaSelect.innerHTML = '<option value="">-- Selecione uma pizza --</option>';
    pizzas.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id_pizza;
      opt.textContent = `${p.id_pizza} - ${p.nome_pizza}`;
      pizzaSelect.appendChild(opt);
    });
  } catch (error) {
    console.error('Erro ao carregar pizzas:', error);
    mostrarMensagem('Erro ao carregar pizzas', 'error');
  }
}

async function buscarImagem() {
  const id = searchId.value.trim();
  if (!id) {
    mostrarMensagem('Digite um ID para buscar', 'warning');
    listSection.style.display = 'none';
    return;
  }
  try {
    const response = await fetch(`/api/imagem/${id}`);
    if (response.ok) {
      const imagem = await response.json();
      preencherFormulario(imagem);
      mostrarBotoes(true, false, true, true, false, false);
      mostrarMensagem('Imagem encontrada!', 'success');
      listSection.style.display = 'block';
      renderizarTabelaImagens([imagem]);
    } else if (response.status === 404) {
      limparFormulario();
      searchId.value = id;
      mostrarBotoes(true, true, false, false, false, false);
      mostrarMensagem('Imagem não encontrada. Você pode incluir uma nova.', 'info');
      listSection.style.display = 'none';
      renderizarTabelaImagens([]);
    } else {
      throw new Error('Erro ao buscar imagem');
    }
  } catch (error) {
    console.error(error);
    mostrarMensagem('Erro ao buscar imagem', 'error');
    listSection.style.display = 'none';
    renderizarTabelaImagens([]);
  }
}

function preencherFormulario(imagem) {
  currentImagemId = imagem.id_imagem;
  searchId.value = imagem.id_imagem;
  pizzaSelect.value = imagem.pizza_id_pizza;
  if (imagem.nome_arquivo) {
    // Preferir caminho_imagem (pode já ser a URL pública), caso contrário montar a partir do nome_arquivo
    previewImagem.src = imagem.caminho_imagem ? imagem.caminho_imagem : `/imagem/${imagem.nome_arquivo}`;
    previewImagem.style.display = 'block';
  } else {
    previewImagem.style.display = 'none';
  }
}

function incluirImagem() {
  mostrarMensagem('Preencha os dados para incluir', 'info');
  limparFormulario();
  searchId.value = '';
  bloquearCampos(true);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'incluir';
}

function alterarImagem() {
  mostrarMensagem('Altere os dados e salve', 'info');
  bloquearCampos(true);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'alterar';
}

function excluirImagem() {
  mostrarMensagem('Clique em Salvar para confirmar exclusão', 'info');
  bloquearCampos(false);
  mostrarBotoes(false, false, false, false, true, true);
  operacao = 'excluir';
}

async function salvarOperacao() {
  try {
    if (operacao === 'incluir') {
      const file = imagemInput.files[0];
      if (!file) { mostrarMensagem('Selecione uma imagem', 'warning'); return; }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        const body = { pizzaId: parseInt(pizzaSelect.value), nomeArquivo: file.name, base64Data };
        const resp = await fetch('/api/imagem/salvar', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
        if (resp.ok) {
          mostrarMensagem('Imagem incluída com sucesso', 'success');
          limparFormulario();
          carregarImagens();
        } else {
          const err = await resp.json(); mostrarMensagem(err.error || 'Erro ao incluir', 'error');
        }
      };
      reader.readAsDataURL(file);
    } else if (operacao === 'alterar') {
      if (!currentImagemId) { mostrarMensagem('Nenhuma imagem selecionada', 'warning'); return; }
      const file = imagemInput.files[0];
      let body = { pizzaId: parseInt(pizzaSelect.value) };
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          body.nomeArquivo = file.name; body.base64Data = e.target.result;
          const resp = await fetch(`/api/imagem/${currentImagemId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
          if (resp.ok) { mostrarMensagem('Imagem atualizada', 'success'); limparFormulario(); carregarImagens(); }
          else { const err = await resp.json(); mostrarMensagem(err.error || 'Erro ao atualizar', 'error'); }
        };
        reader.readAsDataURL(file);
      } else {
        // Somente atualizar pizza_id
        const resp = await fetch(`/api/imagem/${currentImagemId}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
        if (resp.ok) { mostrarMensagem('Imagem atualizada', 'success'); limparFormulario(); carregarImagens(); }
        else { const err = await resp.json(); mostrarMensagem(err.error || 'Erro ao atualizar', 'error'); }
      }
    } else if (operacao === 'excluir') {
      if (!currentImagemId) { mostrarMensagem('Nenhuma imagem selecionada', 'warning'); return; }
      const resp = await fetch(`/api/imagem/${currentImagemId}`, { method: 'DELETE' });
      if (resp.ok) { mostrarMensagem('Imagem deletada', 'success'); limparFormulario(); carregarImagens(); }
      else { mostrarMensagem('Erro ao deletar imagem', 'error'); }
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

async function carregarImagens() {
  try {
    const resp = await fetch('/api/imagem/listar');
    const imagens = await resp.json();
    renderizarTabelaImagens(imagens);
  } catch (error) {
    console.error('Erro ao carregar imagens', error);
    imagensTableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar imagens</td></tr>';
  }
}

function renderizarTabelaImagens(imagens) {
  imagensTableBody.innerHTML = '';
  if (!imagens || imagens.length === 0) {
    imagensTableBody.innerHTML = '<tr><td colspan="4">Nenhuma imagem cadastrada</td></tr>';
    return;
  }
  imagens.forEach(imagem => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><button class="btn-id" onclick="selecionarImagem(${imagem.id_imagem})">${imagem.id_imagem}</button></td>
      <td>${imagem.nome_pizza} (${imagem.pizza_id_pizza})</td>
      <td>${imagem.nome_arquivo || ''}</td>
      <td>${new Date(imagem.data_upload).toLocaleString('pt-BR')}</td>
    `;
    imagensTableBody.appendChild(row);
  });
}

async function selecionarImagem(id) {
  searchId.value = id;
  await buscarImagem();
}

// Export selecionarImagem to global scope so onclick works
window.selecionarImagem = selecionarImagem;
