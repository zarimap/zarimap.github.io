const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Zarimap",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Web版のURLを読み込む
  win.loadURL('https://maps.zaritsuri.com/');

  // 外部リンクをブラウザではなくアプリ内の新しいウィンドウ（WebView）で開く
  win.webContents.setWindowOpenHandler(({ url }) => {
    // アプリ内ウィンドウを新しく作成
    const childWin = new BrowserWindow({
      width: 1000,
      height: 700,
      title: "Zarimap - External Link",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    childWin.loadURL(url);

    // デフォルトのブラウザ起動をブロック（アプリ内表示を優先）
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
