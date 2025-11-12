// Chave PIX da Pizzaria - CONFIGURAR COM CHAVE REAL!
// Pode ser: email, telefone, CPF ou chave aleatória
const CHAVE_PIX = '+5544999074747'; // Telefone com +55 e DDD
const NOME_RECEBEDOR = 'Luiza Marcacini Rodolfo';
const CIDADE_RECEBEDOR = 'Peabiru';

let valorPedido = 0;

window.addEventListener('DOMContentLoaded', async () => {
  await carregarPedido();
});

async function carregarPedido() {
  try {
    // Tenta obter o pedido do localStorage
    const pedido = JSON.parse(localStorage.getItem('pedidoResumo') || '{}');
    
    if (!pedido || !pedido.valor_total) {
      mostrarErro('Nenhum pedido encontrado. Redirecionando...');
      setTimeout(() => {
        window.location.href = '../cardapio/cardapio.html';
      }, 2000);
      return;
    }

    valorPedido = parseFloat(pedido.valor_total);
    
    // Atualiza o valor na tela
    document.getElementById('valorPix').textContent = `R$ ${valorPedido.toFixed(2)}`;
    
    // Gera o QR Code PIX
    await gerarQrCodePix(valorPedido);
    
  } catch (error) {
    console.error('Erro ao carregar pedido:', error);
    mostrarErro('Erro ao carregar os dados do pedido');
  }
}

async function gerarQrCodePix(valor) {
  try {
    const qrCodeArea = document.getElementById('qrCodeArea');
    const chavePix = document.getElementById('chavePix');
    const pixPayload = document.getElementById('pixPayload');
    
    // Mostra loading
    qrCodeArea.innerHTML = '<p>⏳ Gerando QR Code PIX...</p>';
    
    // Faz a requisição ao backend
    const response = await fetch('http://localhost:3001/pix/gerar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valor: valor.toFixed(2),
        chave: CHAVE_PIX,
        nome: NOME_RECEBEDOR,
        cidade: CIDADE_RECEBEDOR
      })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.qrCode) {
      throw new Error('QR Code não foi gerado');
    }

    // Atualiza a tela com o QR Code gerado
    qrCodeArea.innerHTML = `<img src="${data.qrCode}" alt="QR Code PIX" />`;
    
    // Mostra a chave PIX
    chavePix.value = CHAVE_PIX;
    
    // Mostra o payload (código copia e cola)
    if (data.payload) {
      pixPayload.textContent = `Copia e Cola: ${data.payload}`;
      pixPayload.style.display = 'block';
    }
    
    console.log('✓ QR Code PIX gerado com sucesso');
    
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    document.getElementById('qrCodeArea').innerHTML = `
      <div style="color: #d32f2f; padding: 20px;">
        <p>❌ Erro ao gerar QR Code PIX</p>
        <p style="font-size: 12px;">${error.message}</p>
      </div>
    `;
  }
}

function copiarChavePix() {
  const input = document.getElementById('chavePix');
  
  if (!input.value) {
    mostrarErro('Chave PIX não disponível');
    return;
  }

  // Seleciona e copia o texto
  input.select();
  document.execCommand('copy');
  
  // Feedback visual
  const btn = event.target;
  const textoOriginal = btn.textContent;
  btn.textContent = '✓ Copiado!';
  btn.style.background = '#4caf50';
  
  setTimeout(() => {
    btn.textContent = textoOriginal;
    btn.style.background = '#ff9800';
  }, 2000);
}

function confirmarPagamento() {
  // Mostra mensagem de sucesso
  const qrCodeArea = document.getElementById('qrCodeArea');
  
  qrCodeArea.innerHTML = `
    <div style="padding: 40px 20px; text-align: center;">
      <p style="font-size: 48px; margin: 0;">✅</p>
      <h3 style="color: #2e7d32; margin: 15px 0;">Pagamento Confirmado!</h3>
      <p style="color: #666;">Seu pedido foi confirmado e será preparado em breve.</p>
      <p style="color: #999; font-size: 14px;">Redirecionando em 3 segundos...</p>
    </div>
  `;
  
  // Limpa o localStorage
  setTimeout(() => {
    localStorage.removeItem('pedidoResumo');
    window.location.href = '../index.html';
  }, 3000);
}

function mostrarErro(mensagem) {
  const container = document.getElementById('pixContainer');
  const msgEl = document.createElement('div');
  msgEl.className = 'mensagem erro';
  msgEl.textContent = `❌ ${mensagem}`;
  container.insertBefore(msgEl, container.firstChild);
  
  setTimeout(() => msgEl.remove(), 5000);
}