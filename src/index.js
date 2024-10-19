import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

function getCategory(d) {
    return d == 1 ? 'Low（後発開発途上国相当）' :
           d == 2 ? 'Medium（開発途上国相当）' :
           d == 3 ? 'High（新興国相当）' :
           d == 4 ? 'Very High（先進国相当）' :
           '-(対象外)';
}

function getColor(d) {
    return d == 1 ? '#2b83ba' :
           d == 2 ? '#ddf1b4' :
           d == 3 ? '#f59053' :
           d == 4 ? '#d7191c' :
           '#fff';
}

const matchColor = ["match", ["get", "st_HDI_category"],1,getColor(1),2,getColor(2),3,getColor(3),4,getColor(4),getColor(0)];

const zone_type = [getCategory(1), getCategory(2), getCategory(3), getCategory(4)]
const zoning_legend = document.getElementById('zoning-legend')
for (let i = 0; i < zone_type.length; i++){
    zoning_legend.innerHTML += '<i style="background:' + getColor(i+1) + '"></i> ' + zone_type[i] + (zone_type[i+1] ? '<br>' : '<hr>');
}
zoning_legend.innerHTML += '<a href="https://hdr.undp.org/data-center/human-development-index" target="_blank">Source: Human Development Index 2022</a>';

const init_center = [139.93003, 35.72164];
const init_zoom = 2;
const init_bearing = 0;
const init_pitch = 0;

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
    center: init_center,
    interactive: true,
    zoom: init_zoom,
    bearing: init_bearing,
    pitch: init_pitch,
    attributionControl: false,
    renderWorldCopies: false
});

const attCntl = new maplibregl.AttributionControl({
    customAttribution:'<a href="https://github.com/sanskruthiya/GlobalChoropleth" target="_blank">GitHub</a>',
    compact: true
});
map.addControl(attCntl, 'bottom-right');

map.on('load', () => {
    map.setProjection({"type": "globe"});
    //map.panBy([0,10]);
    map.addSource('country-polygon', {
        'type': 'geojson',
        'data': './app/data/country250_HDI_polygon.geojson',
    });
    map.addSource('country-point', {
        'type': 'geojson',
        'data': './app/data/country250_HDI_point.geojson',
    });
    map.addLayer({
        'id': 'country_polygon',
        'source': 'country-polygon',
        'maxzoom':10,
        'type': 'fill',
        'layout': {
            'visibility': 'visible',
        },
        'paint': {
            'fill-color': ["to-color", matchColor],
            'fill-outline-color': '#fff',
            'fill-opacity': ["interpolate",["linear"],["zoom"],1,1,3,0.9,6,0.1]
        }
    });
    map.addLayer({
        'id': 'country_point',
        'type': 'symbol',
        'source': 'country-point',
        'filter': ['>', 'st_HDI_value', 0],
        "maxzoom": 10,
        'layout': {
            'icon-image': '',
            'text-field': ["format",['concat', ['get', 'st_Name_jp'],'(',['get', 'st_HDI_rank'],')'], { "font-scale": 1, 'text-color': '#111'}],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-font': ['Open Sans Semibold','Arial Unicode MS Bold'],
            'text-size': 11,
            'text-offset': [0, -0.5]
        },
        'paint': {'text-color': '#333','text-halo-color': '#fff','text-halo-width': 1}
    });
});

