# mbgl-dl-ctrl

MapBox control for downloading the background tiles in the map you're currently viewing.

[See Example at http://tiles.okdistribute.xyz](http://tiles.okdistribute.xyz)

It's recommended to use Bing background tiles because Mapbox's terms of service
are more restrictive when it comes to downloading and using tiles offline.

Will download the tiles to a `tar` file, without hitting the server.

Only works in Google Chrome. 

## Usage

```js
var DownloadControl = require('mpgl-dl-ctrl')
var mapboxgl = require('mapbox-gl')

const bingSource = {
  type: 'raster',
  tiles: [
    'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
    'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
    'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
    'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1'
  ],
  minzoom: 1,
  maxzoom: 21,
  tileSize: 256
}

const bing = {
  id: 'bing',
  type: 'raster',
  source: 'bing',
  layout: {
    visibility: 'visible'
  },
  paint: {
  }
}

mapboxgl.accessToken = accessToken

var map = new mapboxgl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {'bing': bingSource},
    layers: [bing]
  }
})
map.on('style.load', function () {
  var underlays = [{
    name: 'Bing Satellite',
    ids: ['bing']
  }]
  var downloadControl = new DownloadControl()
  map.addControl(downloadControl, 'bottom-left')
})
```

## API

### `new DownloadControl(options)`

Options: 

  * `onDownload`: optional function that takes parameter `data`, which is the
    user-defined area to download: `minZoom`, `maxZoom`, `minLat`, `minLng`, `maxLat`, `maxLng`.

## License

MIT
