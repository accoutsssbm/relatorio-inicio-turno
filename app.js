/**
 * RELATÓRIO DE INÍCIO DE TURNO - APLICAÇÃO WEB
 * Gera documento .DOCX oficial idêntico ao modelo da área e texto para WhatsApp
 */

// Dados de exemplo baseados exatamente no documento original
const MODELO_PADRAO = {
  frota: "Transporte GP",
  turma: "A",
  supervisor: "Felipe Fontes",
  tecPrev: "Rocha",
  tecCorr: "Mário Barbosa",
  data: "29/10/2026",
  qtdPrev: 2,
  qtdCorr: 1,
  qtdAcid: 0,
  seguranca: "",
  escopoPrev: "GP / Perfuratriz / Escavação",
  preventivas: [
    {
      id: "prev_1",
      tag: "CM4050",
      atividades: "MP 500hs / Franzen / Analub / Automação / Subst. cuica / Suporte do reboque / Backlog`s (Linha 01)",
      equipe: "Fenelon, Guilherme, Carlos e Zé Maria",
      tempoProgramado: "36horas",
      dataParada: "29/10/26 23:00h",
      previsaoLiberacao: "30/10/26 15:00h"
    },
    {
      id: "prev_2",
      tag: "CM4054",
      atividades: "MP1000hs / Franzen / Analub / Backlog`s / Automação / Regulagem de válvulas / Backlogs (Linha 02)",
      equipe: "Samuel, Marcos, Djair e Joel",
      tempoProgramado: "48horas",
      dataParada: "29/10/26 23:00h",
      previsaoLiberacao: "30/10/26 15:00h"
    }
  ],
  corretivas: [
    {
      id: "corr_1",
      tag: "CM4119",
      falha: "Câmera frontal esquerda inoperante",
      equipe: "Pedro e Robson",
      dataParada: "29/10/26 15:55h",
      previsaoLiberacao: "Em diagnostico"
    }
  ],
  pontosAtencao: [
    { id: "pt_1", texto: "Sem comboio para abastecer CM4054 no Box" },
    { id: "pt_2", texto: "Sem caminhão Munck disponível" },
    { id: "pt_3", texto: "Sem empilhadeira" }
  ]
};

// Estado da Aplicação
let appState = JSON.parse(JSON.stringify(MODELO_PADRAO));

// Elementos DOM
const dom = {
  frota: document.getElementById('field-frota'),
  turma: document.getElementById('field-turma'),
  data: document.getElementById('field-data'),
  supervisor: document.getElementById('field-supervisor'),
  tecPrev: document.getElementById('field-tec-prev'),
  tecCorr: document.getElementById('field-tec-corr'),
  qtdPrev: document.getElementById('field-qtd-prev'),
  qtdCorr: document.getElementById('field-qtd-corr'),
  qtdAcid: document.getElementById('field-qtd-acid'),
  seguranca: document.getElementById('field-seguranca'),
  escopoPrev: document.getElementById('field-escopo-prev'),
  containerPreventivas: document.getElementById('container-preventivas'),
  containerCorretivas: document.getElementById('container-corretivas'),
  containerAtencao: document.getElementById('container-atencao'),
  previewText: document.getElementById('preview-text'),
  draftStatus: document.getElementById('draft-status'),
  copyToast: document.getElementById('copy-toast'),
  btnLoadSample: document.getElementById('btn-load-sample'),
  btnClearAll: document.getElementById('btn-clear-all'),
  btnAddPrev: document.getElementById('btn-add-prev'),
  btnAddCorr: document.getElementById('btn-add-corr'),
  btnAddAtencao: document.getElementById('btn-add-atencao'),
  btnDownloadDocx: document.getElementById('btn-download-docx'),
  btnCopyWhatsapp: document.getElementById('btn-copy-whatsapp'),
  btnPrintReport: document.getElementById('btn-print-report'),
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Carregar do localStorage se existir
  const saved = localStorage.getItem('relatorio_turno_draft');
  if (saved) {
    try {
      appState = JSON.parse(saved);
    } catch (e) {
      console.warn("Falha ao recuperar rascunho:", e);
      appState = JSON.parse(JSON.stringify(MODELO_PADRAO));
    }
  }

  // Preencher formulário
  syncStateToInputs();
  renderDynamicLists();
  updatePreview();
  bindEvents();
});

