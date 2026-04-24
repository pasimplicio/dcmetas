# Planejamento de Refatoração Segura — DC Metas

## 1. Objetivo

Este planejamento define o que deve ser feito para melhorar a organização, segurança, manutenção e implantação do sistema atual sem quebrar o que já funciona.

A refatoração deve ser incremental, controlada e validada por etapas. O foco é preservar o comportamento atual do sistema e reduzir riscos técnicos.

---

## 2. Princípio obrigatório

Nenhuma alteração deve modificar regras de negócio, fluxos de tela, nomes de rotas, formato de respostas da API ou estrutura dos dados retornados sem validação prévia.

A refatoração deve melhorar a estrutura interna do projeto, não reinventar o sistema.

---

## 3. Escopo permitido

As alterações permitidas são:

- Organizar melhor o backend.
- Separar responsabilidades internas do servidor.
- Centralizar a configuração do banco SQLite.
- Preparar o banco para uso com caminho configurável.
- Melhorar a segurança de rotas administrativas.
- Centralizar chamadas HTTP do frontend.
- Preparar o projeto para execução com Docker.
- Preparar o projeto para publicação com domínio próprio.
- Garantir persistência do SQLite fora do container.
- Criar rotina de backup do banco.
- Atualizar documentação operacional do projeto.
- Criar critérios de validação manual após cada etapa.

---

## 4. Restrições obrigatórias

Durante esta refatoração, não deve ser feito:

- Reescrever o sistema do zero.
- Alterar layout visual.
- Trocar React, Vite, Tailwind, Recharts ou SQLite.
- Trocar SQLite por PostgreSQL.
- Criar autenticação completa com login e senha.
- Alterar nomes das rotas existentes.
- Alterar formato dos JSONs retornados pelas rotas atuais.
- Alterar regras de cálculo, filtros ou importação.
- Remover funcionalidades existentes.
- Misturar nova funcionalidade com refatoração.
- Colocar dados persistentes dentro do container sem volume.
- Expor token, senha ou configuração sensível no frontend.
- Subir banco real para o repositório.

---

## 5. Estado atual considerado

O sistema atual possui:

- Frontend em React com Vite.
- Rotas de interface para Dashboard, Cortes, OS Pendentes, Importação e Configurações.
- Backend em Express.
- Banco SQLite local.
- Rotas de API para dashboard, cortes, regionais, importação, OS pendentes e configurações.
- Arquivo principal do backend concentrando muitas responsabilidades.

Este planejamento assume que o sistema já funciona localmente e que a prioridade é preservar esse funcionamento.

---

## 6. Problemas que devem ser corrigidos

### 6.1 Backend concentrado demais

O servidor atual concentra responsabilidades demais em um único ponto.

Deve ser feito:

- Separar inicialização do servidor.
- Separar rotas.
- Separar serviços.
- Separar conexão com banco.
- Separar funções auxiliares.
- Manter o comportamento externo exatamente igual.

Resultado esperado:

- Backend mais fácil de manter.
- Menor risco ao alterar uma parte isolada.
- Organização compatível com evolução futura.

---

### 6.2 Banco SQLite com caminho frágil

O banco não deve depender de caminho fixo difícil de configurar em produção.

Deve ser feito:

- Definir caminho do banco por variável de ambiente.
- Manter um caminho padrão para desenvolvimento local.
- Garantir que o diretório do banco exista antes da conexão.
- Manter o SQLite em local persistente quando rodar com Docker.
- Preservar o banco existente durante a migração.

Resultado esperado:

- O sistema deve funcionar localmente e em produção sem alterar código.
- O banco não deve ser perdido em rebuild ou restart de container.

---

### 6.3 Rotas administrativas expostas

Rotas que importam, apagam ou alteram configuração não devem ficar abertas.

Deve ser feito:

- Identificar rotas administrativas.
- Proteger rotas de escrita e rotas destrutivas.
- Manter rotas de leitura funcionando sem mudança inicial.
- Usar configuração por variável de ambiente para proteção.
- Garantir que o frontend continue funcionando para leitura dos dados.

