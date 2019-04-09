import performanceNow from 'performance-now'
import {inspectObj} from '../server/utils'
import gql from 'graphql-tag'
var assert = require('assert');
suite('Array', function() {
  setup(function() {
    // ...
  });

  suite('#indexOf()', function() {
    test('should return -1 when not present', function() {
      assert.equal(-1, [1, 2, 3].indexOf(4));
    });
  });
});

// const {createApolloFetch} = require('apollo-fetch')

// const fetch = createApolloFetch({
  // uri: 'http://localhost:7000/api/graphql',
// })

// const t0 = performanceNow()
// // You can also easily pass variables for dynamic arguments
// fetch({
  // query: `
// query getPhotos {
  // getPhotos {
    // photos{
      // id
      // title
      // url(size: n)
    // }
  // }
// }

  // `,
  // variables: {},
// }).then(res => {
  // const t1 = performanceNow()

  // inspectObj(res)

  // console.log(`took ${t1 - t0} ms`)
// })
