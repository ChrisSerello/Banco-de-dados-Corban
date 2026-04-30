import 'dotenv/config';
import express from 'express';
import {
    default as makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';

const app = express();
app.use(express.json());

const INSTANCE_ID = process.env.COBRANCA_INSTANCE || 'corban1';

// ← Só muda isso em relação ao código anterior
const WEBHOOK_N8N = 'http://localhost:5678/webhook/corban-bot';

let instance = {
    sock: null,
    isConnected: false,
    qrCodeData: null,
    phoneNumber: null
};

// ── Conexão WhatsApp ──────────────────────────────────────
async function connect() {
    if (instance.sock) return;

    console.log(`📱 [${INSTANCE_ID}] Iniciando...`);

    const { state, saveCreds } = await useMultiFileAuthState(`auth_info_${INSTANCE_ID}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: false,
    });

    instance.sock = sock;

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            instance.qrCodeData = qr;
            console.log(`\n📱 QR pronto! Acesse: http://localhost:8080/qrcode\n`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            instance.isConnected = false;
            instance.qrCodeData = null;
            instance.sock = null;
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconectando em 3s...');
                setTimeout(connect, 3000);
            }
        }

        if (connection === 'open') {
            instance.isConnected = true;
            instance.phoneNumber = sock.user?.id?.split(':')[0]?.split('@')[0] || INSTANCE_ID;
            console.log(`✅ Conectado! Número: ${instance.phoneNumber}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── Recebe mensagens e encaminha pro N8N ──────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.fromMe) continue;          // ignora msgs do próprio bot

            const jid = msg.key.remoteJid;
            if (jid.endsWith('@g.us')) continue;   // ignora grupos

            const text = (
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                ''
            ).trim();

            console.log(`📩 USER ← ${jid}: ${text}`);

            // ── Resposta automática ──────────────────────────────
            const resposta = processarMensagem(text, msg.pushName);
            if (resposta) {
                await instance.sock.sendMessage(jid, { text: resposta });
                console.log(`📤 BOT → ${jid}: ${resposta.substring(0, 40)}...`);
            }

            // ── Encaminha pro N8N quando estiver configurado ──────
            // try {
            //     await fetch(WEBHOOK_N8N, {
            //         method: 'POST',
            //         headers: { 'Content-Type': 'application/json' },
            //         body: JSON.stringify({ body: { ... } })
            //     });
            // } catch (err) { console.error(err.message); }
        }
    });

    // ── Lógica de resposta ──────────────────────────────────────
    function processarMensagem(texto, nome) {
        const t = texto.toLowerCase().trim();

        // Menu principal
        if (['oi', 'olá', 'ola', 'menu', '0', 'inicio', 'início'].includes(t)) {
            return `👋 Olá${nome ? ', ' + nome : ''}! Bem-vindo ao *Starcard Correspondentes*.\n\n` +
                `O que você precisa?\n\n` +
                `*1️⃣* Quero me cadastrar como correspondente.\n` +
                `*2️⃣* Consultar status do meu cadastro.\n` +
                `*3️⃣* Falar com a equipe.\n\n` +
                `Responda com o *número* da opção.`;
        }

        if (t === '1') {
            return `📋 *Cadastro de Correspondente*\n\nVamos começar! Informe o *CNPJ* da sua empresa:\n_(apenas números ou com pontuação)_`;
        }

        if (t === '2') {
            return `🔍 Informe seu *CNPJ* ou *CPF* para consultar o status do cadastro:`;
        }

        if (t === '3') {
            return `👥 *Suporte Starcard*\n\n📧 corban@starbank.tec.br\n📞 (11) 99197-3406\n📸 @starcard.tec\n\nAtendemos seg–sex, 9h–18h.`;
        }

        // Resposta padrão para qualquer outra mensagem
        return `⚠️ Não entendi. Responda *0* para ver o menu principal.`;
    }
}

// ── Endpoint: enviar mensagem (chamado pelo N8N) ──────────
app.post('/send', async (req, res) => {
    const { phone, message } = req.body;

    if (!instance.isConnected) {
        return res.status(400).json({ error: 'WhatsApp não conectado' });
    }
    if (!phone || !message) {
        return res.status(400).json({ error: 'phone e message são obrigatórios' });
    }

    try {
        const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
        const sent = await instance.sock.sendMessage(jid, { text: message });
        console.log(`✅ Enviado → ${phone}`);
        res.json({ success: true, messageId: sent?.key?.id });
    } catch (err) {
        console.error('❌ Erro ao enviar:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Endpoints de status / QR ──────────────────────────────
app.get('/status', (_, res) => res.json({
    instanceId: INSTANCE_ID,
    connected: instance.isConnected,
    phoneNumber: instance.phoneNumber,
    hasQR: instance.qrCodeData !== null
}));

app.get('/qrcode', (_, res) => {
    if (!instance.qrCodeData) {
        return res.send(`<html><body style="background:#111;color:white;text-align:center;padding:50px">
            <h2>⏳ Aguardando QR...</h2>
            <script>setTimeout(()=>location.reload(),3000)</script>
        </body></html>`);
    }
    res.send(`<html><body style="background:#111;color:white;text-align:center;padding:50px">
        <h2>📱 Escaneie — Corban Bot Starcard</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(instance.qrCodeData)}"
             style="border:8px solid white;border-radius:8px"/>
        <p>Recarrega em 15s automaticamente</p>
        <script>setTimeout(()=>location.reload(),15000)</script>
    </body></html>`);
});

app.post('/restart', async (_, res) => {
    if (instance.sock) { try { instance.sock.end(); } catch(e) {} }
    instance.sock = null;
    instance.isConnected = false;
    await connect();
    res.json({ success: true });
});

// ── Start
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    console.log(`\n🤖 Corban Bot rodando na porta ${PORT}`);
    console.log(`📱 QR Code: http://localhost:${PORT}/qrcode`);
    console.log(`📊 Status:  http://localhost:${PORT}/status\n`);
    await connect();
});