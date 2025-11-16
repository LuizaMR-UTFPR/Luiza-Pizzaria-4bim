const { query } = require('../database');
const path = require('path');
const fs = require('fs');

// Diretório de upload de imagens
const UPLOAD_DIR = path.join(__dirname, '../../frontend/imagem');

// Cria o diretório se não existir
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Abre a página de CRUD de imagens
exports.abrirCrudImagens = (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/imagem/imagem.html'));
};

// Lista todas as imagens
exports.listarImagens = async (req, res) => {
  try {
    const imagens = await query(`
      SELECT i.id_imagem, i.pizza_id_pizza, i.nome_arquivo, i.caminho_imagem, i.data_upload,
             p.nome_pizza
      FROM pizza_imagem i
      JOIN pizza p ON i.pizza_id_pizza = p.id_pizza
      ORDER BY i.data_upload DESC
    `);
    // Normalizar caminho_imagem para URL pública (/imagem/nome)
    const rows = imagens.rows.map(r => {
      let caminho = r.caminho_imagem || null;
      if (caminho) {
        // Se já for uma URL pública (começa com /), mantém
        if (!caminho.startsWith('/')) {
          // extrai nome do arquivo e monta a URL pública
          const partes = caminho.split(/[\\/]+/);
          const nome = partes[partes.length - 1];
          caminho = `/imagem/${nome}`;
        }
      } else if (r.nome_arquivo) {
        caminho = `/imagem/${r.nome_arquivo}`;
      }
      return { ...r, caminho_imagem: caminho };
    });
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Busca imagem de uma pizza específica
exports.obterImagemPizza = async (req, res) => {
  try {
    const pizzaId = parseInt(req.params.pizzaId);
    const imagem = await query(
      `SELECT id_imagem, pizza_id_pizza, nome_arquivo, caminho_imagem, data_upload
       FROM pizza_imagem
       WHERE pizza_id_pizza = $1`,
      [pizzaId]
    );

    if (imagem.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    const r = imagem.rows[0];
    let caminho = r.caminho_imagem || null;
    if (caminho) {
      if (!caminho.startsWith('/')) {
        const partes = caminho.split(/[\\/]+/);
        const nome = partes[partes.length - 1];
        caminho = `/imagem/${nome}`;
      }
    } else if (r.nome_arquivo) {
      caminho = `/imagem/${r.nome_arquivo}`;
    }
    res.json({ ...r, caminho_imagem: caminho });
  } catch (error) {
    console.error('Erro ao obter imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Busca imagem por id
exports.obterImagemPorId = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const imagem = await query(
      `SELECT i.id_imagem, i.pizza_id_pizza, i.nome_arquivo, i.caminho_imagem, i.data_upload, p.nome_pizza
       FROM pizza_imagem i
       JOIN pizza p ON i.pizza_id_pizza = p.id_pizza
       WHERE i.id_imagem = $1`,
      [id]
    );

    if (imagem.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    const r = imagem.rows[0];
    let caminho = r.caminho_imagem || null;
    if (caminho) {
      if (!caminho.startsWith('/')) {
        const partes = caminho.split(/[\\/]+/);
        const nome = partes[partes.length - 1];
        caminho = `/imagem/${nome}`;
      }
    } else if (r.nome_arquivo) {
      caminho = `/imagem/${r.nome_arquivo}`;
    }
    res.json({ ...r, caminho_imagem: caminho });
  } catch (error) {
    console.error('Erro ao obter imagem por id:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualiza imagem por id (pode trocar arquivo e/ou pizza_id)
exports.atualizarImagem = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { pizzaId, nomeArquivo, base64Data } = req.body;

    const imagemResult = await query('SELECT * FROM pizza_imagem WHERE id_imagem = $1', [id]);
    if (imagemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    const atual = imagemResult.rows[0];
    let novoNomeArquivo = atual.nome_arquivo;
    let novoCaminho = atual.caminho_imagem;

    // Se houver base64Data, substitui o arquivo
    if (base64Data && nomeArquivo) {
      const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const timestamp = Date.now();
      const extensao = nomeArquivo.split('.').pop() || 'jpg';
      novoNomeArquivo = `pizza_${pizzaId || atual.pizza_id_pizza}_${timestamp}.${extensao}`;
      const caminhoCompletoAbs = path.join(UPLOAD_DIR, novoNomeArquivo);

      // Salva novo arquivo (absoluto)
      fs.writeFileSync(caminhoCompletoAbs, Buffer.from(base64String, 'base64'));

      // Calcula a URL pública que deve ser salva no banco
      novoCaminho = `/imagem/${novoNomeArquivo}`;

      // Deleta arquivo antigo calculando caminho absoluto a partir do registro atual
      let caminhoAntigoAbs = null;
      if (atual.nome_arquivo) {
        caminhoAntigoAbs = path.join(UPLOAD_DIR, atual.nome_arquivo);
      } else if (atual.caminho_imagem) {
        const partes = atual.caminho_imagem.split('/');
        const nomeAntigo = partes[partes.length - 1];
        caminhoAntigoAbs = path.join(UPLOAD_DIR, nomeAntigo);
      }
      if (caminhoAntigoAbs && fs.existsSync(caminhoAntigoAbs)) {
        try { fs.unlinkSync(caminhoAntigoAbs); } catch (e) { console.warn('Falha ao deletar arquivo antigo', e); }
      }
    }

    // Se trocar pizzaId, verificar unicidade
    const novoPizzaId = pizzaId ? parseInt(pizzaId) : atual.pizza_id_pizza;
    if (novoPizzaId !== atual.pizza_id_pizza) {
      const existeParaOutra = await query('SELECT id_imagem FROM pizza_imagem WHERE pizza_id_pizza = $1', [novoPizzaId]);
      if (existeParaOutra.rows.length > 0) {
        return res.status(400).json({ error: 'Já existe imagem cadastrada para essa pizza' });
      }
    }

    // Garantir que o caminho salvo no DB seja a URL pública (ex: /imagem/nomefile)
    const caminhoParaSalvar = (novoCaminho && novoCaminho.startsWith('/')) ? novoCaminho : `/imagem/${novoNomeArquivo}`;
    const result = await query(
      `UPDATE pizza_imagem SET pizza_id_pizza = $1, nome_arquivo = $2, caminho_imagem = $3, data_upload = NOW()
       WHERE id_imagem = $4 RETURNING *`,
      [novoPizzaId, novoNomeArquivo, caminhoParaSalvar, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Salva imagem de uma pizza (usando base64 ou upload de arquivo)
exports.salvarImagem = async (req, res) => {
  try {
    const { pizzaId, nomeArquivo, base64Data } = req.body;

    if (!pizzaId || !nomeArquivo || !base64Data) {
      return res.status(400).json({ error: 'Dados obrigatórios faltando' });
    }

    // Verifica se a pizza existe
    const pizzaResult = await query('SELECT id_pizza FROM pizza WHERE id_pizza = $1', [pizzaId]);
    if (pizzaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pizza não encontrada' });
    }

    // Remove 'data:image/...;base64,' do início
    const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Gera um nome único para o arquivo
    const timestamp = Date.now();
    const extensao = nomeArquivo.split('.').pop() || 'jpg';
    const nomeUnico = `pizza_${pizzaId}_${timestamp}.${extensao}`;
    const caminhoCompletoAbs = path.join(UPLOAD_DIR, nomeUnico);

    // Salva o arquivo no disco (caminho absoluto)
    fs.writeFileSync(caminhoCompletoAbs, Buffer.from(base64String, 'base64'));
    // URL pública relativa que será salva no banco
    const caminhoPublico = `/imagem/${nomeUnico}`;

    // Verifica se já existe imagem para essa pizza
    const imagemExistente = await query(
      'SELECT id_imagem, caminho_imagem FROM pizza_imagem WHERE pizza_id_pizza = $1',
      [pizzaId]
    );

    let resultado;
    if (imagemExistente.rows.length > 0) {
      // Deleta a imagem antiga do servidor (calcula caminho absoluto a partir do nome_arquivo ou da URL)
      const antigo = imagemExistente.rows[0];
      let caminhoAntigoAbs = null;
      if (antigo.nome_arquivo) {
        caminhoAntigoAbs = path.join(UPLOAD_DIR, antigo.nome_arquivo);
      } else if (antigo.caminho_imagem) {
        // se foi salva como URL '/imagem/nome', extrai o nome
        const partes = antigo.caminho_imagem.split('/');
        const nomeAntigo = partes[partes.length - 1];
        caminhoAntigoAbs = path.join(UPLOAD_DIR, nomeAntigo);
      }
      if (caminhoAntigoAbs && fs.existsSync(caminhoAntigoAbs)) {
        try { fs.unlinkSync(caminhoAntigoAbs); } catch (e) { console.warn('falha ao excluir antigo', e); }
      }

      // Atualiza o registro (salva URL pública)
      resultado = await query(
        `UPDATE pizza_imagem 
         SET nome_arquivo = $1, caminho_imagem = $2, data_upload = NOW()
         WHERE pizza_id_pizza = $3
         RETURNING *`,
        [nomeUnico, caminhoPublico, pizzaId]
      );
    } else {
      // Cria novo registro
      resultado = await query(
        `INSERT INTO pizza_imagem (pizza_id_pizza, nome_arquivo, caminho_imagem)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [pizzaId, nomeUnico, caminhoPublico]
      );
    }

    res.status(201).json({
      sucesso: true,
      imagem: resultado.rows[0],
      urlImagem: caminhoPublico
    });
  } catch (error) {
    console.error('Erro ao salvar imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deleta imagem de uma pizza
exports.deletarImagem = async (req, res) => {
  try {
    const imagemId = parseInt(req.params.id);

    const imagemResult = await query(
      'SELECT caminho_imagem FROM pizza_imagem WHERE id_imagem = $1',
      [imagemId]
    );

    if (imagemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Imagem não encontrada' });
    }

    const img = imagemResult.rows[0];
    // Calcula caminho absoluto do arquivo a partir do nome_arquivo ou da URL
    let caminhoImagemAbs = null;
    if (img.nome_arquivo) {
      caminhoImagemAbs = path.join(UPLOAD_DIR, img.nome_arquivo);
    } else if (img.caminho_imagem) {
      const partes = img.caminho_imagem.split('/');
      const nome = partes[partes.length - 1];
      caminhoImagemAbs = path.join(UPLOAD_DIR, nome);
    }

    // Deleta o arquivo do servidor
    if (caminhoImagemAbs && fs.existsSync(caminhoImagemAbs)) {
      try { fs.unlinkSync(caminhoImagemAbs); } catch (e) { console.warn('falha ao deletar arquivo', e); }
    }

    // Deleta o registro do banco
    await query('DELETE FROM pizza_imagem WHERE id_imagem = $1', [imagemId]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
