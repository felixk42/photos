import assert from "assert"
import util from 'util'
import {isArray} from 'lodash'
import camelcaseKeys from "camelcase-keys"
var parseError = require("parse-error")

export const MS_IN_A_SECOND = 1000
export const SECONDS_IN_A_MINUTE = 60

/**
 * Apply an async function (that returns a promise) sequentially to a list of items
 * @arg {object[]} entries = item to work on
 * @arg {function} func
 * @arg {number} nItemsInParallel - run up to this many instances of func at a time
 *
 * @returns {Promise}
 */
export const promiseReduce = (entries, func, {nItemsInParallel = 1, consoleLogEveryNItems, itemName='item'}={}) => {
  let entriesCloned = entries.slice()
  const getNextItem = () => {
    if (entriesCloned.length) {
      if(consoleLogEveryNItems && (entriesCloned.length % consoleLogEveryNItems) ){
        console.log(`${entriesCloned.length} ${itemName}s to go`)
      }
      return func(entriesCloned.shift())
    }
  }

  function startChain() {
    return Promise.resolve().then(function next() {
      const nextItem = getNextItem()
      if (nextItem) {
        return nextItem.then(next)
      }
    })
  }

  if (!isArray(entries)) {
    console.dir({ entries })
  }

  assert(isArray(entries))

  const chains = []
  for (let k = 0; k < nItemsInParallel; k += 1) {
    chains.push(startChain())
  }
  return Promise.all(chains)
}

export const inspectObj = obj => {
  console.log(util.inspect(obj, false, null))
}


/**
 * apply camelcaseKeys to every element of the array
 * @arg {object[]}
 *
 * @returns {object[]}
 */
export const camelcaseKeysArray = array => {
  if(!isArray(array)){
    // inspectObj({array})
    throw Error('wrong arg to camelcaseKeysArray')
  }
  return array.map(camelcaseKeys)
}

export const setTimeoutPromise = util.promisify(setTimeout);

/**
 * Used for concurrency control.
 * Node uses an event loop, so we don't need atomic compare-and-swap.
 * Main concurrency this is used to guard is this sequence of events:
 *
 * 1. Client requests getPhotos(tagString: "desk") - request A
 * 2. As part of request A, we go to Flickr to get the data
 * 3. Client (same or different) requests getPhotos(tagString: "desk") again
 * 4. We shouldn't make another one to Fllickr.
 *
 * @arg predFunc {function} - a function that takes no argument
 *
 * @returns {Promise} - resolves when predFunc evals to true
 */
export const asyncWaitUntilTrue = predFunc => {
  const promise = new Promise((resolve, reject) => {
    const checkAndResolveIfPredTrue = () => {
      if (predFunc()) {
        console.log('resolving')
        resolve()
      }
      else{
        console.log('waiting...')
        setImmediate(checkAndResolveIfPredTrue)
      }
    }
    setImmediate(checkAndResolveIfPredTrue)
  })
  return promise
}

export const asyncWaitUntilFalse = predFunc => asyncWaitUntilTrue(() => !predFunc())
