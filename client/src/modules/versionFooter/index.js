import React from 'react'

import moment from 'moment'
import {
  Alert,
} from 'reactstrap'

// Show git revision info, if available
export default class VersionFooter extends React.Component {
  render() {
    if (process.env.REACT_APP_GIT_REV === '') {
      // hidden
      return null
    }

    if (process.env.REACT_APP_GIT_REV === 'unknown') {
      // not available
      return (
        <Alert color='light' className='version-footer'>
          App version: <em>unknown</em>
        </Alert>
      )
    }

    return (
      <Alert color='light' className='version-footer'>
        Debugging Information:<br/>
        App version: <a href={process.env.REACT_APP_REPO_URL}>
          <tt>{process.env.REACT_APP_GIT_REV} {process.env.REACT_APP_GIT_MESSAGE}</tt>
        </a> at {moment(process.env.REACT_APP_GIT_DATE).format('lll')}

      </Alert>
    )
  }
}
