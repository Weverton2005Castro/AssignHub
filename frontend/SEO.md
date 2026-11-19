# Publicação e acompanhamento de SEO

A página inicial é a página pública indexável. As telas de autenticação e do painel recebem noindex; isso não substitui autenticação nem controle de acesso. O robots.txt permite rastrear essas telas para que o Google leia o noindex e bloqueia apenas /api/. O sitemap contém apenas a página pública, sem datas artificiais de atualização.

## Configurar antes de gerar o build de produção

- SITE_URL: origem HTTPS oficial, por exemplo https://app.seudominio.com.br (sem caminho). Escolha uma única versão com ou sem www e configure redirecionamento permanente da alternativa na hospedagem.
- SEO_INDEXABLE=true: habilite somente no ambiente público oficial. Local, homologação e previews devem manter false. Não reutilize esse build de produção em previews públicos.
- GOOGLE_SITE_VERIFICATION: token de verificação HTML do Search Console, se utilizar esse método. A verificação DNS também pode ser feita no provedor do domínio.

Essas variáveis são utilizadas na geração estática: faça novo build após alterá-las. Sem domínio configurado o fallback é localhost e a indexação fica desativada.

## Após publicar

1. Confirme que a página inicial responde HTTP 200 em HTTPS, sem exigir login, e que os links funcionam no celular.
2. Confira no HTML: canonical com o domínio oficial, robots index e JSON-LD. Acesse /robots.txt, /sitemap.xml e /opengraph-image.
3. Cadastre o domínio no Google Search Console, conclua a verificação e envie a URL /sitemap.xml. Use a inspeção de URL para testar a página inicial e solicitar indexação.
4. Verifique dados estruturados no Schema Markup Validator e, quando aplicável, no Rich Results Test do Google. O cadastro de SoftwareApplication descreve o produto; não há avaliações ou preços inventados e isso não garante resultado enriquecido.
5. Rode PageSpeed Insights na URL publicada e acompanhe Core Web Vitals com dados reais. A compilação local não mede desempenho de rede e hospedagem.
6. Monitore indexação, impressões, cliques e consultas no Search Console. Publique conteúdo original que responda às dúvidas reais dos usuários e conecte novas páginas úteis com links internos, metadados próprios e sitemap atualizado.

SEO facilita descoberta e compreensão, mas não garante indexação, posição, volume de acessos ou prazo. Conteúdo útil, experiência real do produto e referências legítimas de outros sites exigem trabalho contínuo.

Referências: https://developers.google.com/search/docs/fundamentals/seo-starter-guide e https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
