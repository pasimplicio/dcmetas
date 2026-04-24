# Documento de Requisitos de Software (DRS) – FinVibe

## Sistema: FinVibe – Monitor de Variação de Arrecadação e Inadimplência

**Versão:** 1.0  
**Público-alvo:** Equipe de desenvolvimento "vibe coding"  
**Tecnologia Stack:** React 18 + Vite 5 + TailwindCSS v4 beta + Recharts + SQLite (better-sqlite3)

---

## 1. Objetivo do Sistema

Construir um painel analítico que rode no computador do usuário (sem necessidade de internet, exceto para carregar fontes) para ajudar gestores financeiros a detectar problemas de arrecadação e inadimplência. O sistema deve:

- Mostrar tendências mensais de pagamento e atraso
- Comparar meses atuais com meses do ano anterior
- Identificar meses atípicos (muito abaixo ou acima do esperado)
- Mostrar como os clientes estão pagando ao longo do tempo (curva de recebimento)
- Disparar alertas visuais (verde, amarelo, vermelho) baseados em desvios estatísticos

---

## 2. Escopo e Premissas

**O que o sistema vai fazer:**
- Importar dados de faturas via arquivo CSV ou inserção manual no banco de dados SQLite
- Calcular indicadores como arrecadação total, percentual de inadimplência, velocidade de recebimento
- Exibir 3 telas principais: painel resumo, comparador entre períodos e curva de pagamentos
- Permitir alternar entre tema claro e escuro
- Armazenar tudo localmente (não sobe dados para nuvem)

**O que o sistema NÃO vai fazer (nesta versão):**
- Controle de login ou múltiplos usuários
- Integração automática com sistemas de ERP ou bancos
- Exportação para PDF (pode vir depois)

---

## 3. Requisitos Funcionais

### RF-01: Cadastro de Faturas
O sistema deve permitir armazenar faturas com data de vencimento, data de pagamento, valor da fatura, valor pago e informações do cliente (segmento, região, forma de pagamento). Os dados ficam em uma tabela dentro do SQLite. Sempre que uma fatura é cadastrada ou atualizada, o sistema calcula quantos dias de atraso ela teve (se tiver sido paga) e classifica se foi paga em dia ou não.

### RF-02: Indicadores Calculados Mensalmente

| Indicador | Descrição | Forma de Exibição |
|-----------|-----------|-------------------|
| Arrecadação bruta mensal | Quanto dinheiro entrou no caixa naquele mês (faturas vencidas no período) | Gráfico de barras |
| Taxa de inadimplência | Percentual do valor total que NÃO foi pago até hoje | Gráfico de linha ou área |
| Percentual de pagamentos em dia | Quanto foi pago antes ou exatamente no vencimento | Card/KPI na tela |
| Carteira em aberto (envelhecimento) | Valores devidos por faixa de atraso: 0-30, 31-60, 61-90, 90+ dias | Gráfico de barras empilhadas |
| Velocidade de recebimento | Percentual recebido em 7, 15 e 30 dias após o vencimento | Gráfico de curva |

### RF-03: Comparação Temporal (YoY e Mês a Mês)
- O sistema deve calcular a variação percentual entre um mês e o mesmo mês do ano anterior
- Exibir essa variação em gráfico com barras verdes (crescimento) e vermelhas (queda)
- Permitir que o usuário escolha quais anos comparar através de menus suspensos

### RF-04: Detecção de Anomalias (Meses Atípicos)
O sistema deve analisar a série histórica de arrecadação (mês a mês) e separar três componentes:
- **Tendência** – direção geral (crescendo, estável ou caindo)
- **Sazonalidade** – padrões que se repetem todo ano (ex: janeiro sempre menor)
- **Resíduo** – o que sobra, representando o comportamento atípico

Calcular o "escore Z" do resíduo. Valores acima de 2 ou abaixo de -2 são considerados anomalias. Marcar esses meses nos gráficos com destaque visual.

### RF-05: Curva de Pagamentos
Para um mês escolhido pelo usuário, mostrar um gráfico de linha com o percentual acumulado recebido nos dias: vencimento (0), +7, +15, +30, +60 e +90 dias após o vencimento. Sobrepor a curva média dos últimos 12 meses (com faixa de sombra representando a variação normal). Se no dia 30 a arrecadação estiver 15% abaixo da média histórica, o sistema deve exibir um alerta.

### RF-06: Sistema de Alertas (Verde/Amarelo/Vermelho)

