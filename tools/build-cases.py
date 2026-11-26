"""Gera a página de cada case: genialcard/index.html, juntos-pra-fazer-historia/index.html, credenciados-light/index.html.

Cada uma é uma cópia do index.html com título, descrição e endereço do case no <head>, e com os caminhos dos arquivos
(assets/, favicon.ico…) a partir da raiz (/assets/…), já que a página fica dentro de uma pasta. O GitHub Pages serve
juanrezende.com/genialcard/ a partir de genialcard/index.html, e o main.js abre o case certo pelo endereço.
Assim o Google indexa cada case e o link compartilhado mostra o título do case.

Rode depois de qualquer mudança no index.html, antes do commit:
    python tools/build-cases.py

Não edite os arquivos gerados: as mudanças somem na próxima vez que o script rodar.
"""
import html
import io
import os
import re

SITE = 'https://juanrezende.com'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# um caminho do site no início do valor ou depois de espaço/vírgula (srcset tem vários)
LOCAL = re.compile(r'(^|[\s,])(assets/|favicon\.ico|apple-touch-icon\.png)')

# endereço → (slug do case no index.html, descrição para o Google e para o card de compartilhamento)
# o endereço precisa ser o mesmo do PATHS em assets/js/main.js
CASES = {
    'genialcard': ('genialcard',
                   'Case GenialCard: app mobile de finanças pessoais, com pesquisa com 46 pessoas, 9 testes de '
                   'usabilidade e uma visão única de cartões, limites e assinaturas.'),
    'juntos-pra-fazer-historia': ('globo',
                                  'Case Juntos pra fazer história: comunidade de cultura e pessoas na intranet da Globo, '
                                  'com protótipos, testes de usabilidade e publicação simples para gestores.'),
    'credenciados-light': ('light',
                           'Case Credenciados Light: portal web e mobile para parceiros credenciados, com 2ª via, '
                           'parcelamento e religação em uma interface clara.'),
}


def set_attr(page, pattern, value):
    """Troca o content/href da tag que casa com o padrão; para se ela não existir."""
    new, n = re.subn(pattern, lambda m: m.group(1) + html.escape(value, quote=True) + m.group(2), page, count=1)
    if n != 1:
        raise SystemExit('Não achei no <head> do index.html: ' + pattern)
    return new


def main():
    src = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8', newline='').read()
    home_title = re.search(r'<title>(.*?)</title>', src).group(1)

    for path, (slug, desc) in CASES.items():
        m = re.search(r'<article class="case" data-case="%s" data-title="([^"]+)"' % slug, src)
        if not m:
            raise SystemExit('Case "%s" não encontrado no index.html' % slug)
        title = html.unescape(m.group(1)) + ' | Juan Rezende'
        url = '%s/%s/' % (SITE, path)

        page = src.replace('<html lang="pt-BR">',
                           '<html lang="pt-BR" data-home-title="%s">' % html.escape(home_title, quote=True), 1)
        page = page.replace('<!DOCTYPE html>',
                            '<!DOCTYPE html>\n<!-- GERADO por tools/build-cases.py a partir do index.html: não edite este arquivo -->', 1)
        page = page.replace('<title>%s</title>' % home_title, '<title>%s</title>' % html.escape(title, quote=False), 1)
        page = set_attr(page, r'(<meta name="description" content=")[^"]*(">)', desc)
        page = set_attr(page, r'(<link rel="canonical" href=")[^"]*(">)', url)
        page = set_attr(page, r'(<meta property="og:type" content=")[^"]*(">)', 'article')
        page = set_attr(page, r'(<meta property="og:url" content=")[^"]*(">)', url)
        page = set_attr(page, r'(<meta property="og:title" content=")[^"]*(">)', title)
        page = set_attr(page, r'(<meta property="og:description" content=")[^"]*(">)', desc)
        page = set_attr(page, r'(<meta name="twitter:title" content=")[^"]*(">)', title)
        page = set_attr(page, r'(<meta name="twitter:description" content=")[^"]*(">)', desc)

        # caminhos relativos ao site (assets/…, favicon.ico) passam a partir da raiz: a página está um nível abaixo
        page = re.sub(r'(\s(?:href|src|srcset|data-zoom|poster)=")([^"]*)"',
                      lambda m: m.group(1) + LOCAL.sub(lambda p: p.group(1) + '/' + p.group(2), m.group(2)) + '"', page)

        folder = os.path.join(ROOT, path)
        os.makedirs(folder, exist_ok=True)
        io.open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8', newline='').write(page)
        print('ok  /%s/  ->  %s/index.html' % (path, path))


if __name__ == '__main__':
    main()