map.on('click', 'country_polygon', function (e) {
    if (map.queryRenderedFeatures(e.point, { layers: ['country_point'] })[0] == undefined){
        map.panTo(e.lngLat,{duration:1000});
        let popupContent = '';
        const feat = map.queryRenderedFeatures(e.point, { layers: ['country_polygon']})[0];
        popupContent = 
        '<h3>'+(feat.properties.st_Name_jp)+'</h3>'+
        '<table class="tablestyle02">'+
        '<tr><td>人間開発指標</td><td>'+(feat.properties.st_HDI_value > 0 ? Number(feat.properties.st_HDI_value).toLocaleString()+' ('+(feat.properties.st_HDI_rank) +'位)': '- (対象外)' ) + '</td></tr>'+
        '<tr><td>分類</td><td>'+ getCategory(feat.properties.st_HDI_category) + '</td></tr>'+
        '<tr><td>平均寿命</td><td>'+(feat.properties.st_平均寿命 > 0 ? (feat.properties.st_平均寿命).toFixed(2)+' 歳': '- (対象外)' ) + '</td></tr>'+
        '<tr><td>期待就学年数</td><td>'+(feat.properties.st_期待就学年数 > 0 ? (feat.properties.st_期待就学年数).toFixed(2)+' 年': '- (対象外)' ) + '</td></tr>'+
        '<tr><td>平均就学年数</td><td>'+(feat.properties.st_平均就学年数 > 0 ? (feat.properties.st_平均就学年数).toFixed(2)+' 年': '- (対象外)' ) + '</td></tr>'+
        '<tr><td>一人当たりGNI</td><td>'+(feat.properties.st_一人当たりGNI > 0 ? Math.round(feat.properties.st_一人当たりGNI).toLocaleString()+' $ (PPP 2017 intl$)': '- (対象外)' ) + '</td></tr>'+
        '</table>'+
        '<p class="remarks"><a href="https://www.google.com/search?q=国+'+(feat.properties.st_Name_jp)+'" target="_blank">この国についてGoogleで調べる</a></p>';

        new maplibregl.Popup({closeButton:true, focusAfterOpen:false, className:'t-popup', maxWidth:'360px', anchor:'bottom'})
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
    }
});

map.on('click', 'country_point', function (e) {
    map.panTo(e.lngLat,{duration:1000});
    let popupContent = '';
    const feat = map.queryRenderedFeatures(e.point, { layers: ['country_point']})[0];
    popupContent = 
    '<h3>'+(feat.properties.st_Name_jp)+'</h3>'+
    '<table class="tablestyle02">'+
    '<tr><td>人間開発指標</td><td>'+(feat.properties.st_HDI_value > 0 ? Number(feat.properties.st_HDI_value).toLocaleString()+' ('+(feat.properties.st_HDI_rank) +'位)': '- (対象外)' ) + '</td></tr>'+
    '<tr><td>分類</td><td>'+ getCategory(feat.properties.st_HDI_category) + '</td></tr>'+
    '<tr><td>平均寿命</td><td>'+(feat.properties.st_平均寿命 > 0 ? (feat.properties.st_平均寿命).toFixed(2)+' 歳': '- (対象外)' ) + '</td></tr>'+
    '<tr><td>期待就学年数</td><td>'+(feat.properties.st_期待就学年数 > 0 ? (feat.properties.st_期待就学年数).toFixed(2)+' 年': '- (対象外)' ) + '</td></tr>'+
    '<tr><td>平均就学年数</td><td>'+(feat.properties.st_平均就学年数 > 0 ? (feat.properties.st_平均就学年数).toFixed(2)+' 年': '- (対象外)' ) + '</td></tr>'+
    '<tr><td>一人当たりGNI</td><td>'+(feat.properties.st_一人当たりGNI > 0 ? Math.round(feat.properties.st_一人当たりGNI).toLocaleString()+' $ (PPP 2017 intl$)': '- (対象外)' ) + '</td></tr>'+
    '</table>'+
    '<p class="remarks"><a href="https://www.google.com/search?q=国+'+(feat.properties.st_Name_jp)+'" target="_blank">この国についてGoogleで調べる</a></p>';

    new maplibregl.Popup({closeButton:true, focusAfterOpen:false, className:'t-popup', maxWidth:'360px', anchor:'bottom'})
    .setLngLat(e.lngLat)
    .setHTML(popupContent)
    .addTo(map);
});
