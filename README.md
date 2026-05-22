# Email Marketing Automação

API REST para automação de email marketing integrando **Brevo**, **Make** e **ClickUp**.

## Tecnologias

- Node.js + Express
- Brevo (Sendinblue) API v3
- Axios
- dotenv

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
BREVO_API_KEY=sua_chave_aqui
CLICKUP_API_KEY=sua_chave_aqui
PORT=8000
```

## Uso

```bash
npm start
```

Acesse `http://localhost:8000` para ver os endpoints disponíveis.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/templates` | Listar templates do Brevo |
| POST | `/api/subscribe` | Adicionar novo contato |
| POST | `/api/send-campaign` | Enviar campanha de email |
| POST | `/api/webhook/campaign-trigger` | Webhook para automações |

### Exemplos

**Adicionar contato:**
```bash
curl -X POST http://localhost:8000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "contato@exemplo.com", "firstName": "João"}'
```

**Enviar campanha:**
```bash
curl -X POST http://localhost:8000/api/send-campaign \
  -H "Content-Type: application/json" \
  -d '{"templateId": 1, "subject": "Oferta Especial", "recipientEmail": "contato@exemplo.com"}'
```

**Webhook:**
```bash
curl -X POST http://localhost:8000/api/webhook/campaign-trigger \
  -H "Content-Type: application/json" \
  -d '{"email": "user@exemplo.com", "templateId": 1, "firstName": "Maria"}'
```

## Licença

MIT