// ==========================================
// SINCRONIZAÇÃO DE ESTADO E INPUTS
// ==========================================
function syncStateToInputs() {
  dom.frota.value = appState.frota || '';
  dom.turma.value = appState.turma || '';
  dom.data.value = appState.data || '';
  dom.supervisor.value = appState.supervisor || '';
  dom.tecPrev.value = appState.tecPrev || '';
  dom.tecCorr.value = appState.tecCorr || '';
  dom.qtdPrev.value = appState.qtdPrev ?? appState.preventivas.length;
  dom.qtdCorr.value = appState.qtdCorr ?? appState.corretivas.length;
  dom.qtdAcid.value = appState.qtdAcid ?? 0;
  dom.seguranca.value = appState.seguranca || '';
  dom.escopoPrev.value = appState.escopoPrev || 'GP / Perfuratriz / Escavação';
}

function syncInputsToState() {
  appState.frota = dom.frota.value.trim();
  appState.turma = dom.turma.value.trim();
  appState.data = dom.data.value.trim();
  appState.supervisor = dom.supervisor.value.trim();
  appState.tecPrev = dom.tecPrev.value.trim();
  appState.tecCorr = dom.tecCorr.value.trim();
  appState.qtdPrev = parseInt(dom.qtdPrev.value, 10) || 0;
  appState.qtdCorr = parseInt(dom.qtdCorr.value, 10) || 0;
  appState.qtdAcid = parseInt(dom.qtdAcid.value, 10) || 0;
  appState.seguranca = dom.seguranca.value.trim();
  appState.escopoPrev = dom.escopoPrev.value.trim();

  saveDraft();
  updatePreview();
}

function saveDraft() {
  localStorage.setItem('relatorio_turno_draft', JSON.stringify(appState));
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR');
  if (dom.draftStatus) {
    dom.draftStatus.textContent = `💾 Rascunho salvo às ${timeStr}`;
  }
}

// ==========================================
// RENDERIZAÇÃO DAS LISTAS DINÂMICAS
// ==========================================
function renderDynamicLists() {
  renderPreventivas();
  renderCorretivas();
  renderAtencao();
}

// Preserva rascunhos antigos que armazenavam toda a equipe em um único campo.
function getPreventivaEquipeCampos(item) {
  if (Array.isArray(item.equipeCampos)) {
    return Array.from({ length: 5 }, (_, i) => String(item.equipeCampos[i] || ''));
  }
  const antigos = String(item.equipe || '')
    .split(/,\s*|\s+e\s+/i)
    .map(nome => nome.trim())
    .filter(Boolean);
  return Array.from({ length: 5 }, (_, i) =>
    i === 4 ? antigos.slice(4).join(', ') : (antigos[i] || '')
  );
}

function getPreventivaEquipeTexto(item) {
  return Array.isArray(item.equipeCampos)
    ? item.equipeCampos.map(nome => String(nome || '').trim()).filter(Boolean).join(', ')
    : (item.equipe || '');
}

// 1. Preventivas
function renderPreventivas() {
  dom.containerPreventivas.innerHTML = '';
  appState.preventivas.forEach((item, index) => {
    const card = document.createElement('div');
    const equipeCampos = getPreventivaEquipeCampos(item);
    card.className = 'item-card card-prev';
    card.innerHTML = `
      <div class="item-header">
        <span class="item-tag-title">🔵 Item #${index + 1} - ${item.tag || 'Novo TAG'}</span>
        <button type="button" class="btn-remove-item" title="Remover este equipamento" onclick="removePreventiva('${item.id}')">✕</button>
      </div>
      <div class="grid grid-2 mb-2">
        <div class="form-group">
          <label>TAG</label>
          <input type="text" value="${escapeHtml(item.tag)}" placeholder="Ex: CM4050" oninput="updatePreventivaField('${item.id}', 'tag', this.value)">
        </div>
        <div class="form-group">
          <label>Tempo Programado</label>
          <input type="text" value="${escapeHtml(item.tempoProgramado)}" placeholder="Ex: 36horas" oninput="updatePreventivaField('${item.id}', 'tempoProgramado', this.value)">
        </div>
      </div>
      <div class="form-group mb-2">
        <label>Atividades</label>
        <input type="text" value="${escapeHtml(item.atividades)}" placeholder="Ex: MP 500hs / Franzen / Analub..." oninput="updatePreventivaField('${item.id}', 'atividades', this.value)">
      </div>
      <div class="form-group mb-2">
        <label>Equipe</label>
        <div class="grid grid-2">
          ${equipeCampos.map((nome, pos) => `
            <div class="form-group">
              <label for="prev-equipe-${item.id}-${pos}">Integrante ${pos + 1}</label>
              <input id="prev-equipe-${item.id}-${pos}" type="text" value="${escapeHtml(nome)}" placeholder="Nome" oninput="updatePreventivaEquipe('${item.id}', ${pos}, this.value)">
            </div>
          `).join('')}
        </div>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Data da Parada</label>
          <input type="text" value="${escapeHtml(item.dataParada)}" placeholder="Ex: 29/10/26 23:00h" oninput="updatePreventivaField('${item.id}', 'dataParada', this.value)">
        </div>
        <div class="form-group">
          <label>Previsão Liberação</label>
          <input type="text" value="${escapeHtml(item.previsaoLiberacao)}" placeholder="Ex: 30/10/26 15:00h" oninput="updatePreventivaField('${item.id}', 'previsaoLiberacao', this.value)">
        </div>
      </div>
    `;
    dom.containerPreventivas.appendChild(card);
  });
}

