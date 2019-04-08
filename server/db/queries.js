import {knex} from './index'

export async function upsertTags(tagNames) {
  const upsertedTags = await knex.raw(
    knex('tags')
    .insert(tagNames.map(tagName => ({name: tagName})))
    .toString() + ` ON CONFLICT ON CONSTRAINT unique_name DO NOTHING;`,
  )
}

export async function upsertFlickrGroup({id, name}){
  return await knex.raw(
      knex('flickr_groups')
      .insert({
        id,
        name,
      })
      .toString() + ` ON CONFLICT DO NOTHING;`,
    )

}
