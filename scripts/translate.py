import re
from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator

def translate_html():
    with open('ja/index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 1. 属性や固定文字列の置換ルール（構造・リンク設定）
    replacements = {
        '<html lang="ja">': '<html lang="en">',
        "const currentLang = 'ja';": "const currentLang = 'en';",
        '<li><a href="../en/">English</a></li>': '<li><a href="../ja/">日本語</a></li>',
        'https://github.com/zarimap/info/tree/main#%E6%97%A5%E6%9C%AC%E8%AA%9E': 'https://github.com/zarimap/info/tree/main#english',
    }

    for key, value in replacements.items():
        html_content = html_content.replace(key, value)

    soup = BeautifulSoup(html_content, 'html.parser')
    translator = GoogleTranslator(source='ja', target='en')

    # タイトルの翻訳
    if soup.title and soup.title.string:
        soup.title.string = "Zarimap - Crayfish Search Map"

    # 指定要素のテキストのみ抽出して機械翻訳（タグや属性は保持）
    target_tags = ['p', 'h1', 'h3', 'button', 'span', 'a']
    for tag in soup.find_all(target_tags):
        # 子要素を持たない末端のテキスト要素のみ翻訳（リンク内テキストなど）
        if len(tag.contents) == 1 and isinstance(tag.contents[0], str):
            text = tag.string.strip()
            # 空文字やJavaScriptの記述、すでに英語のものはスキップ
            if text and not text.startswith(('http', 'const', 'var')):
                try:
                    translated = translator.translate(text)
                    tag.string.replace_with(translated)
                except Exception as e:
                    print(f"Translation failed for '{text}': {e}")

    # en/index.html へ保存
    with open('en/index.html', 'w', encoding='utf-8') as f:
        f.write(str(soup))

    print("Successfully translated ja/index.html to en/index.html")

if __name__ == '__main__':
    translate_html()
