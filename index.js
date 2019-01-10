var React = require('react')
var form = require('get-form-data')
var download = require('tile-dl-client')
var ReactDOM = require('react-dom')
var PropTypes = require('prop-types')

export default DownloadControl
function DownloadControl (options) {
  if (!(this instanceof DownloadControl)) return new DownloadControl(options)
  this.options = options || {}
}

function getUrl (source) {
  if (source.tiles) {
    var url = source.tiles[0]
    return url.replace('{quadkey}', '{q}')
  }
  return false
}

DownloadControl.prototype.onAdd = function (map) {
  this._map = map
  this._map.on('moveend', this._update.bind(this))
  this._container = this._render()
  return this._container
}

DownloadControl.prototype._update = function () {
  var parent = this._container.parentNode
  var newContainer = this._render()
  parent.replaceChild(newContainer, this._container)
  this._container = newContainer
}

DownloadControl.prototype._handleChangeOptions = function (data) {
  this._map.fitBounds([
    [data.minLng, data.minLat],
    [data.maxLng, data.maxLat]
  ])
}

DownloadControl.prototype._getUrl = function () {
  var map = this._map
  var sources = map.getStyle().sources
  var selected = Object.keys(sources).reduce((acc, k) => {
    if (map.isSourceLoaded(k)) acc.push(k)
    return acc
  }, [])
  var selectedSource = sources[selected[0]]
  var url = getUrl(selectedSource)
  return url
}

DownloadControl.prototype._render = function () {
  var map = this._map
  var el = document.createElement('div')
  el.className = 'mapboxgl-ctrl'
  var bounds = map.getBounds()
  var IBBox = {
    minLng: bounds._sw.lng,
    minLat: bounds._sw.lat,
    maxLng: bounds._ne.lng,
    maxLat: bounds._ne.lat
  }

  ReactDOM.render(<DownloadOptionBox
    getUrl={this._getUrl.bind(this)}
    IBBox={IBBox}
    minZoom={map.getZoom()}
    onChange={this._handleChangeOptions.bind(this)} />,
  el)
  return el
}

DownloadControl.prototype.onRemove = function () {
  this._container = null
}

class DownloadOptionBox extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      IBBox: this.props.IBBox,
      maxZoom: this.props.maxZoom,
      minZoom: this.props.minZoom,
      downloading: false,
      progress: 0
    }
  }

  _onDownload (data) {
    var self = this
    this.setState({
      downloading: true,
      progress: 0
    })

    function done (err, stream) {
      if (err) console.error(err)
      var filename = data.path || 'tiles.tar'
      var element = document.createElement('a')
      element.setAttribute('href', `/export/${filename}`)
      element.style.display = 'none'
      document.body.appendChild(element)
      let click = new window.MouseEvent('click')
      element.dispatchEvent(click)
      document.body.removeChild(element)
      self.setState({ downloading: false, progress: 0 })
    }

    function onprogress (progress) {
      if (!self.state.downloading) return
      self.setState({ progress })
    }

    var url = this.props.getUrl()
    download(url, data, done, onprogress)
    return false
  }

  _getData (event) {
    var data = form.default(event.target.parentElement.parentElement)
    Object.keys(data).map(function (key) {
      data[key] = Number(data[key])
    })
    if (data.minZoom > data.maxZoom) {
      var min = data.minZoom
      data.minZoom = data.maxZoom
      data.maxZoom = min
    }
    return data
  }

  onChange (event) {
    var data = this._getData(event)
    this.setState({
      IBBox: {
        minLat: data.minLat,
        maxLat: data.maxLat,
        maxLng: data.maxLng,
        minLng: data.minLng
      },
      minZoom: data.minZoom,
      maxZoom: data.maxZoom
    })
  }

  zoomClick (event) {
    this.props.onChange(this._getData(event))
    event.preventDefault()
    event.stopPropagation()
    return false
  }

  onDownloadClick (event) {
    var data = this._getData(event)
    this._onDownload(data)
    event.preventDefault()
    event.stopPropagation()
    return false
  }

  render () {
    var IBBox = this.props.IBBox
    var minZoom = Math.floor(this.props.minZoom || 0)
    var maxZoom = Math.floor(this.props.maxZoom || this.props.minZoom + 1)

    function onSubmit (event) {
      event.preventDefault()
      event.stopPropagation()
      return false
    }

    return (
      <form id='DownloadControl' onSubmit={onSubmit}>
        <p>Bounding Box</p>
        <Input label='Min Long' name='minLng' defaultValue={IBBox.minLng} />
        <Input label='Min Lat' name='minLat' defaultValue={IBBox.minLat} />
        <Input label='Max Long' name='maxLng' defaultValue={IBBox.maxLng} />
        <Input label='Max Lat' name='maxLat' defaultValue={IBBox.maxLat} />
        <Input label='Min Zoom' name='minZoom' onChange={this.onChange.bind(this)} defaultValue={minZoom} />
        <Input label='Max Zoom' name='maxZoom' onChange={this.onChange.bind(this)} defaultValue={maxZoom} />
        <div>
          <button onClick={this.zoomClick.bind(this)}>Zoom to Coordinates</button>
          {this.state.downloading
            ? <div className='progress'>{this.state.progress}</div>
            : <button onClick={this.onDownloadClick.bind(this)} type='submit'>Start Downloading</button>
          }
        </div>
      </form>
    )
  }
}

DownloadOptionBox.propTypes = {
  getUrl: PropTypes.func.isRequired,
  IBBox: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  url: PropTypes.string
}

function Input (props) {
  return (
    <div>
      {props.label} <input type='text' name={props.name} onChange={props.onChange} defaultValue={props.defaultValue} />
    </div>
  )
}
