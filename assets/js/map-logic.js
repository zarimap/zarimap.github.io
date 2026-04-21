/**
 * Zarimap - Map Logic (Multilingual & Interactive Sidebar)
 * 2026 Zarimap Project
 */

// 1. 地図の初期設定（[緯度, 経度], ズームレベル）
// 表示したい場所の座標に書き換えてください
const map = L.map('map').setView([35.6895, 139.6917], 15);

// 2. 言語によって地図の「背景（タイル）」を切り替える
let tileUrl;
let attribution;

if (typeof currentLang !== 'undefined' && currentLang === 'ja') {
    // 日本語版：国土地理院の淡色地図
    tileUrl = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
    attribution = '© 国土地理院';
} else {
    // 英語版：CartoDBのシンプルな地図
    tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    attribution = '© OpenStreetMap contributors © CARTO';
}

L.tileLayer(tileUrl, { attribution: attribution }).addTo(map);

// --- グローバル変数（データを一時保存する場所） ---
let allLocations = [];

/**
 * 右側のパネルを「一覧表示」に戻す関数
 */
function showDefaultList() {
    const infoContent = document.getElementById('info-content');
    const listTitle = (currentLang === 'ja') ? '生息地一覧' : 'Habitat List';
    
    let html = `<h3>${listTitle}</h3><ul id="location-list">`;
    
    // 保存しておいた全データをリスト形式で表示
    allLocations.forEach((loc, index) => {
        const name = (currentLang === 'ja') ? loc.name_ja : loc.name_en;
        html += `<li onclick="focusMarker(${index})">${name}</li>`;
    });
    
    html += `</ul>`;
    infoContent.innerHTML = html;
}

/**
 * リストをクリックした時にその場所へ移動する（おまけ機能）
 */
function focusMarker(index) {
    const loc = allLocations[index];
    map.flyTo([loc.lat, loc.lng], 16);
    // 擬似的にピンをクリックした状態にして詳細を出す
    showDetails(loc);
}

/**
 * 右側のパネルに「詳細情報」を表示する関数
 */
function showDetails(loc) {
    const infoContent = document.getElementById('info-content');
    const detailHeader = (currentLang === 'ja') ? '詳細情報' : 'Details';
    const name = (currentLang === 'ja') ? loc.name_ja : loc.name_en;
    const desc = (currentLang === 'ja') ? loc.desc_ja : loc.desc_en;

    infoContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0;">${detailHeader}</h3>
            <button onclick="showDefaultList()" style="cursor:pointer; font-size:24px; border:none; background:none; color:#e67e22;">&times;</button>
        </div>
        <hr style="border:1px solid #eee; margin:15px 0;">
        <h4 style="color:#333; margin-bottom:5px;">${name}</h4>
        <p style="line-height:1.6; color:#666;">${desc}</p>
    `;
}

// 3. CSVファイルを読み込んでピンを立てる
fetch('../../assets/data/zarigani.csv')
    .then(response => response.text())
    .then(csvData => {
        const rows = csvData.trim().split('\n');
        
        // CSVの各行をループで処理
        for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(',');
            if (columns.length < 4) continue;

            const locData = {
                name_ja: columns[0],
                name_en: columns[1],
                lat: parseFloat(columns[2]),
                lng: parseFloat(columns[3]),
                desc_ja: columns[4],
                desc_en: columns[5]
            };

            // データを配列に保存
            allLocations.push(locData);

            // マップにピンを立てる
            const marker = L.marker([locData.lat, locData.lng]).addTo(map);
            
            // ピンをクリックした時のイベント
            marker.on('click', () => {
                showDetails(locData);
            });
        }

        // 全データの読み込みが終わったら、最初に「一覧」を表示する
        showDefaultList();
    })
    .catch(error => {
        console.error('CSVの読み込みに失敗しました:', error);
        document.getElementById('info-content').innerHTML = "Failed to load data.";
    });
