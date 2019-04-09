
Setup
--------------

1. Install [Node.js](https://nodejs.org/en/)

2. Follow this guide to [use npm without using sudo](https://github.com/sindresorhus/guides/blob/master/npm-global-without-sudo.md)

3. Install [n](https://github.com/tj/n) and activate 8.11
  Then
  ```
  sudo n lts
  n 8.11
  ```

4. Install [yarn](https://yarnpkg.com)

5. For Mac:
  * Install [postgres.app](https://postgresapp.com)
  * Install [Postico](https://eggerapps.at/postico/) client (the free trial version should cut it)

5. For Debian/Ubuntu:
  * Install [postgresql](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-16-04)
  * Install your favourite Postgres client (e.g. `postgresql-client`)

cd into the checked out directory

Install tools
-------------
```
npm i -g knex@0.15.2 @babel/cli @babel/node
```
Install dependencies for server and client
--------------
```
yarn && pushd client && (yarn; popd)
```


Set up  the database
--------------
Firstly, you need a postgres user named photos\_app with the ability to login with password

To enable md5 (password) authentication for the user, firstly locate the configuration files by running (in psql)

```
SHOW config_file;
```

Then edit pg\_hba.conf in the directory config\_file and find the entry for "local", and set METHOD to either "md5" (for password authentication), or "trust" for your local instance, or an instance that DOES NOT expose that port to the outside world.

Restart postgres:
```
sudo /etc/init.d/postgresql restart
```

Then in psql:
```
create role photos_app with createdb;
alter role photos_app with login;
alter role photos_app with password 'password';
```

Then you can run the migration(s) by running

```
createdb -U photos_app photos_app;
yarn migrateToLatest
```

Start the server and the client with
---------------
```
yarn start
```
You should then be able to access the client at localhost:3000 (or whatever ecosystem.config.js specifies)

File Structure
--------------
- [client/](client/): client app
- [client/package.json](client/package.json): client package.json
- [server/](server/): server
- [package.json](package.json): server package.json

Environmental Variables
--------------
Running this script loads an environment, which is mostly just a set of environmental variables, from ecosystem.config.js

```
eval $(./scripts/ecosystem-env.js <env name>)
```

Where env name is one of 'local', for your own machine, or 'prod' for production


Migrations
--------------
to make a new migration, run

```
knex migrate:make <name>
```

where name should be somehow descriptive.

Deployment
-------------
To deploy to prod, simply run ./scripts/update-staging
Note that this also runs all the new migrations on the DB