Resultado esperado:

- Acesso indevido a operações sensíveis deve ser bloqueado.
- O funcionamento operacional autorizado deve permanecer igual.

---

### 6.4 Chamadas HTTP espalhadas no frontend

As chamadas à API não devem ficar duplicadas ou espalhadas pelas páginas.

Deve ser feito:

- Criar uma camada única de comunicação com a API.
- Migrar chamadas gradualmente para essa camada.
- Manter os mesmos parâmetros, rotas e respostas.
- Preservar o comportamento atual das páginas.

Resultado esperado:

- Menos repetição.
- Melhor controle de erros.
- Facilidade para mudar base URL, headers ou autenticação no futuro.

---

### 6.5 Deploy sem separação clara

O projeto precisa estar preparado para execução previsível em produção.

Deve ser feito:

- Separar processo de build do frontend.
- Separar execução do backend.
- Usar proxy reverso para direcionar frontend e API.
- Garantir HTTPS no domínio.
- Garantir que rotas internas do React funcionem ao atualizar a página.
- Garantir que o SQLite esteja em volume persistente.

Resultado esperado:

- O sistema deve subir de forma padronizada.
- O domínio deve apontar para a aplicação.
- A API deve responder corretamente sob `/api`.
- O banco deve sobreviver a restart dos containers.

---

## 7. Plano de execução

## Fase 0 — Baseline funcional

Objetivo: registrar o funcionamento atual antes de qualquer alteração.

Deve ser feito:

- Rodar o sistema localmente.
- Registrar versão do Node.
- Registrar comandos usados para iniciar frontend e backend.
- Validar manualmente as telas principais.
- Validar manualmente as rotas principais da API.
- Registrar o resultado em documentação do projeto.

Validações mínimas:

- Dashboard carrega.
- Cortes carrega.
- OS Pendentes carrega.
- Importação abre.
- Configurações abre.
- API de dashboard responde.
- API de cortes responde.
- API de regionais responde.
- API de OS pendentes responde.
- Importação atual funciona no fluxo já existente.

Critério de conclusão:

- Existe um registro claro do comportamento atual.
- Qualquer alteração futura pode ser comparada com esse baseline.

---

## Fase 1 — Organização inicial de configuração

Objetivo: preparar o projeto para ambientes diferentes sem alterar comportamento.

Deve ser feito:

- Revisar variáveis de ambiente necessárias.
- Criar ou atualizar arquivo de exemplo de configuração.
- Garantir que arquivos sensíveis não sejam versionados.
- Definir variável para caminho do banco.
- Definir variável para origem permitida do frontend.
- Definir variável para proteção administrativa.
- Manter valores padrão adequados para desenvolvimento.

Critério de conclusão:

- O projeto roda localmente sem depender de configuração manual confusa.
- As configurações necessárias estão documentadas.
- Nenhum segredo real está versionado.

---

## Fase 2 — Ajuste seguro do SQLite

Objetivo: tornar o acesso ao banco previsível e seguro para Docker e produção.

Deve ser feito:

- Centralizar a conexão com SQLite.
- Usar caminho configurável para o banco.
- Garantir persistência do banco fora do container.
- Manter as configurações atuais que já funcionam.
- Adicionar configurações de segurança e integridade compatíveis com SQLite.
- Garantir que o banco atual não seja apagado ou sobrescrito.

Critério de conclusão:

- Sistema continua usando o mesmo banco.
- Sistema funciona com caminho padrão local.
- Sistema funciona com caminho definido por ambiente.
- Restart da aplicação não apaga dados.

---

## Fase 3 — Separação gradual do backend

Objetivo: reduzir o tamanho e a responsabilidade do arquivo principal do backend.

Deve ser feito:

- Separar rotas por domínio funcional.
- Separar consultas e regras em serviços.
- Separar inicialização do servidor.
- Separar camada de banco.
- Manter todos os endpoints existentes.
- Manter todos os formatos de resposta.
- Migrar uma área por vez.
- Testar cada área após migração.

