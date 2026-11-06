# Relatório de Início de Turno - Manutenção e Operação

Aplicação web independente (standalone) para preenchimento ágil de relatórios de início e passagem de turno, controle de frentes de manutenção preventiva e corretiva, e geração do arquivo oficial **.DOCX** idêntico ao modelo homologado da área.

🔗 **Acesse Online:** [https://accoutsssbm.github.io/relatorio-inicio-turno/](https://accoutsssbm.github.io/relatorio-inicio-turno/)

---

## 🎯 Principais Funcionalidades

1. **Geração Nativa de Arquivo Word (.DOCX)**
   - Gera um arquivo `.docx` formatado exatamente no padrão oficial da área (títulos, negritos, quebras de linha e emojis operacionais: 🔵, 🟡, 🔴, ⚠️).
   - Processamento 100% no navegador (funciona no celular e no computador, sem necessidade de enviar dados para servidores externos).

2. **Cópia Rápida para WhatsApp e Teams**
   - Botão para copiar o relatório completo já formatado com emojis e estrutura limpa, pronto para colar no grupo da operação com 1 toque.

3. **Painel Dinâmico de Frentes de Trabalho**
   - **🔵 Preventivas:** Adição/remoção de TAGs com atividades, equipe, tempo programado, data de parada e previsão de liberação.
   - **🟡 Corretivas:** Adição/remoção de TAGs com falha/sintoma, equipe, data de parada e previsão de liberação.
   - **👥 Ausentes:** Registro de colaboradores e motivos de afastamento (Férias, Exame Periódico, Ausência Justificada, etc.).
   - **⚠️ Pontos de Atenção:** Lista de gargalos e observações críticas para o turno.

4. **Pré-Visualização em Tempo Real e Rascunho Automático**
   - Acompanhamento ao vivo de como o relatório está ficando.
   - Salvamento automático no navegador (`localStorage`) para evitar perda de dados em caso de recarga acidental da página.
   - Botão de carregar exemplo com os dados de homologação da área.

5. **Pronto para Impressão / PDF**
   - Folha de estilo otimizada para impressão direta em folha A4.

---

## 💻 Estrutura do Projeto

- `index.html`: Estrutura do formulário e painel de prévia.
- `style.css`: Design responsivo, moderno e otimizado para dispositivos móveis.
- `app.js`: Lógica de gerenciamento de dados, formatação e geração do DOCX via biblioteca oficial.
- `vendor/`: Dependências locais para funcionamento offline/independente de CDN.

---

Desenvolvido para agilidade e padronização operacional de campo.