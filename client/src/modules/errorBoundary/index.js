import React from 'react'

import {BrowserRouter as Router, Route} from 'react-router-dom'
import moment from 'moment'

import {
  Alert,
  Button,
  Container,
  Progress
} from 'reactstrap'
import axios from 'axios'


const isProduction = process.env.NODE_ENV === 'production'

// Last-resort handler for app exceptions.
// See https://reactjs.org/blog/2017/07/26/error-handling-in-react-16.html
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  componentDidCatch(error, info) {
    if (!isProduction){
      this.setState({
        hasError: true,
        error
      })
      return
    }
    this.setState({
      hasError: true,
      postError: 'inFlight',
    });

    // log error on server
    return axios({
      method: 'post',
      url: '/api/client-error-postback',
      maxRedirects: 2,
      data: {
        message: error.message,
        stack: error.stack,
        url: window.location.href,
      },
    })
      .then(res => {
        this.setState({
          postError: 'done',
        })
      })
      .catch(error => {
        console.log('axios error: ')
        console.log(error)
        this.setState({
          postError: 'error',
        })
      })
  }

  renderError() {
    if (!isProduction){
      const {error} = this.state
      console.log('error: ', error)
      return (
        <Container>
          <h2>
            Error
          </h2>
          <Alert color='danger'>
            {error.message}
          </Alert>
          <Alert color='info'>
          {error.stack}
          </Alert>
        </Container>
      )
    }  return (
      <Container>
        <Alert color='danger'>
          <h1 className='alert-heading'>Sorry, something went wrong.</h1>
          <hr />
          <p>
            This app has run into a problem. We are jotting down the details
            and will try to fix it soon.
          </p>
          <div style={{maxWidth: '20em'}}>
            {
              this.state.postError === 'inFlight'?
                  <Progress value={100} animated>Sending details...</Progress>
                : this.state.postError === 'done'?
                  <Progress value={100} color='success'>Sent details.</Progress>
                : <Progress value={100} striped color='danger'>Failed to send details!</Progress>
            }
          </div>
          <Button color='primary' onClick={() => window.location.reload(true)}>
            Reload app
          </Button>
        </Alert>
      </Container>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderError();
    } else {
      return this.props.children;
    }
  }
}
