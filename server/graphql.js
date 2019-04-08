import {makeExecutableSchema} from 'graphql-tools'
import {merge} from 'lodash'
import requireText from 'require-text'
import {getPhoto, getPhotos, resolvers as photosResolvers} from './resolvers/photos'

const rootResolvers = {
  Query: {
    getPhotos,
    getPhoto
  },
}

const resolvers = merge(rootResolvers, photosResolvers)

export const rootTypeDefs = [requireText('./typedefs.graphql', require)]
const typeDefs = rootTypeDefs

export const graphqlSchema = makeExecutableSchema({typeDefs, resolvers})
