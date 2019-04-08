var child_process = require('child_process')
function getGitInfo(format) {
    return child_process.execFileSync(
      'git', ['log', '-n1', '--format=format:' + format],
      {
        cwd: __dirname,
        input: '',
        timeout: 5000,
      }
    )
    .toString();
  }
var gitInfo
try {
  var output = getGitInfo('%h;%cI;%s').split(';')
  var rev = output[0]
  var date = output[1]
  output.splice(0, 2)
  var message = output.join(';')
  if (message.length > 80) {
    message = message.substr(0, 75) + '...'
  }
  gitInfo = {
    REACT_APP_GIT_REV: rev,
    REACT_APP_GIT_DATE: date,
    REACT_APP_GIT_MESSAGE: message,
    REACT_APP_REPO_URL: 'https://gitlab.com/dotd/dboard/commit/' + rev,
  }
} catch(err) {
  console.error('failed to retrieve git info:', err)
  gitInfo = {
    REACT_APP_GIT_REV: 'unknown',
  }
}

var script = './server/index.js'

var log_date_format= 'YYYY-MM-DD HH:mm:ss.SSS Z'

var REACT_APP_GIT_REV= gitInfo.REACT_APP_GIT_REV
var REACT_APP_GIT_DATE= gitInfo.REACT_APP_GIT_DATE
var REACT_APP_GIT_MESSAGE= gitInfo.REACT_APP_GIT_MESSAGE
var REACT_APP_REPO_URL= gitInfo.REACT_APP_REPO_URL

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

var stagingPostgres= {
  POSTGRES_HOST: 'localhost',
  POSTGRES_USER: 'photos_app',
  POSTGRES_PASSWORD: 'apple',
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
        REACT_APP_GIT_REV,
        REACT_APP_GIT_DATE,
        REACT_APP_GIT_MESSAGE,
        REACT_APP_REPO_URL,
        REACT_APP_FEATURES: JSON.stringify({
          breakdowns: true,
          clientView: true
        })

      },
    },
  ]
}
