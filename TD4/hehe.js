const fs = require('fs');
const { Client } = require('pg');

// Connexion à PostgreSQL
const client = new Client({
  user: 'votre_utilisateur',
  host: 'localhost',
  database: 'nobelprize',
  password: 'votre_mot_de_passe',
  port: 5432,
});

async function main() {
  await client.connect();

  const data = JSON.parse(fs.readFileSync('prize.json', 'utf-8'));

  for (const prize of data.prizes) {
    // Insérer dans la table prizes
    const prizeRes = await client.query(
      `INSERT INTO prizes (year, category) 
       VALUES ($1, $2) 
       ON CONFLICT (year, category) DO NOTHING 
       RETURNING id`,
      [prize.year, prize.category]
    );
    const prizeId = prizeRes.rows[0]?.id;

    if (prize.laureates) {
      for (const laureate of prize.laureates) {
        // Insérer dans la table laureates
        const laureateRes = await client.query(
          `INSERT INTO laureates (firstname, surname) 
           VALUES ($1, $2) 
           ON CONFLICT (firstname, surname) DO NOTHING 
           RETURNING id`,
          [laureate.firstname, laureate.surname]
        );
        const laureateId = laureateRes.rows[0]?.id;

        // Insérer dans la table prize_laureates
        await client.query(
          `INSERT INTO prize_laureates (prize_id, laureate_id, motivation, share) 
           VALUES ($1, $2, $3, $4)`,
          [prizeId, laureateId, laureate.motivation, laureate.share]
        );
      }
    }
  }

  console.log('Données insérées avec succès');
  await client.end();
}

main().catch(console.error);
