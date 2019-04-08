import gql from 'graphql-tag'

export const Query = gql`
  query getPhotosQ {
    getPhotos(pageId: 1) {
      id
      title
      url(size:z)
    }
  }
`

