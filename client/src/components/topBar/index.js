import React from 'react'
import autobind from 'autobind-decorator'
import {
  Container,
} from 'reactstrap'
import SearchByTagBox from '../searchByTagBox/'
import { withRouter } from "react-router";

export class TopBar extends React.Component{

  @autobind
  handleSearchByTag(tagValue){
    // console.log('searching for tagValue: ', tagValue)
    if(this.props.history.location !== '/home'){
      this.props.history.push('/home')
    }
    this.props.onSearchByTag(tagValue, this.props.apolloClient)
  }

  render(){
    return(
      <div className="topbar-wrapper fixed-top flex-align-vertical">
        <Container className="topbar ">
          <div className="logo">
            <a href="/home">
              <h1> Gallery </h1>
            </a>
          </div>
          <SearchByTagBox
            onSubmit={tagValue => this.handleSearchByTag(tagValue) }
          />
        </Container>
      </div>
    )

  }
}

// TopBar.propTypes = {
  
// }
//
export default withRouter(TopBar)
