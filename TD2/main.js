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

async function changePassword(first_name, last_name, password, new_password) {
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

getUser(1);

getUserByFullNameLike('Perr', 'Milvyne').then(users => {
    console.log('Found users: ', users);
}).catch(error => {
    console.error('Error ', error);
});

login('Milvyne', 'Perrolet', 'milvyne123').then(user => {
    if (user) {
        console.log('Connexion ok !');
    } else {
        console.log('Connexion pas ok !');
    }
}).catch(error => {
    console.error('Erreur :', error);
});

changePassword('Milvyne', 'Perrolet', 'milvyne123', 'je_suis_securise_hehe').then(success => {
    if (success) {
        console.log('Mot de passe changé avec succès !');
    } else {
        console.log('Changement de mot de passe échoué.');
    }
}).catch(error => {
    console.error('Erreur changement mot de passe :', error);
});