// 2. Corretivas
function renderCorretivas() {
  dom.containerCorretivas.innerHTML = '';
  appState.corretivas.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-card card-corr';
    card.innerHTML = `
      <div class="item-header">
        <span class="item-tag-title">🟡 Item #${index + 1} - ${item.tag || 'Novo TAG'}</span>
        <button type="button" class="btn-remove-item" title="Remover este equipamento" onclick="removeCorretiva('${item.id}')">✕</button>
      </div>
      <div class="grid grid-2 mb-2">
        <div class="form-group">
          <label>TAG</label>
          <input type="text" value="${escapeHtml(item.tag)}" placeholder="Ex: CM4119" oninput="updateCorretivaField('${item.id}', 'tag', this.value)">
        </div>
        <div class="form-group">
          <label>Equipe</label>
          <input type="text" value="${escapeHtml(item.equipe)}" placeholder="Ex: Pedro e Robson" oninput="updateCorretivaField('${item.id}', 'equipe', this.value)">
        </div>
      </div>
      <div class="form-group mb-2">
        <label>Falha / Sintoma</label>
        <input type="text" value="${escapeHtml(item.falha)}" placeholder="Ex: Câmera frontal esquerda inoperante" oninput="updateCorretivaField('${item.id}', 'falha', this.value)">
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Data da Parada</label>
          <input type="text" value="${escapeHtml(item.dataParada)}" placeholder="Ex: 29/10/26 15:55h" oninput="updateCorretivaField('${item.id}', 'dataParada', this.value)">
        </div>
        <div class="form-group">
          <label>Previsão Liberação</label>
          <input type="text" value="${escapeHtml(item.previsaoLiberacao)}" placeholder="Ex: Em diagnostico ou data/hora" oninput="updateCorretivaField('${item.id}', 'previsaoLiberacao', this.value)">
        </div>
      </div>
    `;
    dom.containerCorretivas.appendChild(card);
  });
}

// 3. Pontos de Atenção
function renderAtencao() {
  dom.containerAtencao.innerHTML = '';
  appState.pontosAtencao.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'item-card mb-2';
    row.style.padding = '10px 14px';
    row.innerHTML = `
      <div style="display: flex; gap: 10px; align-items: center;">
        <span style="font-weight: 700; color: #64748b; font-size: 13px;">${index + 1}.</span>
        <input type="text" value="${escapeHtml(item.texto)}" style="flex: 1;" placeholder="Ex: Sem munck disponível..." oninput="updateAtencaoField('${item.id}', this.value)">
        <button type="button" class="btn-remove-item" title="Remover" onclick="removeAtencao('${item.id}')">✕</button>
      </div>
    `;
    dom.containerAtencao.appendChild(row);
  });
}

// ==========================================
// FUNÇÕES DE MANIPULAÇÃO DINÂMICA
// ==========================================
window.updatePreventivaEquipe = function(id, pos, value) {
  const item = appState.preventivas.find(p => p.id === id);
  if (!item || pos < 0 || pos > 4) return;
  item.equipeCampos = getPreventivaEquipeCampos(item);
  item.equipeCampos[pos] = value;
  item.equipe = getPreventivaEquipeTexto(item);
  saveDraft();
  updatePreview();
};

window.updatePreventivaField = function(id, field, value) {
  const item = appState.preventivas.find(p => p.id === id);
  if (item) {
    item[field] = value;
    saveDraft();
    updatePreview();
  }
};

window.removePreventiva = function(id) {
  appState.preventivas = appState.preventivas.filter(p => p.id !== id);
  dom.qtdPrev.value = appState.preventivas.length;
  appState.qtdPrev = appState.preventivas.length;
  renderPreventivas();
  saveDraft();
  updatePreview();
};

