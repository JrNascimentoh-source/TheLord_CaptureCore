# Integração Supabase — inspeção inicial

**Projeto inspecionado:** `aypjaqmmlurlqeotbepp` (projeto Supabase existente).  
**Escopo:** inspeção do schema e ajuste posterior da política de inserção para manter apenas os jogos ativos.

## Schema observado

### `public.velas`
- `id`: bigint, chave primária.
- `game`: text, padrão `aviator`.
- `value`: numeric, check mínimo de 1.
- `created_at`: timestamptz, padrão `now()`.
- RLS habilitado.
- Índices observados: chave primária em `id` e índice `velas_created_idx` em `created_at DESC`.

Políticas observadas:
- INSERT para `public`, limitado a valores entre 1 e 1.000.000 e aos jogos `aviator`, `aviator2` e a chave histórica `betdopovo`.
- SELECT para `public`, com condição `true`.

### `public.gestoes`
- Dados JSONB por usuário, chave primária `user_id` e FK para `auth.users(id)`.
- RLS habilitado.
- Políticas de SELECT, INSERT e UPDATE limitadas ao usuário autenticado correspondente.

## Encaminhamento pelo CaptureCore

O painel CaptureCore valida o jogo informado pelo coletor contra o jogo cadastrado na instância e encaminha a vela para `public.velas` usando exclusivamente a chave canônica da instância: `aviator` para 7a7 e `aviator2` para BetDoPovo. Falhas de rede mantêm as velas em uma fila local para nova tentativa. O coletor não recebe nem utiliza chave `service_role`; o encaminhamento usa somente a chave pública já utilizada pelo app e a política RLS de INSERT existente.

O app TheLord_Aviator consulta somente as chaves `aviator`, `aviator2` e a chave histórica `betdopovo`. O normalizador mantém `betdopovo` compatível com `aviator2`, e cada linha é armazenada em sua coleção específica (`sharedRoundsByGame.aviator` ou `sharedRoundsByGame.aviator2`).

## Consequência para múltiplas telas

A tabela `velas` não contém `instance_id`, `screen_id` ou outra coluna de origem. Portanto, gravar duas telas que estejam no mesmo jogo nela não permite separar seus históricos com segurança. Filtrar por `game` separa as duas plataformas, mas não separa duas instâncias da mesma plataforma. O fluxo atual de integração compartilha o histórico por plataforma/jogo, não por tela individual. Se for necessário manter históricos independentes de duas telas do mesmo jogo, será necessário adicionar identidade de instância ao schema e definir autorização própria.

## Direção recomendada

Preservar o schema e o histórico de `public.velas`, mantendo a leitura pública e restringindo as novas inserções aos jogos ativos. Projetar armazenamento separado para o CaptureCore, por exemplo:

- Cadastro de instâncias com identificador estável, plataforma, jogo, nome da tela e estado.
- Registros capturados vinculados a `instance_id`, além de jogo, valor e timestamp.
- Índices compostos para consultas por instância e tempo.
- RLS e grants explícitos, definidos conforme o modelo real de autenticação e autorização do coletor.

Antes de criar tabelas ou políticas, ainda precisamos fechar como cada instância será autenticada. O userscript atual utiliza acesso público e não tem uma identidade de usuário confiável. Não devemos fingir que um UUID enviado pelo navegador é autenticação, nem expor uma chave `service_role`.

## Não fazer

- Não adicionar registros de várias telas à tabela `velas` atual sem isolamento por instância.
- A política de INSERT de `velas` foi ajustada para aceitar `aviator`, `aviator2` e a chave histórica `betdopovo`; a política de SELECT e a tabela `gestoes` permanecem inalteradas.
- Não executar o arquivo histórico `velas.sql` do repositório como migração do banco atual.
- Não colocar credenciais privilegiadas no frontend ou no userscript.

## Próxima decisão técnica

Definir se o CaptureCore terá autenticação de operador por conta Supabase e como o coletor receberá uma credencial de curta duração ou token individual revogável. Com essa decisão, será possível desenhar o schema e as políticas antes de qualquer DDL.
