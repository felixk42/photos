Preamble
--------------

Main Concerns:
* API rate limiting (Flickr)
  * This is very likely the first major constraint we will run up against in scaling up.
  * Likewise, if we keep making requests to it our user will experience a slow system, because both individual requests take time, and all users will have to wait if we exhaust our limit.
  * So where possible, we minimise requests to it by caching.
  * For now, we don't serve the actual images ourselves, for our solution to scale we will need to either get acommercial account with Flickr that provides enough bandwidth, or cache and serve the images ourselves.
  * For simplicity we can use a simple, non-distributed generic rate limiter, such as [node-rate-limiter](https://github.com/jhurliman/node-rate-limiter) to rate-limit how often we request data from Flickr
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

All arguments are optional, and it returns
{
  photos: [Photo]
  hasMore: Boolean
  nextPageOffset: Int
  pageSize: Int
}

If a tagString is given, it will only return photos that have the tag

Basically, we use PostgresSQL as a cache for the underlying API (Flickr).

We will first see if we can satisfy the request from what we already have, and if this fails, we go to the Flickr API, store the result, then return them.

The tables of interest are flickr\_searches, photos, tags and photos\_tags.

When a request is made, we query flickr\_searches to if we have made the same search recently.

If we haven't, a call is made to the Flickr API to populate the SQL DB first.

The internal tag search is done via running an inner join on photos\_tags to photos.

If not, we fetch more data from flickr.

To simplify things, we always fetch 200 photos from flickr for the searches for now.

The proper way to do this is we page through Flickr as more pages are requested from us by the frontend, not necessarily using a 1-1 page mapping. For example, a request of getPhotos(tagString: "cat", pageOffset: 10, pageSize: 100) may result in a Flickr call for "cat" if we have less than 10*100 photos with the tag "cat" in it, and either 1. there are more photos in the "cat" result, or 2. some time has passed since we last searched for "cat" from Flickr.

Another complication is that while a client A request for a query and trigger a async Flickr request, another client may make the same request. I have implemented an async waiting function using setImmediate() and promises, and using it to ensure that only 1 Flickr request is in flight for any query parameters at a time.

Frontend Architecture
--------------
The frontend is based on React, React Router, Apollo, GraphQL and [React Infinite Scroll](https://github.com/CassetteRocks/react-infinite-scroller).

We use the Infinite Scroll library component to get more pages of photos via the getPhotos EP from the backend.

A tagString can be specified using the search bar on the top of the page, which will refresh the query and thus the feed.

The individual photo pages simply contains the embedded image, the tags (in plaintext) and a link to its flickr page.


SQL vs. NoSQL
--------------
Given our workload is not very write-intensive, a traditional SQL DB is a reasonable choice, as it makes data consistenty checks automatic.

NoSQL should be considered when and if we track user activities.

Testing
--------------
I haven't implemented any tests due to time constraint.

My approach to testings would be:

* Using Mocha/Chai or jest, implement some or all of the following, focusing on integratio level tests first

* Endpoint level tests for the backend:
  * For basic regression & logic checks that the server builds and operational.
  * These tests will assume that our Flickr code is correct
  * We can fully script the SQL DB, and use a testing environment to fully isolate this.
  * We will hadcraft the photo entries, and use a parametrised versio of the FlickrAPI class to insert them into the SQL DB.
  * Case example: if you search for the tag 'chair' and it can be satisfied internally, all the returned photos should have 'chair' as a tag in them
  * Case example: within the paging limit, all the photos with the tag 'chair' should be so returned for a query asking for the tag 'chair'
  * Paging logic: use a synthetic feed of 5 pages of photos, checking that we do get all of them


* Flickr API integration test (E2E):
  * For example, if you search for the tag 'chair', all the returned photos should have chair as a tag in them
  * Sanity checks, for example the number of photos are >= what we know from Flickr's web site.

* Unit tests for selected parts:
  * Basic tests for inserting a single photo with no tag
  * Inserting a single photo with tags, checking that the photo and the tags are correctly inserted into the DB

* Headless browser based integration tests
  * Making sure that the entire app builds and runs, guarding against obvious regressions
* Snapshot testing for specific components

I can write some specific tests in any of these classes upon request.

Assumptions and Caveats
--------------

* Please note that the repo has been based on another actively developed app, which is in turn based on Create React App, so there are unneeded dependencies and dead code. In a real world all this would be meticulously cleaned up for security and performance.
* Likewise, quite a few of the dependencies are outdated.
* We don't have a security model whatsoever, given we are not tracking user behaviour in this iteration and all the underlying data is public.
* The ecosystem-config.js file is committed, in the real would we won't do that.
* In a real-world setup, even though all the data are public, we will still need to implement rate-limiting for both our users and how our own app talks to the 3rd party API.
* The feed is somewhat ephermeal, if a user comes back later they may get a different feed, and have to scroll down quite far to see the photos they used to. To solve this we need to serialise the scroll position to the URL on its change, and maintain a unique ordering of photos. For example based on (fetched\_from\_flickr\_time, posted\_to\_flickr\_time) to page.
* Because the backend doesn't pageinate our requests to Flickr yet, the infinite scrolling is faux.

Design Focus
--------------
- I think speed is a key feature for most B2C apps, and has proven to have a serious impact on conversion
- [Think With Google](https://www.thinkwithgoogle.com/marketing-resources/experience-design/mobile-page-speed-load-time/)
- Users can get used to ugly designs and counterintuitive controls to some extent, but there's nothing they can do to a slow app
- So if I have more time, I would:
1. Pre-warm the SQL cache with popular requests so the first queries are not cold calls, and then
2. Make the UX more intuitive and convenient on the front end, for example clicking on a tag can lead to searching for that tag.
3. Make the URL captures the scrolling position.


Installation Instructions
----------------
See INSTALL.md, note that this is grossly simplified due to time constraint, and are likely broken.


File Structure
--------------
- [client/](client/): client app
- [client/package.json](client/package.json): client package.json
- [server/](server/): server
- [package.json](package.json): server package.json
- [server/typedefs.graphql](server/typedefs.graphql): GraphQL Schema

