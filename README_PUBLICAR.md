# Site do HIDRO: como publicar e editar

Este é um site estático (HTML, CSS e JavaScript). Não precisa de banco de dados nem de servidor especial.

## O que tem na pasta
- `index.html`, `jogo.html`, `plano-de-aula.html`, `atividades.html`, `inclusao.html`, `avaliacao.html`, `materiais.html`, `oficina.html`, `sobre.html`, `404.html`
- `assets/` (estilos, scripts, fontes e imagens) e `materiais/` (Word, PDF, PowerPoint e kit de divulgação para baixar)
- `painel/` (painel de edição, veja `README_PAINEL.md`)
- `robots.txt` e `sitemap.xml`

## Para publicar (escolha uma opção)
1. **Netlify (arrastar e soltar):** entre em app.netlify.com, escolha "Add new site > Deploy manually" e arraste esta pasta. Simples, mas o painel de edição só funciona se, em vez disso, você ligar o Netlify a um repositório do GitHub.
2. **GitHub Pages:** crie um repositório, envie o conteúdo desta pasta e ative o Pages nas configurações.
3. **Servidor da instituição:** envie o conteúdo da pasta para o servidor web. Consulte o setor de TI da UFGD sobre hospedagem e domínio.

## Passo obrigatório depois de publicar: trocar o endereço
Os arquivos usam o endereço provisório `https://SEU-SITE.exemplo.br` (no cartão de compartilhamento do link, no `canonical` e no `sitemap.xml`). Depois de saber o endereço definitivo, use "Localizar e substituir" em todos os arquivos `.html`, no `sitemap.xml` e no `robots.txt`, trocando `https://SEU-SITE.exemplo.br` pelo endereço real (sem barra no final). Sem isso, o cartão do link não aparece corretamente ao compartilhar.

## Depois de trocar o endereço
- Teste o cartão do link no WhatsApp, no Facebook (Depurador de compartilhamento) e no Instagram.
- Gere um QR code do endereço (por exemplo, em um gerador gratuito) e coloque no slide 24 da apresentação para adultos.

## Conferir antes de divulgar
- **Logos institucionais:** verifique com as instituições se há norma ou autorização para usar os logos em um site de projeto pessoal ou de pesquisa. O site já explica que os logos indicam os vínculos da equipe com a UFGD e suas atividades de pesquisa.
- **Licença:** o texto atual diz que o licenciamento está em definição. Atualize quando o NIT responder.
- **Evento:** o programa do Seminário RRD 2026 não pôde ser lido na hora de montar o material; assumi 90 minutos. Ajuste `oficina.html` e os slides ao programa oficial.
- **Ética:** se os dados da oficina forem usados em pesquisa, é preciso aprovação em Comitê de Ética. O aviso ao participante é um modelo e deve seguir o modelo do CEP.
- **Citação:** em `sobre.html`, confira o formato e o local de publicação da referência.
- **Telefones:** confira os serviços de alerta do município (199, 193, 192 e 190 são nacionais).

## Como editar
- **Sem código:** use o painel em `/painel/` (veja `README_PAINEL.md`). Requer o site publicado a partir de um repositório do GitHub (opção 2, ou Netlify ou Cloudflare Pages ligado ao GitHub).
- **Com código:** abra os arquivos `.html` em qualquer editor de texto. As cores e o visual ficam em `assets/css/style.css`.
