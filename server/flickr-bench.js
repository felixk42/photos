import {flickrAPI} from './flickr-api.js'
import {knex} from './db'

const main = async () => {
  await flickrAPI.init()
  await flickrAPI.fetchPhotosFromFlickrForGroup('chair')

  await knex.destroy()
  console.log('exiting')
  process.exit(0)
}

main()
