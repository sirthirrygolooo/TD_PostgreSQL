const format = require("pg-format");
const pool = require("./database/db");

async function getUser(id) {
    const client = await pool.connect();
    const res = await client.query('SELECT * FROM UTILISATEURS WHERE user_id = $1', [id]);
    console.log(res.rows[0]);
    client.release();
}

async function getUserByFullNameLike(nom, prenom) {
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM UTILISATEURS WHERE last_name LIKE $1 AND first_name LIKE $2';
        const res = await client.query(query, [`%${nom}%`, `%${prenom}%`]);
        console.log(res.rows);
        return res.rows;
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        client.release();
    }
}

async function login(first_name, last_name, password) {
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM UTILISATEURS WHERE first_name = $1 AND last_name = $2 AND password = $3';
        const res = await client.query(query, [first_name, last_name, password]);

        if (res.rows.length > 0) {
            await addToJournal("Connexion réussie", res.rows[0].user_id);
            return res.rows[0];
        } else {
            console.log('Utilisateur non trouvé ou mot de passe incorrect.');
            return null;
        }
    } catch (error) {
        console.error('pb connexion :', error);
        throw error;
    } finally {
        client.release();
    }
}

async function addToJournal(message, user_id) {
    const client = await pool.connect();
    try {
        const dateTimeNow = new Date().toISOString();
        const data = [
            [user_id, dateTimeNow, message]
        ];
        const query = format('INSERT INTO JOURNAUX_UTILISATEURS (user_id, date_time, event) VALUES %L', data);
        await client.query(query);
        console.log('Nouveau log ajouté au journal !');
    } catch (error) {
        console.error('Erreur insertion journaux');
        throw error;
    } finally {
        client.release();
    }
}

async function changePassword2(first_name, last_name, password, new_password) {
    const client = await pool.connect();
    try {
        const query = 'SELECT user_id FROM UTILISATEURS WHERE first_name = $1 AND last_name = $2 AND password = $3';
        const res = await client.query(query, [first_name, last_name, password]);
        if (res.rows.length === 0) {
            console.log("Utilisateur introuvable / mot de passe incorrect.");
            return null;
        }

        // for (let i=0; 

        const user_id = res.rows[0].user_id;
        const queryUpdate = 'UPDATE UTILISATEURS SET password = $1 WHERE user_id = $2';
        await client.query(queryUpdate, [new_password, user_id]);
        await addToJournal("Mot de passe changé pour :", user_id);
        console.log("Mot de passe changé avec succès !");
        return true;
    } catch (error) {
        console.error('Erreur changement mot de passe :', error);
        throw error;
    } finally {
        client.release();
    }
}

async function changePassword(first_name, last_name, password, new_password) {
    const client = await pool.connect();

    const select_usr = "SELECT user_id FROM UTILISATEURS WHERE first_name = $1 AND last_name = $2 AND password = $3";
    const res = await client.query(select_usr, [first_name, last_name, password]);

    if(res.rowCount === 0) {
        client.release();
        return 'login faield';
    }
    if (new_password == password) {
        client.release();
        return 'password already used';
    }

    const select_passwd = "SELECT M.password FROM MOTS_DE_PASSE_UTILISATEURS AS M INNER JOIN UTILISATEURS AS U ON M.user_id = U.user_id WHERE U.user_id = $1 AND M.password = $2";

    const res_used_password = await client.query(select_passwd, [res.rows[0]["user_id"], new_password]);
    if (res_used_password.rowCount > 0) {
        client.release();
        return 'password already used';
    }

    const date = new Date().toISOString();
    const insert_passwd = "INSERT INTO MOTS_DE_PASSE_UTILISATEURS (user_id, password, date_created) VALUES ($1, $2, $3)";

    await client.query(insert_passwd, [res.rows[0]["user_id"], password, date]);

    const insert_jrx = "INSERT INTO JOURNAUX_UTILISATEURS (user_id, date_time, event) VALUES ($1, $2, $3)";
    await client.query(insert_jrx, [res.rows[0]["user_id"], date, "password changed"]);

    client.release();
    return 'password changed';
}

async function getLogs(user_id) {
    const client = await pool.connect();
    try {
        const query = 'SELECT * FROM JOURNAUX_UTILISATEURS WHERE user_id = $1';
        const res = await client.query(query, [user_id]);
        return res.rows;
    } catch (error) {
        console.error('Erreur récupération logs :', error);
        throw error;
    } finally {
        client.release();
    }
}


// utilisateurs a un group_id, qui correspond a des droits dans droit_de_menus qui sont reliés à un menu_id et un element_id respectivement associés à la table menus et elements_de_menu
async function authorized(user_id, menu, submenu) {
    const client = await pool.connect();
    try {
        console.log(user_id, menu, submenu);
        const query = 'SELECT * FROM DROITS_DE_MENUS WHERE group_id = (SELECT group_id FROM UTILISATEURS WHERE user_id = $1) AND menu_id = (SELECT menu_id FROM MENUS WHERE nom_menu = $2) AND element_id = (SELECT id FROM ELEMENTS_DE_MENU WHERE lien = $3)';
        const res = await client.query(query, [user_id, menu, submenu]);
        return res.rows.length > 0;
    }
    catch (error) {
        console.error('Erreur autorisation :', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    login,
    changePassword,
    getLogs,
    authorized
};
