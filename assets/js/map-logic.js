// assets/js/map-logic.js

// ① 地図の土台を作る（緯度, 経度, ズームレベル）
const map = L.map('map').setView([35.6895, 139.6917], 13);
// L.tileLayer の部分をこれに書き換え
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// ③ この後に fetch(...) などの処理を書く
