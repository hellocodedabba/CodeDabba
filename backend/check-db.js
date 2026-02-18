
const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT id, title, status, \"registrationStart\", \"registrationEnd\" FROM hackathons WHERE id = '445acde5-e125-4ec9-b966-a7d6887167aa'");
        console.log('HACKATHON_DATA:', JSON.stringify(res.rows[0], null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}
check();
