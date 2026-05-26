const express = require('express');
const multer = require("multer");
const ProdutoController = require('../controllers/produtoController');
const Autenticacao = require('../middlewares/autenticacao');

class ProdutoRoute {

    #router;

    get router() {
        return this.#router;
    }

    set router(router) {
        this.#router = router
    }

    constructor() {
        this.#router = express.Router();

        let storage = multer.memoryStorage();
        let upload = multer({ storage });

        let auth = new Autenticacao();
        let ctrl = new ProdutoController();

        this.#router.get('/', auth.usuarioIsAdmin, ctrl.listarView.bind(ctrl));
        this.#router.get('/cadastro', auth.usuarioIsAdmin, ctrl.cadastroView.bind(ctrl));

        this.#router.post(
            "/cadastro",
            auth.usuarioIsAdmin,
            upload.single("inputImagem"),
            ctrl.cadastrarProduto.bind(ctrl)
        );

        this.#router.post("/excluir", auth.usuarioIsAdmin, ctrl.excluirProduto.bind(ctrl));
        this.#router.get("/alterar/:id", auth.usuarioIsAdmin, ctrl.alterarView.bind(ctrl));

        this.#router.post(
            "/alterar",
            auth.usuarioIsAdmin,
            upload.single("inputImagem"),
            ctrl.alterarProduto.bind(ctrl)
        );

        this.#router.post("/buscar", ctrl.buscaProduto.bind(ctrl));
    }
}

module.exports = ProdutoRoute;