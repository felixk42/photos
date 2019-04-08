import {inspectObj, promiseReduce} from './utils'
import {RateLimiter} from 'limiter'
import Flickr from 'flickrapi'
import {promisify} from 'util'
import {uniq, flatMap, pick, isUndefined, isNull} from 'lodash'
import {knex} from './db'
import Constants from './constants'

const {
  flickrGroupId: hardcodedFlickrGroupId,
  flickrGroupName: hardcodedFlickrGroupName,
  apiKey, apiSecret,maxPhotosInGallery
} = Constants

const flickrOptions = {
  api_key: apiKey,
  secret: apiSecret,
}

/**
 * we can only have 1 of this, TODO: make this into a singleton or Borg
 */
class FlickrAPI {
  constructor(){
    this.initialised = false
    this.rateLimiter = new RateLimiter(100, 'minute')
    this.flickrGroupId = hardcodedFlickrGroupId
    this.flickrGroupName = hardcodedFlickrGroupName
  }
  async init(){
    if(this.initialised){
      return
    }
    this._flickrAPI = await promisify(Flickr.tokenOnly)(flickrOptions)
    this._getGroupPoolPhotosFromFlickr = promisify(this._flickrAPI.groups.pools.getPhotos)
  }

  tagsOfPhotoFromFlickr (photo) {
    if (!photo.tags) {
      return []
    }
    return photo.tags.split(' ')
  }

  /**
   * -- Note this isn't thread-safe, and multiple HTTP request can end up hitting the same code path
   * @arg tagName {string} - optional, search for those that has the tag if provided
   *
   */
  async fetchPhotosFromFlickrForGroup (tagName) {
    // make sure the group is in the DB first, by upserting it
    await knex.raw(
      knex('flickr_groups')
      .insert({
        id: this.flickrGroupId,
        name: this.flickrGroupName,
      })
      .toString() + ` ON CONFLICT DO NOTHING;`,
    )

    let retFromAPI
    try {
      const params = {
        group_id: this.flickrGroupId,
        page: 1,
        per_page: maxPhotosInGallery,
        extras: ['tags'],
      }
      if (!isUndefined(tagName) && !isNull(tagName)) {
        params.tags = [tagName]
      }
      retFromAPI = await this._getGroupPoolPhotosFromFlickr(params)
    } catch (error) {
      //bail
      console.error('getPublicPhotos threw an error:')
      console.error(error)
      throw error
    }

    // inspectObj({retFromAPI})
    const {
      photos: {photo: photos, page, pages, perpage, total},
    } = retFromAPI
    /*
     * the api gives us space separated tags
     * */
    const allTags = uniq(flatMap(photos, this.tagsOfPhotoFromFlickr))
    console.log(`inserting ${allTags.length} tags`)
    // inspectObj({allTags})
    //insert all the tags, if they are not already there
    const upsertedTags = await knex.raw(
      knex('tags')
      .insert(allTags.map(tag => ({name: tag})))
      .toString() + ` ON CONFLICT ON CONSTRAINT unique_name DO NOTHING;`,
    )
    console.log('inserted all tags')
    //same with flickr users
    const flickrUsers = uniq(
      photos.map(photo => ({id: photo.owner, name: photo.ownername})),
    )
    // inspectObj({flickrUsers})
    await knex.raw(
      knex('flickr_users')
      .insert(flickrUsers)
      .toString() + ` ON CONFLICT DO NOTHING;`,
    )

    console.log('upserted all flickr_users')

    // inspectObj({photo0: photos[0]})
    await knex.raw(
      knex('photos')
      .insert(
        photos.map(photo =>
          Object.assign(
            pick(photo, ['id', 'secret', 'title', 'farm', 'server']),
            {
              flickr_group_id: this.flickrGroupId,
              owner_flickr_user_id: photo.owner,
              fetched_at: 'now()'
            },
          ),
        ),
      )
      .toString() + ` ON CONFLICT DO NOTHING;`,
    )
    // console.log('upserted all photos')

    //finally the photos_tags table
    const tagsFromDB = await knex('tags')
      .select('id', 'name')
      .whereIn('name', allTags)
    const tagNameToIdName = new Map(tagsFromDB.map(tag => [tag.name, tag.id]))
    // inspectObj({tagsFromDB})
    await knex.raw(
      knex('photos_tags')
      .insert(
        flatMap(photos, photo =>
          this.tagsOfPhotoFromFlickr(photo).map(tagName => ({
            tag_id: tagNameToIdName.get(tagName),
            photo_id: photo.id,
          })),
        ),
      )
      .toString() + ` ON CONFLICT DO NOTHING;`,
    )

  }
}

export const flickrAPI = new FlickrAPI()

