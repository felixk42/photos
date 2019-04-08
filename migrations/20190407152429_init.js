
exports.up = function(knex, Promise) {
  return knex.raw(`
    CREATE TABLE tags (
      id serial primary key,
      name character varying(255) NOT NULL CONSTRAINT unique_name UNIQUE
    );

    CREATE TABLE flickr_users (
      id character varying(255) PRIMARY KEY,
      name  character varying(255)
    );

    CREATE TABLE flickr_groups (
      id character varying(255) PRIMARY KEY,
      name character varying(255)
    );

    CREATE TABLE photos (
      id bigint primary key,
      title text,
      owner_flickr_user_id character varying(255) NOT NULL REFERENCES flickr_users(id),
      secret character varying(255) not null,
      server integer not null,
      farm integer not null,
      flickr_group_id varchar(255) NOT NULL REFERENCES flickr_groups(id),
      fetched_at timestamp with time zone not null
    );

    CREATE TABLE photos_tags (
      photo_id bigint REFERENCES photos(id),
      tag_id bigint REFERENCES tags(id),
      CONSTRAINT photos_tags_pkey PRIMARY KEY (photo_id, tag_id)
    );

    CREATE TABLE flickr_searches (
      tag_id bigint REFERENCES tags(id),
      searched_at timestamp with time zone NOT NULL,
      CONSTRAINT flickr_searches_tag_id_unique UNIQUE (tag_id)
    );

  `)
};

exports.down = function(knex, Promise) {
  return knex.raw(`
    DROP TABLE flickr_searches;
    DROP TABLE photos_tags;
    DROP TABLE photos;
    DROP TABLE flickr_users;
    DROP TABLE flickr_groups;
    DROP TABLE tags;
  `)
};
