# 📊 Simulador de Amortização Inteligente utilizando Pesquisa Operacional (n8n)

Este projeto é uma ferramenta avançada de apoio à decisão financeira, desenvolvida no **n8n**. Ele utiliza modelos matemáticos de **Engenharia de Custos** e **Estatística** para determinar a melhor estratégia entre amortizar dívidas ou investir em ativos atrelados à Selic.

## 🧠 Inteligência do Modelo

Diferente de calculadoras simples, este workflow implementa:

* **Simulação de Monte Carlo:** Executa 1.000 iterações utilizando a **Transformada de Box-Muller** para gerar distribuições normais de probabilidade. Isso permite prever a viabilidade da decisão frente à volatilidade futura da Selic e do IPCA.
* **Análise de VPL (Valor Presente Líquido):** Compara o custo de oportunidade do capital investido versus o custo efetivo do financiamento.
* **Análise de Spread Real:** Integração em tempo real com o **SGS (Sistema Gerenciador de Séries Temporais do Banco Central)** para obter as taxas Selic e IPCA mais recentes.
* **Módulos de Decisão:**
    * **Amortização:** Redução de prazo vs. Investimento líquido (IR regressivo incluso).
    * **LTV (Loan to Value):** Otimização da entrada para novos bens.
    * **Consórcio vs. Financiamento:** Comparação de Custo Efetivo Total (CET).

## 🛠️ Tecnologias e Ferramentas

* **n8n:** Orquestração de fluxos complexos.
* **JavaScript (Node.js):** Motor de cálculo estatístico e lógico.
* **API Banco Central (SGS):** Dados macroeconômicos em tempo real.
* **Google Sheets:** Persistência de dados para histórico e auditoria.
* **UI Dinâmica:** Interface de entrada e saída via n8n Forms e HTML customizado.

## 🚀 Como Utilizar

### Pré-requisitos
1.  Ter uma instância do **n8n** instalada.
2.  Possuir uma conta no **Google Cloud** com a API do Google Sheets ativa.
3.  Criar uma planilha no Google Sheets com as abas: `Amortizacao`, `LTV` e `Consorcio`.

### Instalação
1.  Faça o download do arquivo 'workflow_n8n_SAI.json' deste repositório.
2.  No n8n, vá em **Workflows** > **Import from File** e selecione o arquivo.
3.  **Configuração de Credenciais:**
    * Abra os nós do **Google Sheets** (nós de "Salvar").
    * Selecione sua credencial do Google.
    * No campo 'Document ID', selecione a sua planilha criada.
4.  No nó **Form Trigger**, clique em "Test Step" para gerar a URL do formulário.

## 📋 Estrutura de Saída

Ao finalizar a simulação, o sistema gera um relatório HTML com:
* **Veredito:** Decisão binária baseada em dados.
* **Grau de Confiança:** Porcentagem de cenários onde a decisão se mantém lucrativa.
* **Margem de Segurança:** O quanto a taxa Selic pode cair antes de a estratégia de investimento se tornar inválida.

---
**Nota:** Este software é uma ferramenta de simulação baseada em modelos matemáticos e não constitui recomendação de investimento.
