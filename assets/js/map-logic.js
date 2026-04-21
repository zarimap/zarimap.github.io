/**
 * Zarimap - Map Logic
 * 2026 Zarimap Project
 */

// 1. 地図の初期設定
const map = L.map('map').setView([35.6895, 139.6917], 15);

// 2. 背景タイルの設定
const tileUrl = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
const attribution = '© 国土地理院';

L.tileLayer(tileUrl, { 
    attribution: attribution,
    maxZoom: 18
}).addTo(map);

// --- データの管理 ---
let allLocations = []; 
let isDetailView = false; // 【修正】詳細表示中かどうかを管理するフラグ

/**
 * 右側のパネルを「今見えている範囲のリスト」に書き換える
 */
function updateVisibleList() {
    // 【修正】詳細を表示している最中なら、リストの更新を中止する
    if (isDetailView) return;

    const infoContent = document.getElementById('info-content');
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
            // 名前にシングルクォートが含まれても壊れないようにエスケープ
            const safeName = name.replace(/'/g, "\\'");
            html += `<li onclick="showDetailsFromName('${safeName}')">${name}</li>`;
        });
        html += `</ul>`;
    }
    
    infoContent.innerHTML = html;
}

/**
 * リストから名前でデータを検索して詳細を表示する
 */
window.showDetailsFromName = function(name) {
    const loc = allLocations.find(l => (l.name_ja === name || l.name_en === name));
    if (loc) {
        isDetailView = true; // 【修正】地図を動かす前に詳細モードをONにする
        map.panTo([loc.lat, loc.lng]); 
        showDetails(loc); 
    }
};

/**
 * 右側のパネルに「詳細情報」を表示する
 */
function showDetails(loc) {
    isDetailView = true; // 詳細モードを確定させる
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
 * 【追加】詳細を閉じてリストに戻るための関数
 */
window.closeDetails = function() {
    isDetailView = false; // 詳細モードを解除
    updateVisibleList();  // 今の画面範囲でリストを再描画
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

            const popupLabel = (currentLang === 'ja') ? '詳細を見る' : 'Read More';
            let popupHtml = `<b>${(currentLang === 'ja' ? locData.name_ja : locData.name_en)}</b><br>`;
            if (locData.url) {
                popupHtml += `<a href="${locData.url}" target="_blank" rel="noopener noreferrer">${popupLabel}</a>`;
            }
            marker.bindPopup(popupHtml);

            marker.on('click', () => {
                showDetails(locData);
            });
        }
        
        updateVisibleList(); 
    });

/**
 * 4. 地図が動いた時にリストを更新する設定
 */
map.on('moveend', updateVisibleList);
