# Arquitetura inicial — TheLord_CaptureCore

## Objetivo
Centralizar múltiplas telas e instâncias de coletores sem acoplar o painel ao código específico de cada jogo. O CaptureCore é independente; o TheLord_Aviator permanece como consumidor dos dados e não será alterado por esta base.

## Componentes
- **Dashboard:** visão operacional das instâncias, status e atividade.
- **InstanceStore:** cadastro local e identidade individual de cada tela.
- **Platform Registry:** catálogo explícito de plataformas e jogos.
- **CollectorBridge:** contrato de mensagens entre coletor e painel.
- **Collector Adapter:** futura camada que traduz o Universal Collector para o protocolo do CaptureCore.
- **Supabase Adapter:** futura camada de persistência remota usando o projeto Supabase existente.

## Identidade e roteamento
Cada instância recebe um `id` próprio, além de `platformId`, `gameId`, `screenName` e `sourceUrl`. A identidade não deve depender apenas do hostname: várias telas podem abrir a mesma plataforma e jogo simultaneamente.

| Plataforma | Jogo na interface | Chave lógica |
|---|---|---|
| 7a7 | Aviator | `aviator` |
| BetDoPovo | Aviator | `aviator2` |
| BetDoPovo | Aviator VIP | `aviatorvip` |

O `gameId` é a chave de roteamento. O rótulo visual pode se repetir em plataformas diferentes sem misturar históricos.

## Estados
- `offline`: nenhum sinal recente conhecido.
- `connecting`: vínculo com coletor em andamento.
- `online`: heartbeat recente e válido associado ao `instanceId`.
- `error`: coletor ou transporte reportou falha.

A interface não marca uma instância online apenas porque foi cadastrada ou porque a página está aberta. O estado online depende de sinal real do coletor. A referência inicial de expiração é 120 segundos; a rotina de expiração ainda será implementada no runtime.

## Protocolo de eventos — versão 1
O bridge aceita mensagens `window.postMessage` da própria janela:

```js
{
  type: "THELORD_CAPTURECORE_EVENT",
  version: 1,
  instanceId: "id-da-instancia",
  kind: "heartbeat",
  data: null
}
```

O protocolo será ampliado para resultados de rodada, diagnóstico e reconexão. Antes de produção, o adaptador precisa validar origem, vínculo da instância e formato dos dados. Mensagens do navegador não são, por si só, uma fronteira de segurança.

## Persistência
A fundação atual salva somente as configurações em `localStorage` do navegador do painel. Isso é provisório e não sincroniza entre computadores.

A integração remota deverá reutilizar o Supabase existente, sem criar outro projeto ou alterar tabelas/políticas existentes nesta fase. Antes de qualquer SQL ou mudança de RLS, será necessário inspecionar o schema e as políticas reais. Nenhuma chave `service_role` ou segredo poderá estar no frontend.

## Próximas etapas
1. Adaptar o Universal Collector para receber identificador de instância e emitir heartbeat/eventos versionados.
2. Testar duas ou mais telas simultâneas, inclusive dois jogos iguais em telas diferentes.
3. Implementar o adaptador Supabase após confirmar modelo de dados e permissões existentes.
4. Adicionar persistência compartilhada das instâncias e reconciliação de status.
5. Adicionar telemetria, fila offline por instância e testes automatizados.

## Limitações desta fundação
- Não inicia nem injeta userscript automaticamente.
- Não envia velas ao Supabase.
- A configuração das instâncias é local ao navegador.
- Status online só será efetivo quando um coletor compatível emitir heartbeat.
- Ainda não há autenticação nem controle multiusuário.
