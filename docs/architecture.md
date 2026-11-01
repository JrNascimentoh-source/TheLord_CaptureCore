# Arquitetura — TheLord_CaptureCore

## Objetivo
Centralizar múltiplas telas e instâncias de coletores sem acoplar o painel ao código específico de cada jogo. O CaptureCore é independente; o TheLord_Aviator permanece como consumidor dos dados e não será alterado por esta implementação.

## Componentes
- **Dashboard:** visão operacional das instâncias, status, última vela e atividade.
- **InstanceStore:** cadastro e resumo local individual por tela.
- **Platform Registry:** catálogo explícito de plataformas e jogos.
- **CollectorBridge:** recebe mensagens e valida se a origem é a janela aberta para aquela instância.
- **Universal Collector:** userscript separado que identifica jogo e envia heartbeat/resultados para a janela do painel que o abriu.
- **Supabase Adapter:** ainda não implementado; será responsável pela persistência compartilhada com isolamento por instância.

## Identidade e roteamento
Cada instância recebe um `id` próprio, além de `platformId`, `gameId`, `screenName` e `sourceUrl`. A identidade não depende apenas do hostname: várias telas podem abrir a mesma plataforma e jogo simultaneamente.

| Plataforma | Jogo na interface | Chave lógica |
|---|---|---|
| 7a7 | Aviator | `aviator` |
| BetDoPovo | Aviator | `aviator2` |

## Fluxo de captura nesta etapa
1. O usuário cadastra uma instância no dashboard.
2. Ao clicar em **Abrir jogo e coletar**, o painel abre a URL em uma nova janela, acrescentando `_capturecore_instance` e `_capturecore_origin`.
4. O jogo pode ser aberto em iframe quando a plataforma permite incorporação; se a plataforma bloquear iframe, o painel oferece abertura em janela externa vinculada. No modo iframe, os frames encaminham eventos ao frame superior e este ao painel por `window.parent.postMessage`; no modo janela externa, o coletor usa `window.opener.postMessage`. Ambos validam o origin exato do dashboard.
4. O bridge só aceita eventos se `event.source` for exatamente a janela que o próprio painel registrou para aquele `instanceId`.
5. Heartbeats atualizam Online/Off-line; eventos `round` atualizam o último resultado e o contador local daquela instância.

## Estados
- `offline`: nenhum sinal recente conhecido.
- `connecting`: a janela do jogo foi aberta; ainda não chegou heartbeat.
- `online`: heartbeat ou resultado recente e válido.
- `error`: reservado para falha reportada pelo adaptador.

O status expira após 120 segundos sem sinal. Abrir uma URL não significa que o coletor esteja ativo.

## Protocolo de eventos — versão 1
```js
{
  type: "THELORD_CAPTURECORE_EVENT",
  version: 1,
  instanceId: "id-da-instancia",
  kind: "heartbeat" | "round",
  data: { game: "aviator", value: 2.4, detectedAt: "ISO-8601" }
}
```

O bridge aceita apenas os tipos `heartbeat` e `round`, exige uma instância registrada e compara a referência da janela de origem. O origin de destino do userscript é fixo para o GitHub Pages do CaptureCore. Isso reduz mensagens cruzadas entre janelas, mas não substitui autenticação no servidor. O painel registra a referência da janela/iframe vinculada à instância e aceita somente mensagens dessa origem.

## Persistência
A configuração das instâncias e os resumos de última vela/contagem ficam no `localStorage` do navegador do painel. Essa camada é provisória e não sincroniza entre computadores. A relação entre janela de abertura e janela de jogo também é mantida em memória; recarregar o dashboard exige abrir novamente os jogos para reestabelecer o vínculo.

## Supabase
A tabela atual `public.velas` não possui `instance_id`/ `screen_id`; gravar várias telas nela misturaria históricos. Não gravamos nessa tabela nesta etapa. O projeto deve reutilizar o Supabase existente após definir autenticação e persistência própria por instância. Não expor `service_role` nem tratar UUID enviado pelo navegador como credencial confiável.

## Limitações e testes pendentes
- O navegador ou o site pode isolar a janela aberta (por exemplo, políticas COOP) e remover `window.opener`; o fluxo precisa ser validado em Firefox/Tampermonkey e nas plataformas reais.
- A leitura dos resultados depende dos seletores/estrutura DOM do jogo e precisa de teste real.
- O status e o resumo são locais ao navegador do painel.
- Ainda não há sincronização multiusuário, fila offline remota ou envio de resultados ao Supabase.
- O Universal Collector desta aplicação é um arquivo independente; não altera nem substitui o coletor instalado no TheLord_Aviator.

## Publicação
O workflow `.github/workflows/pages.yml` executa os testes e publica o site no GitHub Pages quando alterações chegam à `main`. O endereço previsto é `https://jrnascimentoh-source.github.io/TheLord_CaptureCore/`.
