# TheLord_CaptureCore

Sistema independente de captura, gerenciamento e monitoramento de múltiplas telas e coletores.

> Fundação inicial em desenvolvimento. Esta versão organiza instâncias localmente e prepara o contrato de comunicação com coletores. Ainda não é uma versão de produção e não envia resultados ao Supabase.

## Objetivo
Gerenciar várias telas simultaneamente, mantendo cada instância isolada por plataforma, jogo e origem. O CaptureCore deverá coordenar o Universal Collector e encaminhar os dados ao Supabase existente, preservando o histórico separado de cada jogo.

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
src/
  app.js
  core/
    instance-store.js
    platform-registry.js
  adapters/
    collector-bridge.js
docs/
  architecture.md
```

## Executar localmente
Como o projeto usa módulos JavaScript, sirva os arquivos por um servidor HTTP local. Por exemplo, com Node.js:

```bash
npx serve .
```

Depois abra o endereço local informado pelo servidor.

## Estado atual
- [x] Repositório independente criado.
- [x] Base visual escura com dourado e vermelho.
- [x] Cadastro local de instâncias por tela.
- [x] Mapeamento explícito das três combinações plataforma/jogo.
- [x] Identificador individual por instância.
- [x] Contrato inicial de heartbeat.
- [x] Testes automatizados para o catálogo de plataformas e jogos.
- [ ] Adaptador do Universal Collector (próxima etapa).
- [ ] Teste real com múltiplas telas.
- [ ] Adaptador de persistência para o Supabase existente.
- [ ] Autenticação e sincronização multiusuário.

## Segurança e dados
Nenhuma chave secreta deve ser incluída no frontend. A integração com o Supabase existente será implementada somente após inspeção do schema, políticas RLS e fluxo atual de gravação. Não execute scripts SQL antigos deste projeto como se fossem o schema atual.

Consulte [docs/architecture.md](docs/architecture.md) para detalhes e decisões técnicas e [docs/supabase-integration.md](docs/supabase-integration.md) para o schema real inspecionado e os requisitos de isolamento por instância.