| Cor | Condição de Ativação | Ação do Sistema |
|-----|---------------------|-----------------|
| **Verde** | Variação YoY entre -5% e +5% E escore Z < 1,5 | Indicadores normais, sem alerta |
| **Amarelo** | Variação YoY entre -10% e -5% OU escore Z entre 1,5 e 2 | Ícone de atenção; tooltip explicativo |
| **Vermelho** | Variação YoY < -10% OU escore Z ≥ 2 | Banner destacado no topo; sugestão de ação |

### RF-07: Filtros por Segmento
O usuário deve poder filtrar todas as análises por:
- Cliente novo vs. cliente recorrente
- Faixa de valor da fatura (até R$500, R$500-R$2000, acima de R$2000)
- Forma de pagamento (boleto, cartão, débito automático)
- Região (se disponível nos dados)

Ao aplicar um filtro, todos os gráficos e indicadores devem atualizar instantaneamente.

### RF-08: Exportação de Dados
Em todas as telas que exibem tabelas, deve haver um botão "Exportar CSV" que baixa os dados exatamente como estão sendo visualizados (respeitando os filtros aplicados).

---

## 4. Estrutura do Banco de Dados

### Tabela Principal: faturas

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| id_fatura | TEXT | Identificador único da fatura (PK) | FAT-2025-00123 |
| id_cliente | TEXT | Código do cliente | CLT-987 |
| data_vencimento | DATE | Data de vencimento da fatura | 2025-03-10 |
| data_pagamento | DATE | Data de pagamento (pode ser nulo) | 2025-03-15 |
| valor_fatura | DECIMAL(10,2) | Valor original da fatura | 1500.00 |
| valor_pago | DECIMAL(10,2) | Valor efetivamente pago | 1500.00 |
| forma_pagamento | TEXT | Como o cliente pagou | boleto, cartao, debito |
| segmento_cliente | TEXT | Tipo de cliente | novo, recorrente |
| regiao | TEXT | Localização do cliente | sul, sudeste, nordeste |

**Índices recomendados:** `data_vencimento`, `id_cliente` (para performance em consultas)

### Visão Calculada: arrecadacao_mensal (tabela virtual)
A visão deve fornecer por mês de vencimento:
- Mês de referência (ex: "2025-03")
- Arrecadação total (soma dos valores pagos)
- Total faturado (soma dos valores das faturas)
- Quantidade de faturas
- Valor pago em dia
- Valor em aberto (não pago)

### Tabela de Parâmetros dos Alertas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| chave | TEXT (PK) | Identificador do parâmetro |
| valor | REAL | Valor numérico do limite |
| descricao | TEXT | Explicação do que o parâmetro controla |

**Exemplos de registros:**
- `limiar_amarelo_yoy` = -0,05 (YoY abaixo de -5% acende amarelo)
- `limiar_vermelho_yoy` = -0,10 (YoY abaixo de -10% acende vermelho)
- `limiar_zscore_amarelo` = 1,5
- `limiar_zscore_vermelho` = 2,0

### Tabela da Curva de Pagamentos de Referência

| Campo | Tipo | Descrição |
|-------|------|-----------|
| dias_apos_vencimento | INTEGER | Dias decorridos após o vencimento (0, 7, 15, 30, 60, 90) |
| percentual_acumulado_medio | REAL | Média histórica do percentual recebido |
| desvio_padrao | REAL | Variação considerada normal |

---

## 5. Telas do Sistema

### Tela 1: Painel Resumo (Dashboard)

**Componentes:**
- Quatro cards superiores: Arrecadação do mês atual, Inadimplência %, Carteira aberta total, Velocidade de recebimento (D+30)
- Gráfico principal: Barras da arrecadação dos últimos 24 meses + linha da inadimplência (eixo duplo)
- Gráfico secundário: Barras empilhadas da carteira em aberto por faixa de atraso (0-30, 31-60, 61-90, 90+ dias)
- Tabela de alertas: Últimos 3 meses com classificação verde/amarelo/vermelho

**Filtros:** Período (mês inicial/final), segmento (dropdown)

### Tela 2: Comparador Temporal

**Componentes:**
- Seletores: Mês de referência (ex: Março/2025) e Ano de comparação (ex: 2024)
- Gráfico de barras lado a lado comparando arrecadação mês a mês
- Heatmap (tabela colorida) mostrando variação percentual entre meses equivalentes
- Gráfico de resíduos com pontos anômalos destacados

**Botão especial:** "Recalcular anomalias" – força recálculo dos indicadores estatísticos

### Tela 3: Curva de Pagamentos

