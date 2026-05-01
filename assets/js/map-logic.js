/**
 * Zarimap - Map Logic
 * 2026 Zarimap Project
 */

// 1. 地図の初期設定
const map = L.map('map').setView([35.6895, 139.6917], 15);

// --- 現在地ボタンの統合処理 ---
const locateBtn = document.getElementById('locate-btn');
// 現在地を表示するためのレイヤーグループ（ボタンを押すごとに更新するため）
let locationLayer = L.layerGroup().addTo(map);

if (locateBtn) {
    // ボタンをクリックしたときに地図のイベント（クリックでピンを立てる等）が発火するのを防ぐ
    L.DomEvent.disableClickPropagation(locateBtn);

    locateBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert("お使いのブラウザは位置情報に対応していません。");
            return;
        }

        const btn = this;
        btn.innerText = "探索中...";

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const latlng = [lat, lng];

                // 前の現在地マークを消去
                locationLayer.clearLayers();

                // 1. 地図を移動（ズーム13は市街地全体が見渡せるくらい）
                map.setView(latlng, 13);

                // 2. 現在地に「自分はここ」という青い円を表示
                L.circle(latlng, {
                    radius: 200,      // 半径200m
                    color: '#3498db', // 枠線の色
                    fillColor: '#3498db',
                    fillOpacity: 0.4
                }).addTo(locationLayer);

                // 青いピンも立てる
                L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'my-location-icon',
                        html: '<div style="background:#3498db; width:12px; height:12px; border:2px solid white; border-radius:50%;"></div>',
                        iconSize: [12, 12]
                    })
                }).addTo(locationLayer);

                btn.innerText = "🔍 近くのザリガニを探す";
            },
            function(error) {
                alert("位置情報の取得に失敗しました。");
                btn.innerText = "🔍 近くのザリガニを探す";
            },
            { enableHighAccuracy: true }
        );
    });
}

// 2. 背景タイルの設定（国土地理院タイル）
const tileUrl = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
const attribution = '© 国土地理院';

L.tileLayer(tileUrl, { 
    attribution: attribution,
    maxZoom: 18
}).addTo(map);

// --- データの管理 ---
let allLocations = []; 
let isDetailView = false; // 詳細表示中かどうかを管理するフラグ

/**
 * 右側のパネルを「今見えている範囲のリスト」に書き換える
 */
function updateVisibleList() {
    if (isDetailView) return;

    const infoContent = document.getElementById('info-content');
    if (!infoContent) return;

    const listTitle = (currentLang === 'ja') ? 'このエリアの生息地' : 'Habitats in this area';
    const bounds = map.getBounds();

    const visibleLocations = allLocations.filter(loc => {
        return bounds.contains([loc.lat, loc.lng]);
    });

    let html = `<h3>${listTitle}</h3>`;
    
    if (visibleLocations.length === 0) {
        html += `<p style="color:#999; font-size:0.9rem;">${(currentLang === 'ja' ? 'この付近にデータはありません' : 'No data in this area')}</p>`;
    } else {
        html += `<ul id="location-list">`;
        visibleLocations.forEach((loc) => {
            const name = (currentLang === 'ja') ? loc.name_ja : loc.name_en;
            const safeName = name.replace(/'/g, "\\'");
            html += `<li onclick="showDetailsFromName('${safeName}')">${name}</li>`;
        });
        html += `</ul>`;
    }
    
    infoContent.innerHTML = html;
}

/**
 * リストから名前で検索して詳細を表示し、地図上の吹き出しも開く
 */
window.showDetailsFromName = function(name) {
    const loc = allLocations.find(l => (l.name_ja === name || l.name_en === name));
    if (loc) {
        isDetailView = true; 
        map.panTo([loc.lat, loc.lng]); 

        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                const latLng = layer.getLatLng();
                if (latLng.lat === loc.lat && latLng.lng === loc.lng) {
                    layer.openPopup(); 
                }
            }
        });

        showDetails(loc); 
    }
};

/**
 * 右側のパネルに「詳細情報カード」を表示する
 */
function showDetails(loc) {
    isDetailView = true; 
    const infoContent = document.getElementById('info-content');
    const name = (currentLang === 'ja') ? loc.name_ja : loc.name_en;
    const desc = (currentLang === 'ja') ? loc.desc_ja : loc.desc_en;
    const btnLabel = (currentLang === 'ja') ? '詳細サイトへ移動' : 'Visit Detail Site';

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <span style="background:#e67e22; color:white; padding:2px 8px; border-radius:4px; font-size:0.8rem;">Data Card</span>
            <button onclick="closeDetails()" style="cursor:pointer; font-size:28px; border:none; background:none; color:#999;">&times;</button>
        </div>
        <h4>${name}</h4>
        <p style="white-space: pre-wrap;">${desc}</p>
    `;

    if (loc.url && loc.url !== "") {
        html += `
            <a href="${loc.url}" target="_blank" rel="noopener noreferrer" 
               style="display:block; background:#e67e22; color:white; text-align:center; padding:12px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:20px;">
               ${btnLabel}
            </a>
        `;
    }
    infoContent.innerHTML = html;
}

/**
 * 詳細を閉じてリストに戻る
 */
window.closeDetails = function() {
    isDetailView = false; 
    map.closePopup(); 
    updateVisibleList(); 
};

// 3. CSVファイルを読み込んで処理する
fetch('../../assets/data/zarigani.csv')
    .then(response => response.text())
    .then(csvData => {
        const rows = csvData.trim().split('\n');
        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');
            if (columns.length < 6) continue;

            const locData = {
                name_ja: columns[0].trim(),
                name_en: columns[1].trim(),
                lat: parseFloat(columns[2]),
                lng: parseFloat(columns[3]),
                desc_ja: columns[4].trim(),
                desc_en: columns[5].trim(),
                url: columns[6] ? columns[6].trim() : ""
            };

            allLocations.push(locData);

            const marker = L.marker([locData.lat, locData.lng]).addTo(map);

            const name = (currentLang === 'ja') ? locData.name_ja : locData.name_en;
            const desc = (currentLang === 'ja') ? locData.desc_ja : locData.desc_en;
            const popupLabel = (currentLang === 'ja') ? '詳細サイトへ' : 'Visit Site';
            const shortDesc = desc.length > 30 ? desc.substring(0, 30) + "..." : desc;

            let popupHtml = `
                <div style="min-width: 150px;">
                    <b style="font-size: 1.1rem; color: #e67e22;">${name}</b><br>
                    <p style="margin: 5px 0; font-size: 0.9rem; line-height: 1.4;">${shortDesc}</p>
            `;

            if (locData.url) {
                popupHtml += `
                    <a href="${locData.url}" target="_blank" rel="noopener noreferrer" 
                       style="color: #e67e22; font-weight: bold; text-decoration: underline;">
                       ${popupLabel}
                    </a>
                `;
            }
            popupHtml += `</div>`;

            marker.bindPopup(popupHtml);
            
            marker.on('popupclose', function() {
                setTimeout(() => {
                    let isOpen = false;
                    map.eachLayer(function(layer) {
                        if (layer instanceof L.Popup && map.hasLayer(layer)) {
                            isOpen = true;
                        }
                    });
                    if (!isOpen) {
                        closeDetails();
                    }
                }, 200); 
            });

            marker.on('click', () => {
                showDetails(locData);
            });
        }
        updateVisibleList(); 
    });

// 4. 地図が動いた時にリストを更新する
map.on('moveend', updateVisibleList);
