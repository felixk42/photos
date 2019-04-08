import express from 'express'
import morgan from 'morgan'
import path from 'path'
import {graphqlExpress, graphiqlExpress} from 'apollo-server-express'
import bodyParser from 'body-parser'

import {graphqlSchema} from './graphql'

const VERBOSE = 1
const app = express()

const isDevDeployment = (process.env.NODE_ENV === 'development');


app.get('*.js', function (req, res, next) {
  req.url = req.url + '.gz'
  res.set('Content-Encoding', 'gzip')
  next()
})

if (VERBOSE >= 2) {
  // Setup logger
  app.use(
    morgan(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms',
    ),
  )
}

if (VERBOSE >= 3){
  app.use((req, res, next) => {
    console.log('req:')
    console.dir(req)
    next()
  })
}

app.use(
  '/api/graphql',
  bodyParser.json(),
  graphqlExpress(req => {
    //TODO: setup data loaders here
    // const loaders = initDataLoaders()
    return {
      schema: graphqlSchema,
      context: {},
      graphiql: isDevDeployment
    }
  }),
)

if (isDevDeployment) {
  app.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/api/graphql',
    }),
  )
}



// Serve static assets
app.use(express.static(path.resolve(__dirname, '../client', 'build')))

// Always return the main index.html, so react-router render the route in the client
app.get('*', (req, res) => {
  console.log('returning index.html')
  res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
})

module.exports = app
