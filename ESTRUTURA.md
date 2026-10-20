# Estrutura do portfólio

O site é uma página só (`index.html`) que funciona abrindo o arquivo direto no navegador, sem servidor nem build.

## Onde editar cada coisa

| Quero mudar… | Arquivo |
|---|---|
| Textos, links, imagens e seções | `index.html` (procure os comentários `══════════`) |
| Cores, fontes, espaçamentos e curvas de animação | `assets/css/01-tokens.css` |
| Botões e cards de vidro | `assets/css/03-components.css` |
| Fundo da página e a introdução | `assets/css/04-atmosphere.css` |
| Menu, containers e margens | `assets/css/05-layout.css` |
| Hero (título, botão, onda) | `assets/css/06-hero.css` |
| Projetos e a ignição do projeto em destaque | `assets/css/07-projects.css` |
| Sobre, indicadores e Formação | `assets/css/08-about.css` |
| Processo | `assets/css/09-process.css` |
| Artigos | `assets/css/10-articles.css` |
| Contato e rodapé | `assets/css/11-contact.css` |
| Páginas dos cases | `assets/css/12-case.css` |
| Lightbox | `assets/css/13-overlays.css` |
| Comportamento com movimento reduzido | `assets/css/14-motion.css` |
| Animações, navegação e interações | `assets/js/main.js` (índice no topo do arquivo) |
| Céu estrelado do fundo | `assets/js/effects/cosmos.js` |
| Onda de LEDs (hero e horizonte do contato) | `assets/js/effects/wave.js` |

## Regras importantes

- **A ordem dos arquivos CSS importa.** Eles são carregados de `01` a `14`, e um arquivo posterior pode sobrescrever um anterior. Para criar um arquivo novo, use o próximo número e inclua o `<link>` no `<head>` do `index.html`.
- **Os scripts do fim da página também têm ordem:** GSAP, depois `effects/`, depois `main.js`.
- **O pequeno script dentro do `<head>` fica no HTML de propósito.** Ele precisa rodar antes da página aparecer, para controlar a introdução.

## Tarefas comuns

**Adicionar uma certificação.** No `index.html`, dentro da lista `edu__certs`, copie uma linha `<li>` e troque nome, instituição e ano. O atributo `data-area` define a etiqueta: `dev` (Desenvolvimento), `des` (Design) ou `pia` (Produto & IA). O contador ao lado de "Certificações" atualiza sozinho.

**Mudar um indicador do Sobre.** No `index.html`, procure a lista `impact`. O número animado fica em `data-count`. Para valores com vírgula, use `data-decimals="1"` (ex.: `data-count="96.4" data-decimals="1"` mostra 96,4%).

**Trocar uma cor do site inteiro.** Edite a variável em `assets/css/01-tokens.css`. Por exemplo, `--accent` é o âmbar dos botões e `--sky` é o azul.

## SEO (antes de publicar)

**1. Endereço do site.** O site é publicado pelo GitHub Pages em `https://juanrezende.github.io` (repositório `JuanRezende/JuanRezende.github.io`). Para atualizar o site no ar, faça commit e `git push` na branch `main`; ele muda em 1 a 2 minutos. Esse endereço aparece em `index.html` (no `<head>` e nos dados estruturados), `robots.txt` e `sitemap.xml`. Se um dia usar um domínio próprio, troque-o em todos com "Substituir em todos os arquivos" (Ctrl+Shift+H no VS Code), sem a barra no final.

**2. Não publicar a pasta `Bases/`.** Ela guarda cópias de sites de outros designers usados como referência. O `.gitignore` já a deixa fora do repositório, então ela nunca vai para o GitHub.

**3. Cadastrar no Google Search Console** (search.google.com/search-console). Adicione o site e confirme a propriedade. Depois, em "Sitemaps", envie `sitemap.xml` e, em "Inspeção de URL", peça a indexação da página inicial.

**4. Testar a prévia de compartilhamento.** O LinkedIn Post Inspector (linkedin.com/post-inspector) mostra o card com a imagem `assets/img/seo/og-image.jpg`. O Teste de Rich Results do Google (search.google.com/test/rich-results) confere os dados estruturados.

**Onde fica cada coisa:**

| O quê | Onde |
|---|---|
| Título e descrição que aparecem no Google | `<title>` e `meta name="description"` no `index.html` |
| Card de compartilhamento (LinkedIn, WhatsApp) | tags `og:` e `twitter:` no `index.html`; imagem em `assets/img/seo/og-image.jpg` (1200×630) |
| Dados para o Google entender quem você é (cargo, habilidades, formação, cases) | bloco `application/ld+json` no `index.html`. Ao incluir uma certificação na seção Formação, inclua também em `hasCredential` |
| Ícones da aba e do celular | `favicon.ico`, `favicon.svg`, `apple-touch-icon.png` (raiz) e `assets/img/seo/favicon-96.png` |
| Regras para robôs e mapa do site | `robots.txt` e `sitemap.xml` (atualize o `lastmod` quando mudar o conteúdo) |
