import {inspectObj, promiseReduce} from './utils'
import {RateLimiter} from 'limiter'
import Flickr from 'flickrapi'
import {promisify} from 'util'
import {uniq, flatMap, pick, isUndefined, isNull, isEmpty} from 'lodash'
import {knex} from './db'
import Constants from './constants'
import {
  upsertFlickrGroup,
  upsertTags,
  upsertPhotosTags,
  upsertPhotos,upsertFlickrUsers
} from './db/queries'

import performanceNow from 'performance-now'

const {
  flickrGroupId: hardcodedFlickrGroupId,
  flickrGroupName: hardcodedFlickrGroupName,
  apiKey,
  apiSecret,
  maxPhotosInGallery,
  nFlickrRequestsPerMinute,
} = Constants

const flickrOptions = {
  api_key: apiKey,
  secret: apiSecret,
}

/**
 * we can only have 1 of this (due to rate limiting)
 * TODO: make this into a singleton or Borg
 */
class FlickrAPI {
  constructor() {
    this.initialised = false
    this.rateLimiter = new RateLimiter(nFlickrRequestsPerMinute, 'minute')
    this.flickrGroupId = hardcodedFlickrGroupId
    this.flickrGroupName = hardcodedFlickrGroupName
  }
  async init() {
    if (this.initialised) {
      return
    }
    this._flickrAPI = await promisify(Flickr.tokenOnly)(flickrOptions)
    this._getGroupPoolPhotosFromFlickr = promisify(
      this._flickrAPI.groups.pools.getPhotos,
    )
  }

  tagsOfPhotoFromFlickr(photo) {
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
  async fetchPhotosFromFlickrForGroup(tagName) {
    // make sure the group is in the DB first, by upserting it
    await upsertFlickrGroup({
      id: this.flickrGroupId,
      name: this.flickrGroupName,
    })

    //Wait for the rate limit (if we have hit it)
    console.log('Checking Flickr rate-limit...')
    await promisify(this.rateLimiter.removeTokens.bind(this.rateLimiter))(1)
    console.log('Checked Flickr rate-limit, proceeding')

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

      const t0 = performanceNow()
      retFromAPI = await this._getGroupPoolPhotosFromFlickr(params)
      const t1 = performanceNow()
      // console.log(`Flickr API took ${t1 - t0} ms`)
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
    const allTagNames = uniq(flatMap(photos, this.tagsOfPhotoFromFlickr))
    console.log(`inserting ${allTagNames.length} tags`)
    // inspectObj({allTags})
    //Insert all the tags, if they are not already there
    await upsertTags(allTagNames)
    console.log('inserted all tags')
    //same with flickr users
    const flickrUsers = uniq(
      photos.map(photo => ({id: photo.owner, name: photo.ownername})),
    )

    // inspectObj({flickrUsers})
    await upsertFlickrUsers(flickrUsers)
    console.log('upserted all flickrUsers')

    // inspectObj({photo0: photos[0]})
    await upsertPhotos(
      photos.map(photo =>
        Object.assign(
          pick(photo, ['id', 'secret', 'title', 'farm', 'server']),
          {
            flickr_group_id: this.flickrGroupId,
            owner_flickr_user_id: photo.owner,
            fetched_at: 'now()',
          },
        ),
      ),
    )
    console.log('upserted all photos')

    //finally the photos_tags table
    const tagsFromDB = await knex('tags')
      .select('id', 'name')
      .whereIn('name', allTagNames)
    const tagNameToIdName = new Map(tagsFromDB.map(tag => [tag.name, tag.id]))

    const photosTagsToUpsert = flatMap(photos, photo =>
      this.tagsOfPhotoFromFlickr(photo).map(tagName => ({
        tag_id: tagNameToIdName.get(tagName),
        photo_id: photo.id,
      })),
    )
    await upsertPhotosTags(photosTagsToUpsert)
    // inspectObj({photosTagsToUpsert})
    console.log('upserted all photosTags')
  }
}

export const flickrAPI = new FlickrAPI()
