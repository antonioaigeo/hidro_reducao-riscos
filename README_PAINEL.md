# Painel de edição do site HIDRO

O painel (`/painel/`) permite corrigir textos, trocar imagens, duplicar ou excluir blocos e substituir arquivos para baixar, sem mexer em código. As alterações vão direto para o GitHub e o site é atualizado em 1 a 2 minutos.

## O que é preciso
1. Uma conta no **GitHub** (gratuita) e um **repositório** com o conteúdo desta pasta.
2. O site publicado a partir desse repositório: **GitHub Pages**, **Netlify** ou **Cloudflare Pages** (todos têm plano gratuito). O painel não funciona se o site for enviado por FTP ou hospedado sem GitHub.
3. Uma **chave de acesso** (token) do GitHub, criada por você.

Observação: no plano gratuito do GitHub, o GitHub Pages exige repositório público. Como o site já é público, isso não é problema (não guarde senhas nem dados pessoais no repositório). Para repositório privado, use Netlify ou Cloudflare Pages.

## Quem consegue editar
O endereço `/painel/` pode ser aberto por qualquer pessoa, mas **só quem tiver a chave de acesso consegue salvar**, porque quem decide é o GitHub. Sem a chave, o painel é inútil. Por isso:
- Nunca compartilhe a chave nem a publique.
- Crie a chave só para este repositório e com validade de 90 dias.
- Em computador compartilhado, não marque "Lembrar neste computador" e use "Sair" ao terminar.
- Se a chave vazar, apague-a no GitHub (Settings > Developer settings > Fine-grained tokens) e crie outra.

## Como criar a chave (uma vez, ou a cada renovação)
1. No GitHub: foto do perfil > **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens** > **Generate new token**.
2. Nome: "Painel HIDRO". Validade: 90 dias.
3. **Repository access**: "Only select repositories" e escolha só o repositório do site.
4. **Permissions > Repository permissions > Contents**: "Read and write".
5. **Generate token** e copie o texto que começa com `github_pat_` (aparece uma única vez).

## Como usar
1. Abra `https://SEU-SITE/painel/`.
2. Informe o repositório (`usuario/nome`), o ramo (normalmente `main`) e a chave. Clique em **Entrar**.
3. Escolha a página na lista. Ela aparece como no site.
4. **Texto:** clique e digite. `Enter` insere quebra de linha. Use **N** e **I** para negrito e itálico. 
5. **Link ou botão:** clique no texto dele e em **Link** para mudar o endereço.
6. **Imagem:** clique nela (contorno vermelho), depois em **Trocar imagem**. Imagens maiores que 1600 px de largura são reduzidas automaticamente. Descreva a imagem quando o painel pedir (acessibilidade).
7. **Adicionar item:** clique no item (parágrafo, cartão, linha de tabela, atividade), use **Duplicar bloco** e edite a cópia. **Bloco maior** seleciona o bloco que contém o atual. **Excluir bloco** remove o selecionado.
8. **Salvar e publicar.** Aguarde a mensagem "Publicado!".

**Arquivos para baixar (Word, PDF, PowerPoint, planilha):** aba "Materiais para baixar". Para substituir um arquivo, envie um com o mesmo nome. Para adicionar, envie um novo e, na página Materiais, duplique um cartão e mude o link para `materiais/nome-do-arquivo`.

## Se algo der errado
- Todas as versões ficam no GitHub (aba **Commits**). Dá para restaurar qualquer versão anterior.
- "A página foi alterada em outro lugar": alguém (ou você, em outro lugar) salvou antes. Reabra a página no painel e refaça a edição.
- "A chave de acesso foi recusada": a chave expirou ou foi copiada incompleta. Crie outra.
- "Desfazer" só desfaz digitação. Para desfazer uma duplicação ou exclusão, recarregue a página no painel **sem salvar**.

## Limites
- Não edita **menu, cabeçalho e rodapé**: são iguais em todas as páginas.
- Não cria páginas novas nem muda o layout, as cores ou a estrutura.
- Não atualiza os arquivos Word, PDF e PowerPoint: eles são arquivos separados. Se você corrigir um texto no site, corrija também no documento correspondente, se for o caso.
- Depois que passar a editar pelo painel, **os arquivos `.html` do repositório são a versão oficial**. Se for pedir mudanças maiores a quem gerou o site (por exemplo, novo layout), envie os arquivos atuais do repositório, para que as suas edições não sejam sobrescritas.
- O painel foi testado em navegador de computador (Chrome) com um GitHub simulado. **Faça o primeiro teste em um repositório de teste ou em uma cópia** antes de usar no site oficial, editando algo pequeno e conferindo o resultado.
