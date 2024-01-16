import { Pool } from 'pg';
const pool = new Pool({
  user: '75ways',
  host: 'localhost',
  database: 'piyushdb',
  password: '12345',
  port: 5432, // default port for PostgreSQL
});
const databaseConnection = () => {
  
  pool.connect((err, client, done) => {
    if (err) {
      console.error('Connection error', err.stack);
      return;
    }
    if (!client) {
      console.error('Client is undefined');
      return;
    }
    console.log('Database connected');
    const createTableText = `
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        fullname VARCHAR(100) NOT NULL
      )
    `;
    client.query(createTableText, (err, res) => {
      done(); // release the client back to the pool
      if (err) {
        console.error('Error creating table', err.stack);
        return;
      }
      console.log('Table created');
    });
  });
  pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
};
export { databaseConnection, pool};