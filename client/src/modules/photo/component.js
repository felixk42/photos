import React from 'react'
import Loading from '../../components/loading'
import {
  Container,
  Row,
  Col,
  Card,
  CardTitle,
  CardBody,
  CardText,
} from 'reactstrap'

export default class PhotoPage extends React.Component {
  render() {
    const {
      data: {loading, error, getPhoto: photo},
    } = this.props
    console.log('props: ', this.props)
    if (loading || error) {
      return <Loading loading={loading} error={error} />
    }
    return (
      <Container className="photo-container">
        <Row>
          <Col className="col-12 col-md-8">
            <img className="responsive-img" alt={photo.url} src={photo.url} />
          </Col>
          <Col className="col-12 col-md-4">
            <Card className="photo-info-card">
              <CardBody>
                <CardTitle>{photo.title}</CardTitle>
                <CardText>
                  <a href={photo.flickrPhotoPageUrl}> Flickr Page</a>
                  <h2> Tags </h2>
                  <Row>
                    {photo.tags.map(tag => (
                      <Col className="Aligner-flex-vertical photo-tag"> {tag.name} </Col>
                    ))}
                  </Row>
                </CardText>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }
}
