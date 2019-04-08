require('dotenv').config()
// console.log('env: ')
// console.dir(process.env)

const {NODE_ENV} = process.env

if (NODE_ENV === 'development'){
  require('babel-polyfill');
}

const app = require('./app');

const PORT = process.env.BACKEND_PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});
