const PedidoItemModel = require("../models/pedidoItemModel");
const PedidoModel = require("../models/pedidoModel");
const ProdutoModel = require("../models/produtoModel");
const { enviarPedidoParaFila } = require("../services/queueService");

class VitrineController {

    async listarProdutosView(req, res) {
        let produto = new ProdutoModel();
        let listaProdutos = await produto.listarProdutos();

        res.render('vitrine/index', { produtos: listaProdutos, layout: 'vitrine/index' });
    }

    async gravarPedido(req, res) {
    var ok = false;
    var msg = "";

    if (req.body != null && req.body != "") {

        let email = req.body.email;
        let listaPedido = req.body.itens;

        if (email == null || email == "") {
            msg = "E-mail obrigatório!";
        }
        else if (listaPedido != null && listaPedido.length > 0) {

            listaPedido = listaPedido.filter(item => item.id != null && item.id != "");

            if (listaPedido.length == 0) {
                res.send({ ok: false, msg: "Carrinho inválido!" });
                return;
            }

            let pedido = new PedidoModel();
            let listaErros = await pedido.validarPedido(listaPedido);

            if (listaErros.length == 0) {

                await pedido.gravar();

                if (pedido.pedidoId > 0) {

                    for (let i = 0; i < listaPedido.length; i++) {

                        let pedidoItem = new PedidoItemModel();

                        pedidoItem.pedidoId = pedido.pedidoId;
                        pedidoItem.produtoId = listaPedido[i].id;
                        pedidoItem.pedidoQuantidade = listaPedido[i].quantidade;

                        ok = await pedidoItem.gravar();

                        if (ok) {
                            pedido.debitarQuantidade(pedidoItem.produtoId, pedidoItem.pedidoQuantidade);
                        }
                    }

                    let valorTotal = 0;

                    for (let i = 0; i < listaPedido.length; i++) {
                        valorTotal += parseFloat(listaPedido[i].preco) * parseInt(listaPedido[i].quantidade);
                    }

                    await enviarPedidoParaFila({
                        email: email,
                        numeroPedido: pedido.pedidoId,
                        itens: listaPedido,
                        valorTotal: valorTotal.toFixed(2)
                    });
                }
                else {
                    msg = "Erro ao gerar pedido!";
                }
            }
            else {
                var msgErro = listaErros.join("\n");
                msgErro = msgErro.trim(",");
                msg = "Os seguintes produtos não possuem a quantidade desejada: \n" + msgErro;
            }
        }
        else {
            msg = "Carrinho vazio!";
        }
    }
    else {
        msg = "Parâmetros inválidos";
    }

    res.send({ ok: ok, msg: msg });
}
}

module.exports = VitrineController;