# TheLord_CaptureCore

Sistema independente de captura, gerenciamento e monitoramento de múltiplas telas e coletores.

## Acesso ao painel

**Painel web:** https://jrnascimentoh-source.github.io/TheLord_CaptureCore/

> O endereço acima será publicado pelo GitHub Pages após a integração desta branch à `main` e a conclusão bem-sucedida do workflow de publicação.

**Repositório:** https://github.com/JrNascimentoh-source/TheLord_CaptureCore

## Instalar o Universal Collector

[Instalar TheLord CaptureCore — Universal Collector](https://raw.githubusercontent.com/JrNascimentoh-source/TheLord_CaptureCore/main/collector/TheLord_CaptureCore-Universal-Collector.user.js)

1. Instale a extensão Tampermonkey no navegador.
2. Abra o link acima e confirme a instalação do userscript.
3. Acesse o painel CaptureCore, cadastre uma instância com plataforma, jogo, nome da tela e URL.
4. Clique em **Abrir jogo e coletar**. O painel abre a página com o identificador daquela instância.
5. Para reutilizar a tela depois, clique em **Salvar configuração** no cartão da instância. Abra **Salvas** na navegação e use **Iniciar tela**.
5. O coletor envia heartbeat e resultados ao painel que abriu aquela tela. Se a plataforma bloquear a incorporação em iframe, use **Abrir em janela externa** no cartão da tela. O status só fica Online após receber sinal real.

## Objetivo

Gerenciar várias telas simultaneamente, mantendo cada instância isolada por plataforma, jogo e origem. O CaptureCore coordena instâncias do Universal Collector e prepara a integração futura com o Supabase existente.

## Mapeamento inicial

| Plataforma | Identificação exibida | Chave lógica |
|---|---|---|
| 7a7 | Aviator | `aviator` |
| BetDoPovo | Aviator | `aviator2` |
| BetDoPovo | Aviator VIP | `aviatorvip` |

## Estrutura

```
index.html
styles.css
assets/
  logo.svg
  emblema-capturecore.png
  icon-*.png
  favicon-*.png
manifest.webmanifest
collector/
  TheLord_CaptureCore-Universal-Collector.user.js
src/
  app.js
  ui.js
  core/
    instance-store.js
    platform-registry.js
  adapters/
    collector-bridge.js
docs/
  architecture.md
  supabase-integration.md
tests/
```

## Executar localmente

Como o projeto usa módulos JavaScript, sirva os arquivos por um servidor HTTP local:

```bash
npx serve .
```

Depois abra o endereço local informado pelo servidor. Para testar o userscript localmente, configure o origin autorizado no código do coletor para o origin local utilizado.

## Estado atual

- [x] Dashboard responsivo e cadastro de instâncias.
- [x] Identificador individual por tela.
- [x] Mapeamento das duas combinações plataforma/jogo.
- [x] Abertura do jogo em janela vinculada à instância.
- [x] Bridge com validação da janela que originou a mensagem.
- [x] Universal Collector separado, com heartbeat e eventos de rodada.
- [x] Resumo local de última vela e quantidade por instância.
- [x] Salvar perfis de telas configuradas e reiniciá-los pela navegação.
- [x] Testes do catálogo, armazenamento local e isolamento do bridge.
- [x] CI validado: testes automatizados e verificação sintática aprovados.
- [x] Workflow de testes e publicação GitHub Pages.
- [ ] Teste real em Firefox/Tampermonkey com várias telas.
- [ ] Persistência compartilhada e autenticação.
- [ ] Adaptador Supabase com isolamento por instância.

## Limites desta versão

- As instâncias, configurações salvas e os resumos de velas ficam no `localStorage` do navegador do painel; não sincronizam entre computadores.
- Os eventos chegam ao painel por `window.opener.postMessage`; o navegador ou o site do jogo pode bloquear a relação entre janelas. O teste real precisa confirmar esse comportamento nas plataformas utilizadas.
- O coletor não grava na tabela `public.velas` atual. Ela não possui identificador de instância e misturaria o histórico de telas do mesmo jogo.
- Nenhuma alteração foi feita nas tabelas ou políticas Supabase. A integração remota será feita após definir autenticação e armazenamento por instância.
- Não coloque chaves privilegiadas no frontend ou no userscript.

Consulte [docs/architecture.md](docs/architecture.md) e [docs/supabase-integration.md](docs/supabase-integration.md) para as decisões técnicas.

## Identidade visual

O painel segue a família visual do TheLord_Aviator e do TheLord_Delay_2.0: fundo escuro, anel vermelho com brilho, dourado como destaque, menu inferior no celular e barra lateral recolhível no desktop. O ícone do app é o emblema dourado (`assets/emblema-capturecore.png`, com versões em `assets/icon-*.png` e `assets/favicon-*.png`) e o `manifest.webmanifest` permite instalar o painel na tela inicial. O logo do cabeçalho (visor com losango) está em `assets/logo.svg` e o script de interface (menu recolhível e item ativo) em `src/ui.js`; a lógica de captura em `src/app.js` não foi alterada.
