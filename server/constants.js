const constants = {
  apiKey: '8a90da45cdbb6d80d67ce4d8984d81c4',
  apiSecret: '8a90da45cdbb6d80d67ce4d8984d81c4',
  flickrGroupId: '22812088@N00',
  flickrGroupName: 'Interior Design',
  /* Photos above this number may not be stored for now
   * This number must be small enough to fit in a single Flickr call (~300 is ok)
   */
  maxPhotosInGallery: 200,
  //must be a valid Postgres interval
  fetchFromFlickrInterval: '30 minutes',
  nFlickrRequestsPerMinute: 30,
}

export default constants
