const common = require("oci-common");
const queue = require("oci-queue");

const config = require("../config/ociQueueConfig");

const provider = new common.ConfigFileAuthenticationDetailsProvider(".oci/config", "DEFAULT");

const queueClient = new queue.QueueClient({
    authenticationDetailsProvider: provider
});

queueClient.endpoint = config.messagesEndpoint;

async function enviarPedidoParaFila(dadosPedido) {

    const mensagem = JSON.stringify(dadosPedido);

    await queueClient.putMessages({
        queueId: config.queueId,
        putMessagesDetails: {
            messages: [
                {
                    content: mensagem
                }
            ]
        }
    });
}

module.exports = {
    enviarPedidoParaFila
};