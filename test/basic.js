import performanceNow from 'performance-now'
import {inspectObj} from '../server/utils'
import gql from 'graphql-tag'
const {createApolloFetch} = require('apollo-fetch')

const fetch = createApolloFetch({
  uri: 'http://localhost:7000/api/graphql',
})

const t0 = performanceNow()
// You can also easily pass variables for dynamic arguments
fetch({
  query: `
query getPhotos {
  getPhotos {
    photos{
      id
      title
      url(size: n)
    }
  }
}

  `,
  variables: {},
}).then(res => {
  const t1 = performanceNow()

  inspectObj(res)

  console.log(`took ${t1 - t0} ms`)
})