window.updateCorretivaField = function(id, field, value) {
  const item = appState.corretivas.find(c => c.id === id);
  if (item) {
    item[field] = value;
    saveDraft();
    updatePreview();
  }
};

window.removeCorretiva = function(id) {
  appState.corretivas = appState.corretivas.filter(c => c.id !== id);
  dom.qtdCorr.value = appState.corretivas.length;
  appState.qtdCorr = appState.corretivas.length;
  renderCorretivas();
  saveDraft();
  updatePreview();
};

window.updateAtencaoField = function(id, value) {
  const item = appState.pontosAtencao.find(pt => pt.id === id);
  if (item) {
    item.texto = value;
    saveDraft();
    updatePreview();
  }
};

window.removeAtencao = function(id) {
  appState.pontosAtencao = appState.pontosAtencao.filter(pt => pt.id !== id);
  renderAtencao();
  saveDraft();
  updatePreview();
};

// ==========================================
// BIND DE EVENTOS
// ==========================================
function bindEvents() {
  const inputsToListen = [
    dom.frota, dom.turma, dom.data, dom.supervisor,
    dom.tecPrev, dom.tecCorr, dom.qtdPrev, dom.qtdCorr,
    dom.qtdAcid, dom.seguranca, dom.escopoPrev
  ];

  inputsToListen.forEach(input => {
    if (input) {
      input.addEventListener('input', syncInputsToState);
    }
  });

  // Botões de adição
  dom.btnAddPrev.addEventListener('click', () => {
    const newId = 'prev_' + Date.now();
    appState.preventivas.push({
      id: newId,
      tag: "",
      atividades: "",
      equipe: "",
      equipeCampos: ["", "", "", "", ""],
      tempoProgramado: "",
      dataParada: "",
      previsaoLiberacao: ""
    });
    dom.qtdPrev.value = appState.preventivas.length;
    appState.qtdPrev = appState.preventivas.length;
    renderPreventivas();
    saveDraft();
    updatePreview();
  });

  dom.btnAddCorr.addEventListener('click', () => {
    const newId = 'corr_' + Date.now();
    appState.corretivas.push({
      id: newId,
      tag: "",
      falha: "",
      equipe: "",
      dataParada: "",
      previsaoLiberacao: ""
    });
    dom.qtdCorr.value = appState.corretivas.length;
    appState.qtdCorr = appState.corretivas.length;
    renderCorretivas();
    saveDraft();
    updatePreview();
  });

  dom.btnAddAtencao.addEventListener('click', () => {
    const newId = 'pt_' + Date.now();
    appState.pontosAtencao.push({
      id: newId,
      texto: ""
    });
    renderAtencao();
    saveDraft();
    updatePreview();
  });

  // Botão carregar modelo de exemplo
  dom.btnLoadSample.addEventListener('click', () => {
    if (confirm("Deseja preencher com os dados do modelo padrão de início de turno?")) {
      appState = JSON.parse(JSON.stringify(MODELO_PADRAO));
      syncStateToInputs();
      renderDynamicLists();
      saveDraft();
      updatePreview();
    }
  });

  // Botão limpar
  dom.btnClearAll.addEventListener('click', () => {
    if (confirm("Tem certeza que deseja limpar todos os campos do formulário?")) {
      appState = {
        frota: "",
        turma: "",
        supervisor: "",
        tecPrev: "",
        tecCorr: "",
        data: new Date().toLocaleDateString('pt-BR'),
        qtdPrev: 0,
        qtdCorr: 0,
        qtdAcid: 0,
        seguranca: "",
        escopoPrev: "",
        preventivas: [],
        corretivas: [],
        pontosAtencao: []
      };
      syncStateToInputs();
      renderDynamicLists();
      saveDraft();
      updatePreview();
    }
  });

  // Botão Copiar WhatsApp
  dom.btnCopyWhatsapp.addEventListener('click', copyFormattedText);

  // Botão Download DOCX
  dom.btnDownloadDocx.addEventListener('click', generateDocx);

  // Botão Imprimir
  dom.btnPrintReport.addEventListener('click', () => {
    window.print();
  });
}

