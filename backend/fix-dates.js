
const { Client } = require('pg');
require('dotenv').config();

async function update() {
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
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        await client.query(
            'UPDATE hackathons SET "registrationStart" = $1, "registrationEnd" = $2 WHERE id = $3',
            [start, end, '445acde5-e125-4ec9-b966-a7d6887167aa']
        );
        console.log('SUCCESS: Hackathon registration dates updated to be active now.');
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}
update();
