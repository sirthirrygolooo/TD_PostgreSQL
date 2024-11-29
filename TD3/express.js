express = require('express');

const bodyParser = require('body-parser');
const app = express();
const controller = require('./controller');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = 3000;

const router = express.Router();

router.get('/', (req, res) => {
    // console.log("sAUCISSE ! ");
    res.send("sAUCISSE ! ");
});

router.get('/hello', (req, res) => {
    console.log(req.query);
    if (req.query.name === undefined) {
        res.send("Paramètre manquant (name) !");
        return;
    }
    res.send("Bonjour "+req.query.name+ " ! Bello bito !");
});

router.get("/hello/:name", (req, res) => {
    res.send("Bonjour "+req.params.name+ " ! Bello bito !");
});

router.post('/hello', (req, res) => {
    console.log(req.body);
    res.send("Bonjour "+req.body.name+ " ! Bello bito !");
});

router.post('/login', (req, res) => {
    controller.login(
        req.body.first_name,
        req.body.last_name,
        req.body.password).then((succes) => {
            if (succes) {
                res.send("Connexion réussie !");
            } else {
                res.send("Connexion échouée !");
            }
        }
    );
});

router.put('/changePassword', (req, res) => {
    controller.changePassword(
        req.body.first_name,
        req.body.last_name,
        req.body.password,
        req.body.new_password).then((succes) => {
            if (succes) {
                res.send("Mot de passe changé !");
            } else {
                res.send("Changement de mot de passe échoué !");
            }
        }
    );
});

router.get("/route-logs", (req, res) => {
    controller.getLogs(req.body.user_id).then((logs) => {
        res.send(logs);
    });
});

// GET route "menu" (sous forme /menu/:name/:subname)
// "authorized" si utilisateur (id) possède les droits pour accéder à la page
// "unauthorized" sinon
// "unknown page" si la page n'existe pas

router.get("/menu/:name/:subname", (req, res) => {
    controller.authorized(req.body.user_id, req.params.name, req.params.subname).then((authorized) => {
        if (authorized) {
            res.send("authorized");
        } else {
            res.send("unauthorized");
        }
    }).catch((error) => {
        res.send("unknown page");
    });
});


app.use(router);
app.listen(port, () => {
    console.log(`[*] Express écoute sur : http://localhost:${port}`);
});