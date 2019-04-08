import {knex} from './index'
import {isNull, isEmpty} from 'lodash'

const insertMultipleIntoTableOnConflictDoNothing = async (objs, tableName) => {
  if (isEmpty(objs)) {
    return
  }
  await knex.raw(
    knex(tableName)
      .insert(objs)
      .toString() + ` ON CONFLICT DO NOTHING;`,
  )
}

export async function upsertFlickrUsers(flickrUsers) {
  await insertMultipleIntoTableOnConflictDoNothing(flickrUsers, 'flickr_users')
}

export async function upsertPhotos(photos) {
  await insertMultipleIntoTableOnConflictDoNothing(photos, 'photos')
}

export async function upsertTags(tagNames) {
  if (isEmpty(tagNames)) {
    return
  }
  const upsertedTags = await knex.raw(
    knex('tags')
      .insert(tagNames.map(tagName => ({name: tagName})))
      .toString() + ` ON CONFLICT ON CONSTRAINT unique_name DO NOTHING;`,
  )
}

export async function upsertPhotosTags(photosTags) {
  if (isEmpty(photosTags)) {
    return
  }
  await knex.raw(
    knex('photos_tags')
      .insert(photosTags)
      .toString() + ` ON CONFLICT DO NOTHING;`,
  )
}

export async function upsertFlickrGroup({id, name}) {
  return await knex.raw(
    knex('flickr_groups')
      .insert({
        id,
        name,
      })
      .toString() + ` ON CONFLICT DO NOTHING;`,
  )
}

export async function recordFlickrSearchSQL({tagStringNormalised}) {
  //record the search
  if (!isNull(tagStringNormalised)) {
    await knex.raw(
      `
          insert into flickr_searches (tag_id, searched_at)
          select tags.id, now() as searched_at from tags
          WHERE tags.name = :tag_name
          ON CONFLICT ON CONSTRAINT flickr_searches_tag_id_unique
            DO UPDATE SET (searched_at) = (excluded.searched_at)
          ;`,
      {tag_name: tagStringNormalised},
    )
  } else {
    await knex('flickr_searches').insert({tag_id: null, searched_at: 'now()'})
  }
}
