import gql from 'graphql-tag'

export const Query = gql`
  query getSinglePhotoQ($id: ID!) {
    getPhoto(id: $id) {
      id
      title
      url(size:b)
      flickrPhotoPageUrl
      tags{
        id
        name
      }
    }
  }
`
