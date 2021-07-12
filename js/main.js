var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });
var jsonFiles, filesLength, fileKey = 0;

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');
var cityMeta = {};

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
});


var city = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://kiang.github.io/taiwan_basecode/city/city.topo.json',
    format: new ol.format.TopoJSON({
      featureProjection: appView.getProjection()
    })
  }),
  style: cityStyle,
  zIndex: 50
});

var map = new ol.Map({
  layers: [city],
  target: 'map',
  view: appView
});

map.addControl(sidebar);
var pointClicked = false;
map.on('singleclick', function (evt) {
  pointClicked = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (false === pointClicked) {
      firstPosDone = true;
      currentFeature = feature;
      if (lastFeature) {
        lastFeature.setStyle(cityStyle);
      }
      var p = feature.getProperties();
      var message = '';
      message += '<table class="table table-dark"><tbody>';
      message += '<tr><th scope="row">人口</th><td>' + dataPool[p.TOWNCODE].population + '</td></tr>';
      message += '<tr><th scope="row">平日夜間停留人數</th><td>' + dataPool[p.TOWNCODE].work_night + '</td></tr>';
      message += '<tr><th scope="row">平日上午活動人數</th><td>' + dataPool[p.TOWNCODE].work_day1 + '</td></tr>';
      message += '<tr><th scope="row">平日下午活動人數</th><td>' + dataPool[p.TOWNCODE].work_day2 + '</td></tr>';
      message += '<tr><th scope="row">平日日間活動人數</th><td>' + dataPool[p.TOWNCODE].work_day + '</td></tr>';
      message += '<tr><th scope="row">假日夜間停留人數</th><td>' + dataPool[p.TOWNCODE].weekend_night + '</td></tr>';
      message += '<tr><th scope="row">假日上午活動人數</th><td>' + dataPool[p.TOWNCODE].weekend_day1 + '</td></tr>';
      message += '<tr><th scope="row">假日下午活動人數</th><td>' + dataPool[p.TOWNCODE].weekend_day2 + '</td></tr>';
      message += '<tr><th scope="row">假日日間活動人數</th><td>' + dataPool[p.TOWNCODE].weekend_day + '</td></tr>';
      message += '</tbody></table>';
      sidebarTitle.innerHTML = p.COUNTYNAME + p.TOWNNAME;
      currentFeature.setStyle(cityStyle);

      lastFeature = currentFeature;
      content.innerHTML = message;
      sidebar.open('home');
      pointClicked = true;
    }
  });
});

var currentKey = 'work_night';
function cityStyle(f) {
  var p = f.getProperties();
  var color = '#ffffff';
  var strokeWidth = 1;
  var strokeColor = 'rgba(0,0,0,0.3)';
  if (f === currentFeature) {
    strokeColor = 'rgba(0,0,0,1)';
    strokeWidth = 2;
  }
  if (dataPool[p.TOWNCODE]) {
    if (dataPool[p.TOWNCODE].population > dataPool[p.TOWNCODE][currentKey]) {
      color = '#57ccdd';
    } else {
      color = '#cbdd57';
    }
  }
  var textColor = '#000000';

  var baseStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: strokeColor,
      width: strokeWidth
    }),
    fill: new ol.style.Fill({
      color: color
    }),
    text: new ol.style.Text({
      font: '14px "Open Sans", "Arial Unicode MS", "sans-serif"',
      fill: new ol.style.Fill({
        color: textColor
      })
    })
  });

  baseStyle.getText().setText(p.TOWNNAME);
  return baseStyle;
}

var currentFeature = false;
var lastFeature = false;

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function (error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var firstPosDone = false;
geolocation.on('change:position', function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
  if (false === firstPosDone) {
    appView.setCenter(coordinates);
    firstPosDone = true;
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

$('#btn-geolocation').click(function () {
  var coordinates = geolocation.getPosition();
  if (coordinates) {
    appView.setCenter(coordinates);
  } else {
    alert('目前使用的設備無法提供地理資訊');
  }
  return false;
});

var dataPool = {};
$.get('https://kiang.github.io/segis.moi.gov.tw/data/city/2020/11.json', {}, function (r) {
  dataPool = r;
  city.getSource().refresh();
});

$('a.btn-key').click(function(e) {
  e.preventDefault();
  currentKey = $(this).attr('data-key');
  $('a.btn-key').each(function(idx, el) {
    if(currentKey === $(el).attr('data-key')) {
      $(el).removeClass('btn-secondary').addClass('btn-primary');
    } else {
      $(el).removeClass('btn-primary').addClass('btn-secondary');
    }
  });
  city.getSource().refresh();
});