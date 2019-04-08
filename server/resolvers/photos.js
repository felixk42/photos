import {knex} from '../db'
import {camelcaseKeysArray, inspectObj, setTimeoutPromise,asyncWaitUntilFalse} from '../utils'
import Constants from '../constants'
import {isUndefined, isEmpty} from 'lodash'
import camelcaseKeys from 'camelcase-keys'
import {flickrAPI} from '../flickr-api.js'

import {upsertTags} from '../db/queries'

const {flickrGroupId} = Constants

const inFlightFlickrQueries = new Map()

/**
 * The main API entry point
 * Provides paginated photos, optionally requiring them to have the specified tag
 * @arg args.tagString
 * @arg args.pageOffset
 * @arg args.pageSize
 *
 * @returns {undefined}
 */
export const getPhotos = async (__, args, context) => {
  const pageOffset = isUndefined(args.pageOffset) ? 0 : args.pageOffset
  const pageSize = Math.max(20, args.pageSize ? args.pageSize : 0)
  const {tagString} = args
  const hasTagString = !isEmpty(tagString) && !isUndefined(tagString)
  const tagStringNormalised = hasTagString ? tagString.toLowerCase() : null

  /*
   * this uniquely identifies a request (to us),
   * so we know when the exact same request is already in flight to Flickr
  */
  const searchQueryKey = tagStringNormalised

  console.log('getPhotos: ')
  inspectObj({pageSize, tagStringNormalised, pageOffset})

  /*
   * If we have to fetch it from Flickr's API, we do that first, which will then polulate the SQL DB
   * Either way, we return the result from the SQL DB
   */
  if (inFlightFlickrQueries.has(searchQueryKey)) {
    // there's a flickr query in flight for this query, wait for it to finish and then return
    console.log('query already in flight: ', searchQueryKey)
    await asyncWaitUntilFalse(() => inFlightFlickrQueries.has(searchQueryKey))
  }
  else{
    const fetchFromFlickrInterval = '30 minutes'

    const qbNeedToFetch = knex('flickr_searches').first('*')
    if (hasTagString) {
      qbNeedToFetch
        .innerJoin('tags', 'tags.id', 'flickr_searches.tag_id')
        .where('tags.name', tagStringNormalised)
    } else {
      qbNeedToFetch.whereNull('flickr_searches.tag_id')
    }
    qbNeedToFetch.andWhereRaw(
      `flickr_searches.searched_at >= (now() - INTERVAL '${fetchFromFlickrInterval}')`,
    )

    const hasFetchedRecently = await qbNeedToFetch
    inspectObj({hasFetchedRecently})
    if (!hasFetchedRecently) {
      //set the query as inFlight
      inFlightFlickrQueries.set(searchQueryKey, true)
      if (hasTagString) {
        //The search may have no result, so we need to upsert the tagId
        await upsertTags([tagStringNormalised])
      }

      //wait
      // await setTimeoutPromise(5000)

      await flickrAPI.init()
      await flickrAPI.fetchPhotosFromFlickrForGroup()

      //record the search
      if (hasTagString) {
        await knex.raw(
          `
          insert into flickr_searches (tag_id, searched_at)
          select tags.id, now() as searched_at from tags
          where tags.name = :tag_name
          ON CONFLICT ON CONSTRAINT flickr_searches_tag_id_unique
            DO UPDATE SET (searched_at) = (now())
          ;`,
          {tag_name: tagStringNormalised},
        )
      } else {
        await knex('flickr_searches').insert({tag_id: null, searched_at: 'now()'})
      }

      //finally, mark it as not in flight anymore
      inFlightFlickrQueries.delete(searchQueryKey)
    }
  }

  const qb = knex('photos')
    .select('photos.*')
    .where('flickr_group_id', flickrGroupId)

  if (hasTagString) {
    qb.innerJoin('photos_tags', 'photos_tags.photo_id', 'photos.id')
      .innerJoin('tags', 'tags.id', 'photos_tags.tag_id')
      .andWhere('tags.name', tagStringNormalised)
  }

  qb.orderBy('fetched_at', 'desc').limit(pageSize).offset(pageOffset)

  const photos = camelcaseKeysArray(await qb)
  return {
    photos,
    hasMore: photos.length === pageSize,
    nextPageOffset: pageOffset + pageSize,
    pageSize,
  }
}

/**
 * Simple graphQL resolver to return the requested photo
 * @arg args.id - the photo's id
 *
 * @returns {undefined}
 */
export const getPhoto = async (__, {id}, context) => {
  const qb = knex('photos')
    .first('photos.*')
    .where('photos.id', id)
  return camelcaseKeys(await qb)
}

export const resolvers = {
  Photo: {
    url: (photo, args, context) => {
      //refer to https://www.flickr.com/services/api/misc.urls.html for full details
      const {farm: farmId, secret, server: serverId, id: photoId} = photo
      const size = isUndefined(args.size) ? 'z' : args.size

      return `https://farm${farmId}.staticflickr.com/${serverId}/${photoId}_${secret}_${size}.jpg`
    },
    flickrPhotoPageUrl: async (photo, args, context) => {
      return `https://www.flickr.com/photos/${photo.ownerFlickrUserId}/${
        photo.id
      }`
    },
    tags: async (photo, __, context) => {
      return camelcaseKeysArray(
        await knex('tags')
          .select('tags.*')
          .innerJoin('photos_tags', 'tags.id', 'photos_tags.tag_id')
          .where('photos_tags.photo_id', photo.id)
          .orderBy('tags.name', 'asc'),
      )
    },
  },
}
