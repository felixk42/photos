import {ApolloClient} from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';

import { createHttpLink } from "apollo-link-http";


const graphqlEP = '/api/graphql'

const httpLink = createHttpLink({
  uri: graphqlEP,
  credentials: 'same-origin'
})

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    }
  }
})


export default function context () {
  return {
    apolloClient: client,
  }
}
