# scripts/translate.py
import re
from deep_translator import GoogleTranslator

def translate_html():
    # ja/index.html を読み込む
    with open('ja/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. 属性の置換
    html = html.replace('<html lang="ja">', '<html lang="en">')
    html = html.replace("const currentLang = 'ja';", "const currentLang = 'en';")
    
    # 2. 決まったリンクの自動書き換え（必要に応じて調整）
    html = html.replace('href="../index.html"', 'href="../"')
    html = html.replace('<li><a href="../ja/">日本語</a></li>', '<li><a href="../en/">English</a></li>') # メニューの言語切替

    # ※本格的に本文テキストを翻訳する場合は、BeautifulSoup等でタグ内の文字列を抽出して
    # GoogleTranslator(source='ja', target='en').translate(text) を実行します。

    # en/index.html へ書き出し
    with open('en/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    translate_html()