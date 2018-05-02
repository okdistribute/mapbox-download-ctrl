'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var form = require('get-form-data');
var download = require('./download');
var ReactDOM = require('react-dom');
var bytes = require('pretty-bytes');
var utils = require('@yaga/tile-utils');
var PropTypes = require('prop-types');

exports.default = DownloadControl;

function DownloadControl(options) {
  if (!(this instanceof DownloadControl)) return new DownloadControl(options);
  this.options = options || {};
}

function getUrl(source) {
  if (source.tiles) {
    var url = source.tiles[0];
    return url.replace('{quadkey}', '{q}');
  }
  return false;
}

DownloadControl.prototype._onDownload = function (data) {
  var map = this._map;
  var sources = map.getStyle().sources;
  var selected = Object.keys(sources).reduce(function (acc, k) {
    if (map.isSourceLoaded(k)) acc.push(k);
    return acc;
  }, []);
  var selectedSource = sources[selected[0]];
  var url = getUrl(selectedSource);
  download(url, data, function (stream) {
    // TODO: make download unclickable?
    stream.on('error', function (err) {
      throw err;
    });
    stream.on('end', function () {
      // TODO: make download clickable again.
    });
  });
  return false;
};

DownloadControl.prototype.onAdd = function (map) {
  this._map = map;
  this._map.on('moveend', this._update.bind(this));
  this._container = this._render();
  return this._container;
};

DownloadControl.prototype._update = function () {
  var parent = this._container.parentNode;
  var newContainer = this._render();
  parent.replaceChild(newContainer, this._container);
  this._container = newContainer;
};

DownloadControl.prototype._handleChangeOptions = function (data) {
  this._map.fitBounds([[data.minLng, data.minLat], [data.maxLng, data.maxLat]]);
};

DownloadControl.prototype._render = function () {
  var map = this._map;
  var el = document.createElement('div');
  el.className = 'mapboxgl-ctrl';
  var bounds = map.getBounds();
  var IBBox = {
    minLng: bounds._sw.lng,
    minLat: bounds._sw.lat,
    maxLng: bounds._ne.lng,
    maxLat: bounds._ne.lat
  };
  var onDownload = this.options.onDownload || this._onDownload.bind(this);

  ReactDOM.render(React.createElement(DownloadOptionBox, {
    IBBox: IBBox,
    minZoom: map.getZoom(),
    onChange: this._handleChangeOptions.bind(this),
    onDownload: onDownload }), el);
  return el;
};

DownloadControl.prototype.onRemove = function () {
  this._container = null;
};

var DownloadOptionBox = function (_React$Component) {
  _inherits(DownloadOptionBox, _React$Component);

  function DownloadOptionBox(props) {
    _classCallCheck(this, DownloadOptionBox);

    var _this = _possibleConstructorReturn(this, (DownloadOptionBox.__proto__ || Object.getPrototypeOf(DownloadOptionBox)).call(this, props));

    _this.state = _this.props;
    return _this;
  }

  _createClass(DownloadOptionBox, [{
    key: '_getData',
    value: function _getData(event) {
      var data = form.default(event.target.parentElement.parentElement);
      Object.keys(data).map(function (key) {
        data[key] = Number(data[key]);
      });
      if (data.minZoom > data.maxZoom) {
        var min = data.minZoom;
        data.minZoom = data.maxZoom;
        data.maxZoom = min;
      }
      return data;
    }
  }, {
    key: 'onChange',
    value: function onChange(event) {
      var data = this._getData(event);
      this.setState({
        IBBox: {
          minLat: data.minLat,
          maxLat: data.maxLat,
          maxLng: data.maxLng,
          minLng: data.minLng
        },
        minZoom: data.minZoom,
        maxZoom: data.maxZoom
      });
    }
  }, {
    key: 'zoomClick',
    value: function zoomClick(event) {
      this.state.onChange(this._getData(event));
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, {
    key: 'onDownloadClick',
    value: function onDownloadClick(event) {
      var data = this._getData(event);
      this.state.onDownload(data);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, {
    key: 'estimatedSize',
    value: function estimatedSize(IBBox, minZoom, maxZoom) {
      var count = 0;
      var bbox = IBBox;
      for (var z = minZoom; z <= maxZoom; z += 1) {
        var minX = utils.lng2x(bbox.minLng, z);
        var maxX = utils.lng2x(bbox.maxLng, z);
        var maxY = utils.lat2y(bbox.minLat, z);
        var minY = utils.lat2y(bbox.maxLat, z);
        for (var x = minX; x <= maxX; x += 1) {
          for (var y = minY; y <= maxY; y += 1) {
            count += 1;
          }
        }
      }
      return bytes(count * (6 * 1000));
    }
  }, {
    key: 'render',
    value: function render() {
      var IBBox = this.state.IBBox;
      var minZoom = Math.floor(this.state.minZoom || 0);
      var maxZoom = Math.floor(this.state.maxZoom || this.state.minZoom + 1);

      function onSubmit(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      return React.createElement(
        'form',
        { id: 'DownloadControl', onSubmit: onSubmit },
        React.createElement(
          'p',
          null,
          'Bounding Box'
        ),
        React.createElement(Input, { label: 'Min Long', name: 'minLng', defaultValue: IBBox.minLng }),
        React.createElement(Input, { label: 'Min Lat', name: 'minLat', defaultValue: IBBox.minLat }),
        React.createElement(Input, { label: 'Max Long', name: 'maxLng', defaultValue: IBBox.maxLng }),
        React.createElement(Input, { label: 'Max Lat', name: 'maxLat', defaultValue: IBBox.maxLat }),
        React.createElement(Input, { label: 'Min Zoom', name: 'minZoom', onChange: this.onChange.bind(this), defaultValue: minZoom }),
        React.createElement(Input, { label: 'Max Zoom', name: 'maxZoom', onChange: this.onChange.bind(this), defaultValue: maxZoom }),
        React.createElement(
          'div',
          null,
          React.createElement(
            'p',
            null,
            'Estimated Size: ',
            this.estimatedSize(IBBox, minZoom, maxZoom)
          ),
          React.createElement(
            'button',
            { onClick: this.zoomClick.bind(this) },
            'Zoom to Coordinates'
          ),
          React.createElement(
            'button',
            { onClick: this.onDownloadClick.bind(this), type: 'submit' },
            'Start Downloading'
          )
        )
      );
    }
  }]);

  return DownloadOptionBox;
}(React.Component);

DownloadOptionBox.propTypes = {
  onDownload: PropTypes.func.isRequired,
  IBBox: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  url: PropTypes.string
};

function Input(props) {
  return React.createElement(
    'div',
    null,
    props.label,
    ' ',
    React.createElement('input', { type: 'text', name: props.name, onChange: props.onChange, defaultValue: props.defaultValue })
  );
}
