// Update with your config settings.
//
//

const connection = {
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  ssl: process.env.POSTGRES_USE_SSL === 'true'
}
console.dir({connection})

module.exports = {
  development: {
    client: 'postgresql',
    connection,
    pool: {
      min: 2,
      max: 10
    },
  },
  production: {
    client: 'postgresql',
    connection,
    pool: {
      min: 2,
      max: 10
    },
  }

};
