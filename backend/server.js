require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');

// Importar a configuração do banco PostgreSQL
const db = require('./database'); // Ajuste o caminho conforme necessário

// Configurações do servidor
const HOST = 'localhost';
const PORT_FIXA = 3001;

// Caminho para o frontend
const caminhoFrontend = path.join(__dirname, '../frontend');
console.log('Caminho frontend:', caminhoFrontend);

app.use(cookieParser());
// Aumentar limite para permitir uploads de imagens em base64 maiores
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================
// SERVIR HTMLS DO FRONTEND
// ==========================

// Servir tudo que está em /frontend como arquivos estáticos
app.use(express.static(caminhoFrontend));

// Servir especificamente os arquivos HTML da pasta /frontend/relatorio
app.use('/relatorio', express.static(path.join(__dirname, '../frontend/relatorio')));

// ==========================
// MIDDLEWARES GERAIS
// ==========================

// Middleware para permitir CORS
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5501',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Middleware para adicionar a instância do banco às requisições
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Middleware de tratamento de erros JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON malformado',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  next(err);
});

// ==========================
// IMPORTANDO AS ROTAS
// ==========================

const pessoaRoutes = require('./routes/pessoaRoutes');
app.use('/pessoa', pessoaRoutes);

const clienteRoutes = require('./routes/clienteRoutes');
app.use('/cliente', clienteRoutes);

const funcionarioRoutes = require('./routes/funcionarioRoutes');
app.use('/funcionario', funcionarioRoutes);

const gerenteRoutes = require('./routes/gerenteRoutes');
app.use('/gerente', gerenteRoutes);

const pizzaRoutes = require('./routes/pizzaRoutes');
app.use('/pizza', pizzaRoutes);

const saborRoutes = require('./routes/saborRoutes');
app.use('/sabor', saborRoutes);

const pedidoRoutes = require('./routes/pedidoRoutes');
app.use('/pedido', pedidoRoutes);

const pizzaSaborRoutes = require('./routes/pizzaSaborRoutes');
app.use('/pizzaSabor', pizzaSaborRoutes);

// Rotas dos relatórios (API JSON)
const relatorioRoutes = require('./routes/relatorioRoutes');
app.use('/relatorios', relatorioRoutes);

// Cadastro e login
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const pixRoutes = require('./routes/pixRoutes');
app.use('/pix', pixRoutes);

const imagemRoutes = require('./routes/imagemRoutes');
app.use('/api/imagem', imagemRoutes);

// ==========================
// ROTAS PADRÃO
// ==========================

app.get('/', (req, res) => {
  res.json({
    message: '🍕 Server da Pizzaria rodando!',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    const connectionTest = await db.testConnection();
    if (connectionTest) {
      res.status(200).json({
        status: 'OK',
        message: 'Servidor e banco de dados funcionando',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'ERROR',
        message: 'Problema na conexão com o banco de dados',
        database: 'PostgreSQL',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro interno do servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================
// ERROS GLOBAIS E 404
// ==========================

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString()
  });
});

// ==========================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================

const startServer = async () => {
  try {
    console.log(caminhoFrontend);
    console.log('Testando conexão com PostgreSQL...');
    const connectionTest = await db.testConnection();

    if (!connectionTest) {
      console.error('❌ Falha na conexão com PostgreSQL');
      process.exit(1);
    }

    console.log('✅ PostgreSQL conectado com sucesso');

    const PORT = process.env.PORT || PORT_FIXA;

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
      console.log(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
      console.log(`🗄️ Banco de dados: PostgreSQL`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Encerramento graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM recebido, encerrando servidor...');
  try {
    await db.pool.end();
    console.log('✅ Conexões com PostgreSQL encerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    process.exit(1);
  }
});

// Iniciar o servidor
startServer();
