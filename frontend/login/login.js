// Seleciona o formulário
const form = document.getElementById('loginForm');

// Evento de envio do formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault(); // evita recarregar a página

  // Coleta os valores dos campos
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!email || !senha) {
    alert('Preencha todos os campos!');
    return;
  }

  try {
    // Envia para o backend
    const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, senha })
});


    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Erro ao fazer login');
      return;
    }

    // Salva token e usuário no localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));

    alert('Login realizado com sucesso! 👏');

    // Redireciona para a página inicial
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao conectar ao servidor.');
  }
});
