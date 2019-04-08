import React from 'react'
import autobind from 'autobind-decorator'
import Loading from '../../components/loading'
import TopBar from '../../components/topBar'
import PhotoPage from '../../modules/photo'
import gql from 'graphql-tag'
import {ApolloConsumer} from 'react-apollo'
import InfiniteScroll from 'react-infinite-scroller'
import {BrowserRouter, Route} from 'react-router-dom'
import util from 'util'

import {
  Alert,
  Row,
  Col,
  Container,
  CardImg,
  Card,
  CardBody,
  CardTitle,
} from 'reactstrap'
import './style.scss'
export const setTimeoutPromise = util.promisify(setTimeout)

const PhotoCard = ({photo}) => {
  // console.log('photo:')
  // console.dir(photo)
  return (
    <Card className="photo-card">
      <a href={`/home/photo/${photo.id}`} className="a-entire-card" />
      <CardImg top width="100%" src={photo.url} />
      <CardBody>
        <CardTitle>{photo.title}</CardTitle>
      </CardBody>
    </Card>
  )
}

const getPhotosQuery = gql`
  query getPhotosQ($tagString: String, $pageSize: Int, $pageOffset: Int) {
    getPhotos(
      tagString: $tagString
      pageSize: $pageSize
      pageOffset: $pageOffset
    ) {
      photos {
        id
        title
        url(size: n)
      }
      hasMore
      nextPageOffset
      pageSize
    }
  }
`

const initialPageSize = 10

class Home extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasMorePhotos: true,
      photos: [],
      pageOffset: 0,
      pageSize: initialPageSize,
      tagValue: '',
    }
  }

  @autobind
  handleToggleClientView(e) {
    const checked = e.target.checked
    console.log('handleToggleClientView checked: ', checked)
    this.setState({checkedClientView: checked})
  }

  async loadPhotos(client) {
    console.log('loading photos')
    console.dir({
      pageOffset: this.state.pageOffset,
      pageSize: this.state.pageSize,
    })
    const variables = {
      pageOffset: this.state.pageOffset,
      pageSize: this.state.pageSize,
    }
    if (this.state.tagValue !== '') {
      variables.tagString = this.state.tagValue
    }

    const {data} = await client.query({
      query: getPhotosQuery,
      variables,
    })
    console.log(`got photos pageOffset: ${this.state.pageOffset}`)
    console.dir({data})
    const {
      getPhotos: {photos: newPhotos, hasMore, nextPageOffset, pageSize},
    } = data
    this.setState((s, props) => {
      const photos = s.photos
      //merge the new photos into photos
      /*
      This may be inefficient.
      We can instead use https://github.com/kolodny/immutability-helper,
      and implement an efficient shouldComponentUpdate()
      */
      Array.prototype.push.apply(photos, newPhotos)
      return {
        photos: photos,
        pageOffset: nextPageOffset,
        hasMorePhotos: hasMore,
        pageSize,
      }
    })
  }

  @autobind
  handleSearchByTag(tagValue, client) {
    //reset the feed (even if it's just an empty enter)
    //InfiniteScroll will make the call
    this.setState({
      tagValue,
      photos: [],
      pageOffset: 0,
      pageSize: initialPageSize,
      hasMorePhotos: true,
    })
  }

  render() {
    return (
      <ApolloConsumer>
        {client => {
          return (
            <BrowserRouter>
              <div>
                <TopBar
                  apolloClient={client}
                  onSearchByTag={this.handleSearchByTag}
                />
                <Route
                  exact
                  path="/home"
                  render={() => (
                    <Container
                      style={{overflow: 'auto'}}
                      key={this.state.tagValue}>
                      <InfiniteScroll
                        pageStart={0}
                        loadMore={() => this.loadPhotos(client)}
                        hasMore={this.state.hasMorePhotos}
                        loader={<Loading loading={true} key={0} />}
                        // loader={<div className="loader" key={0}>Loading ...</div>}
                        useWindow={true}
                        id={this.state.tagValue}
                        initialLoad={true}
                      >
                        <div className='Aligner-vertical-flex no-photos-alert'>
                          {this.state.photos.length === 0 && !this.state.hasMorePhotos &&
                              (<Alert color='warning'> No Photos Matching This Tag </Alert>)
                          }
                        </div>
                        <Row>
                          {this.state.photos.map(photo => (
                            <Col
                              className="col-12 col-md-6 col-xl-4"
                              key={'col-' + photo.id}>
                              <PhotoCard photo={photo} key={'photo-card-' + photo.id} />
                            </Col>
                          ))}
                        </Row>
                      </InfiniteScroll>
                    </Container>
                  )}
                />
                <Route
                  path="/home/photo/:photoId"
                  render={({match}) => (
                    <PhotoPage photoId={match.params.photoId} />
                  )}
                />
              </div>
            </BrowserRouter>
          )
        }}
      </ApolloConsumer>
    )
  }
}

export default Home
