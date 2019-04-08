var child_process = require('child_process')
var script = './server/index.js'

var log_date_format= 'YYYY-MM-DD HH:mm:ss.SSS Z'

//NOTE: if you change this you have to manually change the proxy target in client/package.json
var BACKEND_PORT_DEV = 7000
var FRONTEND_PORT_DEV = 3000
var BACKEND_PORT_STAGING = 7000

var localPostgres = {
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: 7432,
  POSTGRES_USER: 'photos_app',
  POSTGRES_PASSWORD: 'password',
  POSTGRES_DB: 'photos_app',
}

var prodPostgres= {
  POSTGRES_HOST: 'localhost',
  POSTGRES_USER: 'photos_app',
  POSTGRES_PASSWORD: 'password',
  POSTGRES_DB: 'photos_app',
  POSTGRES_PORT: 7432,
}



module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [
    {
      name: 'local',
      script,
      interpreter: 'babel-node',
      log_date_format,
      env: {
        NODE_ENV: 'development',
        BACKEND_PORT: BACKEND_PORT_DEV,
        PORT: FRONTEND_PORT_DEV,
        FILE_UPLOAD_DIR: './uploaded_files/',

        POSTGRES_HOST: localPostgres.POSTGRES_HOST,
        POSTGRES_USER: localPostgres.POSTGRES_USER,
        POSTGRES_PASSWORD: localPostgres.POSTGRES_PASSWORD,
        POSTGRES_DB: localPostgres.POSTGRES_DB,
        POSTGRES_PORT: localPostgres.POSTGRES_PORT,
        POSTGRES_USE_SSL: false,

        DANGEROUSLY_DISABLE_HOST_CHECK: true,

        SESSION_SECRET: 'apple',
        JWT_SECRET: 'orange',

        // NOTE: only variables with the prefix REACT_APP_ will be visible to the frontend (for security purposes)
        REACT_APP_BACKEND_URI: 'localhost:'+BACKEND_PORT_DEV,
        REACT_APP_FRONTEND_URI: 'localhost:'+FRONTEND_PORT_DEV,
      },
    },
    {
      name: 'prod',
      script,
      interpreter: 'babel-node',
      log_date_format,
      env: {
        NODE_ENV: 'production',
        BACKEND_PORT: BACKEND_PORT_DEV,
        PORT: FRONTEND_PORT_DEV,
        FILE_UPLOAD_DIR: './uploaded_files/',

        POSTGRES_HOST: prodPostgres.POSTGRES_HOST,
        POSTGRES_USER: prodPostgres.POSTGRES_USER,
        POSTGRES_PASSWORD: prodPostgres.POSTGRES_PASSWORD,
        POSTGRES_DB: prodPostgres.POSTGRES_DB,
        POSTGRES_PORT: prodPostgres.POSTGRES_PORT,
        POSTGRES_USE_SSL: false,

        DANGEROUSLY_DISABLE_HOST_CHECK: true,

        SESSION_SECRET: 'apple',
        JWT_SECRET: 'orange',

        // NOTE: only variables with the prefix REACT_APP_ will be visible to the frontend (for security purposes)
        REACT_APP_BACKEND_URI: 'localhost:'+BACKEND_PORT_DEV,
        REACT_APP_FRONTEND_URI: 'localhost:'+FRONTEND_PORT_DEV,
      },
    }
  ]
}
