import React from 'react'
import ReactDOM from 'react-dom'
import './app.scss'
// import registerServiceWorker from './registerServiceWorker'
import Home from './modules/home'
import { ApolloProvider} from 'react-apollo';
import autobind from 'autobind-decorator'

import context from './context'
import {BrowserRouter as Router, Route, Redirect} from 'react-router-dom'
import ErrorBoundary from './modules/errorBoundary'
import VersionFooter from './modules/versionFooter'

const {apolloClient} = context()

class RootComponent extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      isLoggedIn: false
    }
  }
  @autobind
  handleLoggedIn(){
    this.setState({isLoggedIn: true})
  }

  render(){
    return (
      <ApolloProvider client={apolloClient}>
        <Router>
          <div className='root-div'>
            <ErrorBoundary>
              <Route
                exact path="/"
                render={() => (<Redirect to='/home'/>)}
              />
              <Route path="/home" component={Home}/>
            </ErrorBoundary>
            <VersionFooter />
          </div>
        </Router>
      </ApolloProvider>
      )
    }
  }


ReactDOM.render(
  <RootComponent/>,
  document.getElementById('root'),
)

//registerServiceWorker()
