Preamble
--------------

Main Concerns:
* API rate limiting (Flickr) - for simplicity we can use a simple, non-distributed generic rate limiter, such as [node-rate-limiter](https://github.com/jhurliman/node-rate-limiter) to rate-limit how often we request data from Flickr
  * This is also very likely the first major constraint we will run up against in scaling up.
  * Likewise, if we keep making requests to it our user will experience a slow system, because both individual requests take time, and all users will have to wait if we exhaust our limit.
  * So where possible, we minimise requests to it by caching.
  * For now, we don't serve the actual images ourselves, for our solution to scale we will need to either get acommercial account with Flickr that provides enough bandwidth, or cache and serve the images ourselves.
* API rate limiting (Requests to us) - we don't implement this here, but a public / B2C API where black-listing users in general needs this to deal with DDoS attacks and badly implemented clients / web crawlers. At scale, distributed approaches may be necessary.
* In general, integrating with an external data source means we have to deal with 1. additional data, 2. deleted data and 3. edited data.
  * Given the time constraint we cannot implement this, but a high level design would depend on what the business context of our service is, copyright and other regulatory needs.

Public API choice
-----------------
We are using the semi-public Flickr endpoit of [groups.groups.pool.getPhotos](https://www.flickr.com/services/api/flickr.groups.pools.getPhotos.html)

This iteration is limited to getting the photos from 1 hardcoded Flickr group, which can be changed at configuration time, I have tested using [Interior Design](https://www.flickr.com/groups/interior). It has 99k+ photos.


It requires an App token but no user-specific permissions, and can only access public data.

We are not using the fully public feed api endpoint since there's no documented way of getting more than ~50 photos from it, and I suspect it will have a low rate-limit.


Stack
--------------
### Frontend
- [React](https://reactjs.org) UI framework with [react-router-dom](https://npmjs.com/package/react-router-dom)
- [Bootstrap](https://getbootstrap.com) / [Reactstrap](https://reactstrap.github.io/) for UI components
- [ReactApollo](https://github.com/apollographql/react-apollo) for hooking up React and GraphQL

### Client-server communication
- [GraphQL](https://graphql.org). REST is likely equally suitable.

### Backend
- [Express](https://expressjs.com) web framework and router
- [knex](https://knexjs.org) SQL wrapper library for node
- [PostgreSQL](https://postgresql.org)


Backend Architecture
--------------

The basic concept is we cache the results (links only, not the actual images) into a PostgresSQL database in the backend, and give the frontend those results as they are requested.

The main end point of interest is
getPhotos(tagString: String, pageOffset:Int, pageSize: Int)

All arguments are optional
If a tagString is given, it will only return photos that have the tag

Basically, we use PostgresSQL as a cache for the underlying API (Flickr).

We will first see if we can satisfy the request from what we already have, and if this fails, we go to the Flickr API, store the result, then return them.

The tables of interest are flickr\_searches, photos, tags and photos\_tags.

When a request is made, we query flickr\_searches to if we have made the same search recently.

If we haven't, a call is made to the Flickr API to populate the SQL DB.

The tag search is done via running an inner join on photos\_tags to photos.
If we have enough, we simply return them via GraphQL.

If not, we fetch more data from flickr.


SQL vs. NoSQL
--------------
Given our workload is not very write-intensive, a traditional SQL DB is a reasonable choice, as it makes data consistenty checks automatic.

NoSQL should be considered when and if we track user activities.

Testing
--------------
We haven't implemented any tests due to time constraint.

My approach to testings would be:
* Headless browser based integration tests for basic regression checks that the web-app builds and is still operational.
* Endpoint level tests for the backend:
  * Basic tests that our own logic works, using Flickr's actual API
  * For example, if you search for the tag 'chair', all the returned photos should have chair as a tag in them
  * Sanity checks, for example the number of photos are >= what we know from Flickr's web site.
  * Will have to mock Flickr's API since we heavily rely on it

I can write some specific tests upon request.

Assumptions and Caveats
--------------

* Please note that the repo has been based on another actively developed app, which is in turn based on Create React App, so there are unneeded dependencies and dead code. In a real world all this would be meticulously cleaned up for security and performance.
* Likewise, quite a few of the dependencies are outdated.
* We don't have a security model whatsoever, given we are not tracking user behaviour in this iteration and all the underlying data is public.
* The ecosystem-config.js file is committed, in the real would we won't do that.
* In a real-world setup, even though all the data are public, we will still need to implement rate-limiting for both our users and how our own app talks to the 3rd party API.


Installation Instructions
----------------
See INSTALL.md, note that this is grossly simplified due to time constraint.


File Structure
--------------
- [client/](client/): client app
- [client/package.json](client/package.json): client package.json
- [server/](server/): server
- [package.json](package.json): server package.json
- [server/typedefs.graphql](server/typedefs.graphql): GraphQL Schema

