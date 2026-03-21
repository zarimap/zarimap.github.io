// assets/js/map-logic.js

// ① 地図の土台を作る（緯度, 経度, ズームレベル）
const map = L.map('map').setView([35.6895, 139.6917], 13);

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution: '© Stadia Maps, © OpenStreetMap contributors',
}).addTo(map);

// ③ この後に fetch(...) などの処理を書く
