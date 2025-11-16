const express = require('express');
const router = express.Router();
const { QrCodePix } = require('qrcode-pix');
const QRCode = require('qrcode'); // <-- Adicionado!

router.post('/gerar', async (req, res) => {
  const { valor, nome, cidade } = req.body || {};

  const KEY_PIX = process.env.CHAVE_PIX;
  const NAME = process.env.NOME_RECEBEDOR || nome;
  const CITY = process.env.CIDADE_RECEBEDOR || cidade;

  if (!KEY_PIX) {
    return res.status(500).json({ error: 'Chave PIX não configurada no servidor' });
  }

  if (!valor) {
    return res.status(400).json({ error: 'Campo "valor" é obrigatório' });
  }

  try {
    // Garante formato correto do valor
    const amount = (typeof valor === 'number') ? valor.toFixed(2) : String(valor);

    // 1️⃣ Gera o payload PIX
    const qrCodePix = QrCodePix({
      version: '01',
      key: KEY_PIX,
      name: NAME,
      city: CITY,
      value: parseFloat(amount),
      message: 'Pagamento pedido pizzaria'
    });

    const payload = qrCodePix.payload();

    // 2️⃣ Gera a imagem base64 do QR Code usando 'qrcode'
    const qrCode = await QRCode.toDataURL(payload);

    // 3️⃣ Retorna para o frontend
    res.json({ payload, qrCode });

  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code PIX', details: error.message });
  }
});

module.exports = router;