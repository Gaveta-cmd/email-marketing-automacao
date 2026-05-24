import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';
const CLICKUP_API_KEY = process.env.CLICKUP_API_KEY;
const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ============================================
// SUBSCRIBER MANAGEMENT
// ============================================

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email, firstName, lastName, tags } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!BREVO_API_KEY) {
      return res.status(400).json({ error: 'BREVO_API_KEY não configurada. Use com chave real para enviar.' });
    }

    const brevoResponse = await axios.post(
      `${BREVO_API_URL}/contacts`,
      {
        email,
        attributes: {
          FIRSTNAME: firstName || '',
          LASTNAME: lastName || '',
        },
      },
      {
        headers: { 'api-key': BREVO_API_KEY },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Subscriber adicionado com sucesso',
      data: { email, id: brevoResponse.data.id },
    });
  } catch (error) {
    console.error('Erro ao adicionar subscriber:', error.message);
    return res.status(500).json({
      error: 'Falha ao adicionar subscriber',
      details: error.message,
    });
  }
});

// ============================================
// CAMPAIGN SENDING
// ============================================

app.post('/api/send-campaign', async (req, res) => {
  try {
    const { templateId, segmentTag, subject, recipientEmail } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'templateId é obrigatório' });
    }

    if (!BREVO_API_KEY) {
      return res.status(400).json({ error: 'BREVO_API_KEY não configurada' });
    }

    const recipients = recipientEmail
      ? [{ email: recipientEmail }]
      : [{ email: 'test@example.com' }];

    const campaignResponse = await axios.post(
      `${BREVO_API_URL}/smtp/email`,
      {
        to: recipients,
        templateId: parseInt(templateId),
        subject: subject || 'Campanha de Email',
      },
      {
        headers: { 'api-key': BREVO_API_KEY },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Campanha enviada para ${recipients.length} contatos`,
      data: { messageId: campaignResponse.data.messageId },
    });
  } catch (error) {
    console.error('Erro ao enviar campanha:', error.message);
    return res.status(500).json({
      error: 'Falha ao enviar campanha',
      details: error.message,
    });
  }
});

// ============================================
// TEMPLATES
// ============================================

app.get('/api/templates', async (req, res) => {
  try {
    if (!BREVO_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Configure BREVO_API_KEY no .env para usar',
        templates: []
      });
    }

    const response = await axios.get(`${BREVO_API_URL}/smtp/templates`, {
      headers: { 'api-key': BREVO_API_KEY },
    });

    return res.status(200).json({
      success: true,
      templates: response.data.templates || [],
    });
  } catch (error) {
    console.error('Erro ao buscar templates:', error.message);
    return res.status(500).json({
      error: 'Falha ao buscar templates',
      details: error.message,
    });
  }
});

// ============================================
// WEBHOOK - Automation from Make/ClickUp
// ============================================

app.post('/api/webhook/campaign-trigger', async (req, res) => {
  try {
    const { email, templateId, firstName, subject } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Email inválido no webhook' });
    }

    if (!BREVO_API_KEY) {
      return res.status(400).json({ error: 'BREVO_API_KEY não configurada' });
    }

    await axios.post(
      `${BREVO_API_URL}/smtp/email`,
      {
        to: [{ email, name: firstName || '' }],
        templateId: parseInt(templateId || 1),
        subject: subject || 'Mensagem Personalizada',
      },
      {
        headers: { 'api-key': BREVO_API_KEY },
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Email enviado via webhook',
    });
  } catch (error) {
    console.error('Erro ao processar webhook:', error.message);
    return res.status(500).json({
      error: 'Falha ao processar webhook',
      details: error.message,
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Email Marketing Automação',
  });
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Email Marketing Automação</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; background: #f5f5f5; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; }
          .endpoint { background: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
          code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
          .success { color: #28a745; }
          .warning { color: #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✉️ Email Marketing Automação</h1>
          <p>API v1.0 - Automação de email com Make, Brevo e ClickUp</p>

          <h2>Endpoints Disponíveis:</h2>

          <div class="endpoint">
            <strong>POST /api/subscribe</strong><br>
            Adicionar novo subscriber<br>
            <code>{ "email": "test@example.com", "firstName": "John", "tags": ["vip"] }</code>
          </div>

          <div class="endpoint">
            <strong>POST /api/send-campaign</strong><br>
            Enviar campanha de email<br>
            <code>{ "templateId": 1, "segmentTag": "vip", "subject": "Oferta Especial" }</code>
          </div>

          <div class="endpoint">
            <strong>GET /api/templates</strong><br>
            Listar templates do Brevo
          </div>

          <div class="endpoint">
            <strong>POST /api/webhook/campaign-trigger</strong><br>
            Webhook para automação (Make/Zapier)<br>
            <code>{ "email": "user@example.com", "templateId": 1 }</code>
          </div>

          <div class="endpoint">
            <strong>GET /api/health</strong><br>
            Health check da API
          </div>

          <p class="success">✓ Status: Online</p>
          <p class="warning">⚠️ Nota: Configure BREVO_API_KEY no .env para enviar emails reais</p>
          <p style="color: #666; font-size: 12px;">GitHub: <a href="https://github.com/Gaveta-cmd/email-marketing-automacao">Gaveta-cmd/email-marketing-automacao</a></p>
        </div>
      </body>
    </html>
  `);
});

// ============================================
// START SERVER
// ============================================

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
    console.log(`✓ Documentação em http://localhost:${PORT}`);
  });
}

export default app;
