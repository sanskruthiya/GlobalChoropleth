import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

//指標値に基づく色分け設定
const categoryMap = {
    1: 'Low（後発開発途上国相当）',
    2: 'Medium（開発途上国相当）',
    3: 'High（新興国相当）',
    4: 'Very High（先進国相当）'
};

const colorMap = {
    1: '#2b83ba',
    2: '#ddf1b4',
    3: '#f59053',
    4: '#d7191c',
    0: '#fff'
};

function getCategory(d) {
    return categoryMap[d] || '-(対象外)';
}

function getColor(d) {
    return colorMap[d] || '#fff';
}

//凡例生成
const zoning_legend = document.getElementById('zoning-legend'); //HTMLファイルのdiv要素id="zoning-legend"に対応
const matchColor = ["match", ["get", "st_HDI_category"], 1, getColor(1), 2, getColor(2), 3, getColor(3), 4, getColor(4), getColor(0)];
Object.entries(categoryMap).forEach(([key, value]) => {
    zoning_legend.innerHTML += `<i style="background:${getColor(Number(key))}"></i> ${value}<br>`;
});
zoning_legend.innerHTML += '<a href="https://hdr.undp.org/data-center/human-development-index" target="_blank">Source: Human Development Index 2022</a>';

//マップの初期表示設定
const init_center = [139.93003, 35.72164];
const init_zoom = 2;
const init_bearing = 0;
const init_pitch = 0;

//マップの基本設定
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

//帰属情報の設定
const attCntl = new maplibregl.AttributionControl({
    customAttribution:'<a href="https://github.com/sanskruthiya/GlobalChoropleth" target="_blank">GitHub</a>',
    compact: true
});
map.addControl(attCntl, 'bottom-right');

//マップ上に描画する各種情報の読み込み
map.on('load', () => {
    map.setProjection({"type": "globe"}); //ここでGlobe Projectionを設定
    //国データの読み込み
    map.addSource('country-polygon', { //国のラフな形状ポリゴンにHDI指標値を紐づけたデータ
        'type': 'geojson',
        'data': './app/data/country250_HDI_polygon.geojson',
    });
    map.addSource('country-point', { //国の代表点ポイントにHDI指標値を紐づけたデータ
        'type': 'geojson',
        'data': './app/data/country250_HDI_point.geojson',
    });

    //各レイヤの読み込み
    map.addLayer({
        'id': 'country_polygon', //国のラフな形状ポリゴンにHDI指標値を紐づけたデータをfill（塗り）として読み込む
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
        'id': 'country_point', //国の代表点ポイントにHDI指標値を紐づけたデータをシンボルラベルとして読み込む
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
    /*
    //fill-extrusionによる3D試行用
    map.addSource('country-circle', {
        'type': 'geojson',
        'data': './app/data/country250_HDI_pointCircle.geojson',
    });
    map.addLayer({
        'id': 'country_3D',
        'source': 'country-circle',
        "maxzoom": 10,
        'layout': {
            'visibility': 'visible',
        },
        'type': 'fill-extrusion',
        'paint': {
            "fill-extrusion-color": ["to-color", matchColor],
            "fill-extrusion-opacity": 0.5,
            "fill-extrusion-height": ["*", ["get", "st_一人当たりGNI"], 10]
        }
    });
    //Sky描画試行用
    map.setSky({
        "sky-color": "#199EF3",
        "sky-horizon-blend": 0.7,
        "horizon-color": "#f0f8ff",
        "horizon-fog-blend": 0.8,
        "fog-color": "#2c7fb8",
        "fog-ground-blend": 0.9,
        "atmosphere-blend": ["interpolate",["linear"],["zoom"],0,1,12,0]
    });
    */
});

//ポップアップ時の表示内容の設定
function createPopup(feature, lngLat) {
    const content = `
        <h3>${feature.properties.st_Name_jp}</h3>
        <table class="tablestyle02">
            <tr><td>人間開発指標</td><td>${feature.properties.st_HDI_value > 0 ? 
                `${Number(feature.properties.st_HDI_value).toLocaleString()} (${feature.properties.st_HDI_rank}位)` : '- (対象外)'}</td></tr>
            <tr><td>分類</td><td>${getCategory(feature.properties.st_HDI_category)}</td></tr>
            <tr><td>平均寿命</td><td>${feature.properties.st_平均寿命 > 0 ? 
                `${(feature.properties.st_平均寿命).toFixed(2)} 歳` : '- (対象外)'}</td></tr>
            <tr><td>期待就学年数</td><td>${feature.properties.st_期待就学年数 > 0 ? 
                `${(feature.properties.st_期待就学年数).toFixed(2)} 年` : '- (対象外)'}</td></tr>
            <tr><td>平均就学年数</td><td>${feature.properties.st_平均就学年数 > 0 ? 
                `${(feature.properties.st_平均就学年数).toFixed(2)} 年` : '- (対象外)'}</td></tr>
            <tr><td>一人当たりGNI</td><td>${feature.properties.st_一人当たりGNI > 0 ? 
                `${Math.round(feature.properties.st_一人当たりGNI).toLocaleString()} $ (PPP 2017 intl$)` : '- (対象外)'}</td></tr>
        </table>
        <p class="remarks"><a href="https://www.google.com/search?q=国+${feature.properties.st_Name_jp}" target="_blank">この国についてGoogleで調べる</a></p>
    `;
    new maplibregl.Popup({ closeButton: true, focusAfterOpen: false, className: 't-popup', maxWidth: '360px', anchor: 'bottom' })
        .setLngLat(lngLat)
        .setHTML(content)
        .addTo(map);
}

//ポリゴンレイヤのクリックイベント
map.on('click', 'country_polygon', function (e) {
    //シンボルとポリゴンの両レイヤが重複してポップアップされないように分岐処理
    const symbolFeature = map.queryRenderedFeatures(e.point, { layers: ['country_point'] });
    if (!symbolFeature.length) {
        const polygonFeature = map.queryRenderedFeatures(e.point, { layers: ['country_polygon'] })[0];
        if (polygonFeature) {
            map.panTo(e.lngLat, { duration: 1000 });
            createPopup(polygonFeature, e.lngLat);
        }
    }
});

//シンボルレイヤのクリックイベント
map.on('click', 'country_point', function (e) {
    const pointFeature = map.queryRenderedFeatures(e.point, { layers: ['country_point'] })[0];
    if (pointFeature) {
        map.panTo(e.lngLat, { duration: 1000 });
        createPopup(pointFeature, e.lngLat);
    }
});