// ==========================================
// GERAÇÃO DO TEXTO E PRÉVIA
// ==========================================
function buildFormattedText() {
  const pad2 = (n) => String(n).padStart(2, '0');
  const lines = [];

  lines.push(`Relatório de início de turno`);
  lines.push(`Frota: ${appState.frota}`);
  lines.push(`Turma: ${appState.turma}`);
  lines.push(`Supervisor: ${appState.supervisor}`);
  lines.push(`Técnico Preventiva: ${appState.tecPrev}`);
  lines.push(`Técnico Corretiva: ${appState.tecCorr}`);
  lines.push(`Data: ${appState.data}`);
  lines.push(``);
  lines.push(`🔵 Preventiva: ${pad2(appState.qtdPrev)}`);
  lines.push(`🟡 Corretiva: ${pad2(appState.qtdCorr)}`);
  lines.push(`🔴 Acidente: ${pad2(appState.qtdAcid)}`);
  lines.push(``);
  lines.push(`⚠️Segurança/Meio Ambiente: ${appState.seguranca}`);
  lines.push(``);
  lines.push(`🔵Equipamento em Manutenção Preventiva: ${appState.escopoPrev}`);
  lines.push(``);

  if (appState.preventivas && appState.preventivas.length > 0) {
    appState.preventivas.forEach(p => {
      lines.push(`TAG: ${p.tag}`);
      lines.push(`Atividades: ${p.atividades}`);
      lines.push(`Equipe: ${getPreventivaEquipeTexto(p)}`);
      lines.push(`Tempo programado: ${p.tempoProgramado}`);
      lines.push(`Data da Parada: ${p.dataParada}`);
      lines.push(`Previsão Liberação: ${p.previsaoLiberacao}`);
      lines.push(``);
    });
  }

  lines.push(`🟡Equipamentos em Corretiva:`);
  lines.push(``);

  if (appState.corretivas && appState.corretivas.length > 0) {
    appState.corretivas.forEach(c => {
      lines.push(`TAG: ${c.tag}`);
      lines.push(`Falha: ${c.falha}`);
      lines.push(`Equipe: ${c.equipe}`);
      lines.push(`Data da Parada: ${c.dataParada}`);
      lines.push(`Previsão Liberação: ${c.previsaoLiberacao}`);
      lines.push(``);
    });
  }

  lines.push(`Pontos de atenção:`);
  lines.push(``);
  if (appState.pontosAtencao && appState.pontosAtencao.length > 0) {
    appState.pontosAtencao.forEach(pt => {
      lines.push(pt.texto);
    });
  }

  return lines.join('\n');
}

function updatePreview() {
  const text = buildFormattedText();
  if (dom.previewText) {
    dom.previewText.textContent = text;
  }
}

function copyFormattedText() {
  const text = buildFormattedText();
  navigator.clipboard.writeText(text).then(() => {
    dom.copyToast.classList.remove('hidden');
    setTimeout(() => {
      dom.copyToast.classList.add('hidden');
    }, 3000);
  }).catch(err => {
    alert("Texto selecionado para cópia. Use Ctrl+C para copiar.");
  });
}

