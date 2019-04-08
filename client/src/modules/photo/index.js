import Component from './component'
import { graphql, compose } from 'react-apollo'
import { Query } from './graphql'
import { withRouter } from 'react-router'

export default withRouter(
  compose(
    graphql(Query, {
      options: ({ photoId }) => ({ variables: { id: photoId } }),
    })
  )(Component)
)
