import {Query} from './graphql'
import Component from './component'
import { graphql, compose } from "react-apollo";
import {withRouter} from 'react-router-dom'

export default withRouter(Component)

// export default compose(
  // graphql(Query),
// )(Component)
