const common = require("oci-common");
const queue = require("oci-queue");
const nodemailer = require("nodemailer");

const config = require("./config/ociQueueConfig");

const provider = new common.ConfigFileAuthenticationDetailsProvider(".oci/config", "DEFAULT");

const queueClient = new queue.QueueClient({
    authenticationDetailsProvider: provider
});

queueClient.endpoint = config.messagesEndpoint;

const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: {
        user: config.smtpUser,
        pass: config.smtpPass
    }
});

async function enviarEmailPedido(pedido) {

    await transporter.sendMail({
        from: config.emailFrom,
        to: pedido.email,
        subject: `Pedido #${pedido.numeroPedido}`,
        html: `
            <h2>Pedido Confirmado</h2>

            <p>Pedido: ${pedido.numeroPedido}</p>

            <p>Total: R$ ${pedido.valorTotal}</p>
        `
    });
}

async function consumirFila() {

    try {

        const resposta = await queueClient.getMessages({
            queueId: config.queueId,
            limit: 5,
            timeoutInSeconds: 10
        });

        const mensagens = resposta.getMessages.messages;

        if (!mensagens || mensagens.length === 0) {
            return;
        }

        for (const msg of mensagens) {

            try {

                const pedido = JSON.parse(msg.content);

                await enviarEmailPedido(pedido);

                await queueClient.deleteMessage({
                    queueId: config.queueId,
                    messageReceipt: msg.receipt
                });

                console.log("E-mail enviado:", pedido.email);

            } catch (erroMsg) {

                console.error("Erro mensagem:", erroMsg);
            }
        }

    } catch (erro) {

        console.error("Erro fila:", erro);
    }
}

setInterval(consumirFila, 10000);

console.log("Consumidor iniciado...");