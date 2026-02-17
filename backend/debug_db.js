const { Client } = require('pg');

const client = new Client({
    host: 'ep-mute-morning-airlar4e-pooler.c-4.us-east-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_PEl5agw1Txco',
    database: 'neondb',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();

    try {
        console.log('--- USERS ---');
        const resUsers = await client.query('SELECT id, email, role FROM "user"');
        console.log(JSON.stringify(resUsers.rows, null, 2));

        console.log('\n--- MENTOR PROFILES ---');
        const resMentors = await client.query('SELECT * FROM "mentor_profile"');
        console.log(JSON.stringify(resMentors.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