**Componentes:**
- Seletor de mês de competência (ex: 2025-03)
- Gráfico de linha com:
  - Linha sólida: curva real do mês selecionado
  - Linha tracejada: curva média histórica (últimos 12 meses)
  - Faixa sombreada: ±1 desvio padrão da média
- Alerta textual se desvio > 15% no D+30

### Tela 4: Detalhamento por Segmento (Modal)

Ao clicar em uma barra do gráfico no Dashboard, abre-se uma janela modal mostrando a mesma análise segmentada por:
- Cliente novo vs. recorrente
- Faixas de valor
- Formas de pagamento
- Regiões

---

## 6. Requisitos Não Funcionais

| Categoria | Requisito | Métrica |
|-----------|-----------|---------|
| **Desempenho** | Cálculo de indicadores para até 100k faturas | < 2 segundos |
| **Usabilidade** | Alternância tema claro/escuro | Instantânea, sem recarregar |
| **Usabilidade** | Layout responsivo | Funciona em 1366x768 e superiores |
| **Disponibilidade** | Funciona offline (exceto fontes na 1ª vez) | Fallback para fontes do sistema |
| **Manutenibilidade** | Código organizado por funcionalidade | Estrutura de pastas padronizada |
| **Armazenamento** | SQLite em modo WAL | Resistente a quedas/crashes |

---

## 7. Stack e Decisões Técnicas

### Frontend
- React 18 + Vite 5 (build rápida)
- React Router 6 (navegação entre telas)
- Gerenciamento de estado: Context API ou Zustand (para filtros globais)

### Estilização
- TailwindCSS v4 beta
- CSS Variables para temas claro/escuro (ex: `--bg-primary`, `--text-primary`)
- Alternância via classe `.dark` no elemento raiz

### Gráficos
- Recharts
- Componentes reutilizáveis: AreaChartCard, BarChartCard, LineChartCard

### Ícones
- Lucide React (AlertCircle, TrendingUp, TrendingDown, Sliders, etc.)

### Banco de Dados e Backend
- SQLite com `better-sqlite3`
- Modo WAL ativado
- **Arquitetura recomendada:** Electron (main process) + React (renderer) + better-sqlite3 → aplicação desktop local

### Fontes
- Google Fonts: Inter (corpo), Plus Jakarta Sans (títulos)
- Incluir no `index.html`

---

## 8. Algoritmos Explicados (Implementação)

### Detecção de Anomalias (STL Simplificada)

Como JavaScript não tem biblioteca pronta para decomposição sazonal, implementar versão simplificada:

1. **Tendência:** Média móvel centrada de 12 meses (6 meses antes + 5 meses depois, quando disponível)
2. **Sazonalidade:** Para cada mês do ano (jan-dez), calcular a média histórica de (valor_real - tendência)
3. **Resíduo:** `resíduo = valor_real - tendência - sazonalidade`
4. **Escore Z:** `z = (resíduo - média_resíduos) / desvio_padrão_resíduos`
5. **Classificação:**
   - |z| > 2 → alerta vermelho
   - 1,5 < |z| ≤ 2 → alerta amarelo

**Biblioteca útil:** `simple-statistics` (média, desvio padrão, etc.)

### Curva de Pagamento por Mês

Para faturas vencidas em um mês M:
1. Calcular para cada pagamento: `dias_atraso = data_pagamento - data_vencimento`
2. Ordenar por dias_atraso
3. Calcular soma acumulada dos valores pagos
4. Dividir pela soma total dos valores faturados no mês M
5. Extrair percentuais nos pontos: 0, 7, 15, 30, 60, 90 dias

---

## 9. Critérios de Aceitação

- [ ] Ao iniciar o sistema pela primeira vez, o banco é criado e preenchido com dados de exemplo (script seed)
- [ ] Navegação entre as telas funciona sem erros
- [ ] Dashboard exibe os 4 cards com valores coerentes
- [ ] Ao mudar o ano no comparador, o gráfico YoY atualiza corretamente
- [ ] Curva de pagamentos mostra linha real e linha média histórica para qualquer mês selecionado
- [ ] Alertas amarelos e vermelhos aparecem conforme as regras (testável com dados que forcem as condições)
- [ ] Alternância claro/escuro funciona sem piscar ou recarregar
- [ ] Código versionado no GitHub com README de setup

---

## 10. Instruções de Setup (para o README)

```bash
# Clone o repositório
git clone [url-do-repositorio]
cd finvibe

# Instale as dependências
npm install

# Execute o sistema (Electron + React)
npm run electron:dev

# Gere dados de exemplo
npm run seed

# Build de produção
npm run build