Ordem sugerida:

1. Health check e configuração base.
2. Regionais.
3. Dashboard.
4. Cortes.
5. OS Pendentes.
6. Importação.
7. Configurações e datasource.
8. Operações administrativas.

Critério de conclusão:

- Backend fica modular.
- Nenhuma rota existente deixa de responder.
- Nenhum formato de JSON é alterado.
- Cada módulo pode ser entendido isoladamente.

---

## Fase 4 — Proteção de rotas administrativas

Objetivo: impedir operações sensíveis sem autorização.

Deve ser feito:

- Classificar rotas entre leitura e administração.
- Proteger rotas de importação.
- Proteger rotas de limpeza de dados.
- Proteger rotas de troca de datasource ou configuração sensível.
- Garantir mensagem clara quando a autorização falhar.
- Garantir que rotas públicas de leitura continuem funcionando.

Critério de conclusão:

- Operações administrativas exigem autorização.
- Leitura pública interna do dashboard continua funcionando.
- O fluxo autorizado continua igual.
- A aplicação não expõe ação destrutiva sem proteção.

---

## Fase 5 — Centralização das chamadas HTTP no frontend

Objetivo: melhorar manutenção sem alterar as telas.

Deve ser feito:

- Criar uma camada única para chamadas à API.
- Mover chamadas existentes gradualmente para essa camada.
- Manter os mesmos endpoints.
- Manter os mesmos parâmetros.
- Manter tratamento visual atual de carregamento e erro.
- Evitar mudança de layout durante essa etapa.

Ordem sugerida:

1. Regionais.
2. Dashboard.
3. Cortes.
4. OS Pendentes.
5. Importação.
6. Configurações.

Critério de conclusão:

- As páginas não dependem de chamadas HTTP duplicadas.
- A base da API pode ser ajustada em um ponto único.
- As telas continuam funcionando como antes.

---

## Fase 6 — Preparação para Docker

Objetivo: permitir execução padronizada do sistema.

Deve ser feito:

- Criar imagem separada para frontend.
- Criar imagem separada para backend.
- Garantir build estático do frontend.
- Garantir execução do backend em modo produção.
- Configurar volume persistente para SQLite.
- Configurar rede entre serviços.
- Configurar reinício automático dos serviços.
- Garantir que variáveis de ambiente sejam lidas corretamente.

Critério de conclusão:

- O sistema sobe com Docker.
- Frontend responde.
- API responde.
- Banco persiste após restart.
- Rebuild não apaga o banco.
- Ambiente local continua funcionando fora do Docker.

---

## Fase 7 — Proxy, domínio e HTTPS

Objetivo: preparar publicação no domínio `sistemaspsdev.com.br`.

Deve ser feito:

- Configurar proxy reverso.
- Direcionar `/api` para o backend.
- Direcionar demais rotas para o frontend.
- Garantir suporte a rotas do React em atualização de página.
- Configurar HTTPS automático.
- Configurar redirecionamento de `www` para domínio principal ou vice-versa.
- Validar DNS apontando para o servidor correto.

Critério de conclusão:

- O domínio abre o frontend.
- `/api/health` responde pelo domínio.
- HTTPS funciona.
- Rotas internas do React não retornam 404 ao atualizar.
- O domínio com `www` tem comportamento definido.

---

## Fase 8 — Backup do SQLite

Objetivo: reduzir risco de perda de dados.

Deve ser feito:

- Criar rotina de backup do banco.
- Salvar backups fora do arquivo principal.
- Definir retenção mínima.
- Registrar logs de execução.
- Testar restauração manual em ambiente separado.
- Documentar onde os backups ficam.

Critério de conclusão:

- Backup manual funciona.
- Backup agendado funciona.
- Existe retenção configurada.
- Existe procedimento básico de restauração.
- O banco principal não é corrompido durante backup.

---

## Fase 9 — Validação final

Objetivo: garantir que a refatoração não quebrou o sistema.

Deve ser feito:

