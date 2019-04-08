import {knex} from '../db'
import {camelcaseKeysArray, inspectObj, setTimeoutPromise,asyncWaitUntilFalse} from '../utils'
import Constants from '../constants'
import {isUndefined, isEmpty, isNull} from 'lodash'
import camelcaseKeys from 'camelcase-keys'
import {flickrAPI} from '../flickr-api.js'

import {upsertTags, recordFlickrSearchSQL} from '../db/queries'

const {flickrGroupId, fetchFromFlickrInterval} = Constants

const inFlightFlickrQueries = new Map()
const markFlickrQueryAsInFlight = searchQueryKey => inFlightFlickrQueries.set(searchQueryKey, true)
const markFlickrQueryAsNotInFlight = searchQueryKey => inFlightFlickrQueries.delete(searchQueryKey, true)
const isFlickrQueryInFlight = searchQueryKey => inFlightFlickrQueries.has(searchQueryKey)
/**
 * Asynchronously check if this query needs to reach Flickr, or have we fetched from it recently
 *
 * @arg tagStringNormalised {string} - null means we are not searching by a tag at all
 *
 * @returns {undefined}
 */
const shouldFetchQueryFromFlickr = async (tagStringNormalised) => {
  const qbNeedToFetch = knex('flickr_searches').first('*')
  if (!isNull(tagStringNormalised)) {
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
  return isUndefined(hasFetchedRecently)
}

/**
 * The main API entry point, implemented as a GraphQL resolver
 * Provides paginated photos, optionally requiring them to have the specified tag
 * @arg args.tagString
 * @arg args.pageOffset
 * @arg args.pageSize
 *
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

  const hasFlickrQueryInFlightPred = () => isFlickrQueryInFlight(searchQueryKey)

  /*
   * If we have to fetch it from Flickr's API, we do that first, which will then polulate the SQL DB
   * After this step, we return the result from the SQL DB
   */
  if (hasFlickrQueryInFlightPred()) {
    // there's a flickr query in flight for this query, wait for it to finish before proceeding, don't initiate another one
    console.log('query already in flight: ', searchQueryKey)
    await asyncWaitUntilFalse(hasFlickrQueryInFlightPred)
    console.log('query finished, continuing: ', searchQueryKey)
  }
  else{
    if ((await shouldFetchQueryFromFlickr(tagStringNormalised))) {
      //set the query as inFlight
      markFlickrQueryAsInFlight(searchQueryKey)
      // console.log('query marked as inFlight', tagStringNormalised)

      if (hasTagString) {
        //The search may have no result, so we need to upsert the tagId here
        //So we know not to make the call again
        await upsertTags([tagStringNormalised])
      }
      console.log('query tagStringNormalised upserted', tagStringNormalised)
      await recordFlickrSearchSQL({tagStringNormalised})
      console.log('search recorded in SQL', tagStringNormalised)

      await flickrAPI.init()
      await flickrAPI.fetchPhotosFromFlickrForGroup(tagStringNormalised)
      console.log('Flickr API request finished', tagStringNormalised)


      //finally, mark it as not in flight anymore
      markFlickrQueryAsNotInFlight(searchQueryKey)
      console.log('Marked as finished', tagStringNormalised)
    }
  }

  console.log('returning request from SQL: ', {tagStringNormalised, pageSize, pageOffset})

  /*
   * Return the result from SQL
    * */

  const qb = knex('photos')
    .select('photos.*')
    .where('flickr_group_id', flickrGroupId)

  if (hasTagString) {
    // Inner join with photos_tags to filter by the tag
    qb.innerJoin('photos_tags', 'photos_tags.photo_id', 'photos.id')
      .innerJoin('tags', 'tags.id', 'photos_tags.tag_id')
      .andWhere('tags.name', tagStringNormalised)
  }

  //Pagination
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
      //Construct the Flickr image link for (thisPhoto, size)
      //refer to https://www.flickr.com/services/api/misc.urls.html for full details
      const {farm: farmId, secret, server: serverId, id: photoId} = photo
      const size = isUndefined(args.size) ? 'z' : args.size

      return `https://farm${farmId}.staticflickr.com/${serverId}/${photoId}_${secret}_${size}.jpg`
    },
    flickrPhotoPageUrl: async (photo, args, context) => {
      //Construct the Flickr page link for this photo
      return `https://www.flickr.com/photos/${photo.ownerFlickrUserId}/${
        photo.id
      }`
    },
    tags: async (photo, __, context) => {
      //Get all its tags
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