// ==========================================
// GERAÇÃO DO ARQUIVO DOCX NATIVO
// ==========================================
async function generateDocx() {
  if (!window.docx) {
    alert("A biblioteca de geração DOCX ainda está carregando ou não pôde ser iniciada.");
    return;
  }

  const { Document, Paragraph, TextRun, Packer } = window.docx;
  const pad2 = (n) => String(n).padStart(2, '0');

  const children = [];

  // Helper para criar parágrafo chave-valor padrão
  function makeKvParagraph(key, val) {
    return new Paragraph({
      children: [
        new TextRun({ text: key, bold: true, size: 22, font: "Calibri" }),
        new TextRun({ text: val ? " " + val : "", bold: false, size: 22, font: "Calibri" })
      ],
      spacing: { after: 120 }
    });
  }

  // Helper para parágrafo vazio
  function makeBlankParagraph() {
    return new Paragraph({
      children: [],
      spacing: { after: 120 }
    });
  }

  // 1. Título
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "Relatório de início de turno", bold: true, size: 22, font: "Calibri" })
    ],
    spacing: { after: 140 }
  }));

  // 2. Cabeçalho Geral
  children.push(makeKvParagraph("Frota:", appState.frota));
  children.push(makeKvParagraph("Turma:", appState.turma));
  children.push(makeKvParagraph("Supervisor:", appState.supervisor));
  children.push(makeKvParagraph("Técnico Preventiva:", appState.tecPrev));
  children.push(makeKvParagraph("Técnico Corretiva:", appState.tecCorr));
  children.push(makeKvParagraph("Data:", appState.data));

  children.push(makeBlankParagraph());

  // 3. Indicadores Operacionais
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "🔵  ", size: 22, font: "Calibri" }),
      new TextRun({ text: "Preventiva: ", bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: pad2(appState.qtdPrev), size: 22, font: "Calibri" })
    ],
    spacing: { after: 100 }
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: "🟡  ", size: 22, font: "Calibri" }),
      new TextRun({ text: "Corretiva: ", bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: pad2(appState.qtdCorr), size: 22, font: "Calibri" })
    ],
    spacing: { after: 100 }
  }));

  children.push(new Paragraph({
    children: [
      new TextRun({ text: "🔴  ", size: 22, font: "Calibri" }),
      new TextRun({ text: "Acidente: ", bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: pad2(appState.qtdAcid), size: 22, font: "Calibri" })
    ],
    spacing: { after: 100 }
  }));

  children.push(makeBlankParagraph());

  // 4. Segurança / Meio Ambiente
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "⚠️Segurança/Meio Ambiente: ", bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: appState.seguranca ? " " + appState.seguranca : "", size: 22, font: "Calibri" })
    ],
    spacing: { after: 120 }
  }));

  children.push(makeBlankParagraph());

  // 5. Preventivas
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "🔵Equipamento em Manutenção Preventiva: ", bold: true, size: 22, font: "Calibri" }),
      new TextRun({ text: appState.escopoPrev ? " " + appState.escopoPrev : "", size: 22, font: "Calibri" })
    ],
    spacing: { after: 120 }
  }));

  children.push(makeBlankParagraph());

  if (appState.preventivas && appState.preventivas.length > 0) {
    appState.preventivas.forEach(p => {
      children.push(makeKvParagraph("TAG:", p.tag));
      children.push(makeKvParagraph("Atividades:", p.atividades));
      children.push(makeKvParagraph("Equipe:", getPreventivaEquipeTexto(p)));
      children.push(makeKvParagraph("Tempo programado:", p.tempoProgramado));
      children.push(makeKvParagraph("Data da Parada:", p.dataParada));
      children.push(makeKvParagraph("Previsão Liberação:", p.previsaoLiberacao));
      children.push(makeBlankParagraph());
    });
  }

  // 6. Corretivas
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "🟡Equipamentos em Corretiva:", bold: true, size: 22, font: "Calibri" })
    ],
    spacing: { after: 120 }
  }));

  children.push(makeBlankParagraph());

  if (appState.corretivas && appState.corretivas.length > 0) {
    appState.corretivas.forEach(c => {
      children.push(makeKvParagraph("TAG:", c.tag));
      children.push(makeKvParagraph("Falha:", c.falha));
      children.push(makeKvParagraph("Equipe:", c.equipe));
      children.push(makeKvParagraph("Data da Parada:", c.dataParada));
      children.push(makeKvParagraph("Previsão Liberação:", c.previsaoLiberacao));
      children.push(makeBlankParagraph());
    });
  }

  // 7. Pontos de Atenção
  children.push(new Paragraph({
    children: [
      new TextRun({ text: "Pontos de atenção:", bold: true, size: 22, font: "Calibri" })
    ],
    spacing: { after: 120 }
  }));

  children.push(makeBlankParagraph());

  if (appState.pontosAtencao && appState.pontosAtencao.length > 0) {
    appState.pontosAtencao.forEach(pt => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: pt.texto, size: 22, font: "Calibri" })
        ],
        spacing: { after: 80 }
      }));
    });
  }

  // Criar documento Word
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  try {
    const originalText = dom.btnDownloadDocx.innerHTML;
    dom.btnDownloadDocx.innerHTML = "⏳ Gerando arquivo Word...";
    dom.btnDownloadDocx.disabled = true;

    const blob = await Packer.toBlob(doc);
    const safeTurma = (appState.turma || "Turno").replace(/[^a-zA-Z0-9]/g, '');
    const safeData = (appState.data || "data").replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `Relatorio_Inicio_Turno_${safeTurma}_${safeData}.docx`;

    window.saveAs(blob, filename);

    dom.btnDownloadDocx.innerHTML = originalText;
    dom.btnDownloadDocx.disabled = false;
  } catch (err) {
    console.error("Erro ao gerar DOCX:", err);
    alert("Houve um erro ao gerar o arquivo DOCX. Detalhes no console.");
    dom.btnDownloadDocx.innerHTML = "📄 Baixar Arquivo (.DOCX)";
    dom.btnDownloadDocx.disabled = false;
  }
}

// Helper para escapar strings HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}