- Reexecutar o baseline funcional.
- Testar localmente.
- Testar via Docker.
- Testar pelo domínio.
- Validar persistência do banco.
- Validar proteção administrativa.
- Validar importação autorizada.
- Validar telas principais.
- Validar exportações, se existirem.
- Registrar resultado final.

Critério de conclusão:

- Tudo que funcionava antes continua funcionando.
- O sistema está mais organizado.
- O banco está persistente.
- O deploy está documentado.
- As rotas sensíveis estão protegidas.
- O domínio está operacional.

---

## 8. Ordem recomendada de entrega

A sequência deve ser respeitada para reduzir risco:

1. Baseline funcional.
2. Configurações e variáveis de ambiente.
3. SQLite com caminho configurável.
4. Separação gradual do backend.
5. Proteção de rotas administrativas.
6. Centralização das chamadas HTTP.
7. Docker.
8. Proxy, domínio e HTTPS.
9. Backup.
10. Validação final.

Não avançar para a próxima fase se a fase atual quebrar comportamento existente.

---

## 9. Critérios gerais de aceite

A refatoração será aceita somente se:

- O sistema continuar rodando localmente.
- O sistema rodar com Docker.
- O frontend abrir corretamente.
- O backend responder corretamente.
- O banco SQLite persistir após restart.
- As telas principais continuarem funcionando.
- As rotas atuais continuarem respondendo.
- Os formatos de resposta da API forem preservados.
- As rotas administrativas estiverem protegidas.
- O domínio estiver funcionando com HTTPS.
- O backup do banco estiver implementado e testado.
- A documentação estiver atualizada.

---

## 10. Critérios de bloqueio

A entrega deve ser bloqueada se ocorrer qualquer item abaixo:

- Mudança de layout sem autorização.
- Mudança de regra de negócio sem autorização.
- Mudança de rota sem autorização.
- Mudança de formato de JSON sem autorização.
- Perda de dados no SQLite.
- Banco criado dentro do container sem persistência.
- Rotas destrutivas expostas sem proteção.
- `.env` real versionado.
- Token ou segredo no frontend.
- Sistema funcionando apenas na máquina do desenvolvedor.
- Docker quebrado.
- Domínio sem HTTPS.
- Rotas React quebrando ao atualizar a página.

---

## 11. Diretrizes para commits

Os commits devem ser pequenos, objetivos e reversíveis.

Cada commit deve representar uma alteração clara.

Sugestão de sequência:

1. Documentar baseline funcional.
2. Organizar arquivos de configuração.
3. Ajustar caminho configurável do SQLite.
4. Separar conexão do banco.
5. Separar primeira rota do backend.
6. Separar demais rotas gradualmente.
7. Separar serviços.
8. Proteger rotas administrativas.
9. Centralizar camada HTTP do frontend.
10. Adicionar Docker.
11. Adicionar proxy e domínio.
12. Adicionar backup.
13. Atualizar documentação final.

Evitar commits genéricos como:

- ajustes
- melhorias
- final
- correções gerais
- refatoração completa
- update

---

## 12. Documentação obrigatória

Ao final, o projeto deve ter documentação cobrindo:

- Como rodar localmente.
- Como rodar com Docker.
- Quais variáveis de ambiente são necessárias.
- Onde o banco SQLite fica.
- Como executar backup.
- Como restaurar backup.
- Como publicar no domínio.
- Como validar se o sistema está funcionando.
- Quais rotas são administrativas.
- Quais rotas são públicas de leitura.

---

## 13. Resultado esperado

Ao final do planejamento, o sistema deve continuar entregando as mesmas funcionalidades, porém com:

- Backend mais organizado.
- Menor risco de alteração.
- Banco SQLite persistente.
- Rotas sensíveis protegidas.
- Deploy mais previsível.
- Domínio funcionando com HTTPS.
- Backup operacional.
- Documentação mínima para manutenção.

O objetivo não é deixar o projeto mais complexo. O objetivo é deixar o projeto menos frágil.
