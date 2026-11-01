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

## Consequência para múltiplas telas

A tabela `velas` não contém `instance_id`, `screen_id` ou outra coluna de origem. Portanto, gravar duas telas que estejam no mesmo jogo nela não permite separar seus históricos com segurança. Filtrar apenas por `game` mistura as telas.

## Direção recomendada

Manter `public.velas` intacta nesta etapa e projetar armazenamento separado para o CaptureCore, por exemplo:

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
