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
var download = require('tile-dl-client');
var ReactDOM = require('react-dom');
var PropTypes = require('prop-types');

exports.default = DownloadControl;

function DownloadControl(options) {
  if (!(this instanceof DownloadControl)) return new DownloadControl(options);
  this.options = options || {};
}

function getUrl(source) {
  if (source && source.tiles) {
    var url = source.tiles[0];
    return url.replace('{quadkey}', '{q}');
  }
  return false;
}

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

DownloadControl.prototype._getUrl = function () {
  var map = this._map;
  var sources = map.getStyle().sources;
  var selected = Object.keys(sources).reduce(function (acc, k) {
    if (map.isSourceLoaded(k)) acc.push(k);
    return acc;
  }, []);
  var selectedSource = sources[selected[0]];
  return getUrl(selectedSource);
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

  ReactDOM.render(React.createElement(DownloadOptionBox, {
    getUrl: this._getUrl.bind(this),
    IBBox: IBBox,
    minZoom: map.getZoom(),
    onChange: this._handleChangeOptions.bind(this) }), el);
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

    _this.state = {
      IBBox: _this.props.IBBox,
      maxZoom: _this.props.maxZoom,
      minZoom: _this.props.minZoom,
      downloading: false,
      progress: 0
    };
    return _this;
  }

  _createClass(DownloadOptionBox, [{
    key: '_onDownload',
    value: function _onDownload(data) {
      var url = this.props.getUrl();
      if (!url) return;

      this.setState({
        downloading: true,
        progress: 0
      });

      var self = this;

      function done(err, stream) {
        if (err) console.error(err);
        var filename = data.path || 'tiles.tar';
        var element = document.createElement('a');
        element.setAttribute('href', '/export/' + filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        var click = new window.MouseEvent('click');
        element.dispatchEvent(click);
        document.body.removeChild(element);
        self.setState({ downloading: false, progress: 0 });
      }

      function onprogress(progress) {
        if (!self.state.downloading) return;
        self.setState({ progress: progress });
      }

      download(url, data, done, onprogress);
      return false;
    }
  }, {
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
      this.props.onChange(this._getData(event));
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, {
    key: 'onDownloadClick',
    value: function onDownloadClick(event) {
      var data = this._getData(event);
      this._onDownload(data);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, {
    key: 'render',
    value: function render() {
      var IBBox = this.props.IBBox;
      var minZoom = Math.floor(this.props.minZoom || 0);
      var maxZoom = Math.floor(this.props.maxZoom || this.props.minZoom + 1);

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
            'button',
            { onClick: this.zoomClick.bind(this) },
            'Zoom to Coordinates'
          ),
          this.state.downloading ? React.createElement(
            'div',
            { className: 'progress' },
            Math.round(this.state.progress * 100),
            '% complete...'
          ) : React.createElement(
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
  getUrl: PropTypes.func.isRequired,
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
