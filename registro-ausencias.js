/* Registro de ausências: armazenamento local e independente dos relatórios. */
(function () {
  "use strict";
  const root = document.getElementById("panel-ausencias");
  if (!root) return;

  const KEY = "registro_ausencias_v1";
  const form = document.getElementById("ausencias-form");
  const list = document.getElementById("ausencias-lista");
  const count = document.getElementById("ausencias-contador");
  const message = document.getElementById("ausencias-mensagem");
  const submit = document.getElementById("ausencias-salvar");
  const cancel = document.getElementById("ausencias-cancelar");
  const exportButton = document.getElementById("ausencias-exportar-pdf");
  const fields = {
    nome: document.getElementById("ausencia-nome"),
    supervisor: document.getElementById("ausencia-supervisor"),
    frota: document.getElementById("ausencia-frota"),
    turma: document.getElementById("ausencia-turma"),
    data: document.getElementById("ausencia-data"),
    observacao: document.getElementById("ausencia-observacao")
  };

  let registros = [];
  let editingId = null;
  let nextId = 0;

  const safe = text => String(text == null ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("ausencias-erro", !!isError);
  }

  function validDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return false;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCFullYear() === +m[1] &&
      d.getUTCMonth() + 1 === +m[2] && d.getUTCDate() === +m[3];
  }

  function displayDate(value) {
    if (!validDate(value)) return "—";
    const [year, month, day] = value.split("-");
    return day + "/" + month + "/" + year;
  }

  function readStored() {
    try {
      const data = localStorage.getItem(KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) throw new Error("Formato inválido");
      return parsed.filter(x => x && typeof x === "object" &&
        typeof x.id === "string" && typeof x.nome === "string" &&
        typeof x.data === "string");
    } catch (error) {
      showMessage("Não foi possível ler os registros salvos neste navegador.", true);
      console.warn("Erro ao ler ausências", error);
      return [];
    }
  }

  function persist(next) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      registros = next;
      showMessage("Registros salvos neste navegador.", false);
      return true;
    } catch (error) {
      showMessage("Não foi possível salvar neste navegador. Nenhuma alteração foi confirmada.", true);
      console.error("Erro ao salvar ausências", error);
      return false;
    }
  }

  function render() {
    exportButton.disabled = registros.length === 0;
    count.textContent = registros.length + (registros.length === 1 ? " registro" : " registros");
    if (!registros.length) {
      list.innerHTML = '<p class="ausencias-vazio">Nenhuma ausência registrada.</p>';
      return;
    }
    const ordered = [...registros].sort((a, b) =>
      b.data.localeCompare(a.data) || (b.criadoEm || "").localeCompare(a.criadoEm || ""));
    list.innerHTML = '<div class="ausencias-tabela-scroll"><table class="ausencias-tabela">' +
      '<thead><tr><th>Data</th><th>Colaborador</th><th>Supervisor</th><th>Frota</th><th>Turno</th><th>Justificativa</th><th>Ações</th></tr></thead>' +
      '<tbody>' + ordered.map(item => (
        '<tr><td>' + safe(displayDate(item.data)) + '</td>' +
        '<td>' + safe(item.nome) + '</td>' +
        '<td>' + safe(item.supervisor || "—") + '</td>' +
        '<td>' + safe(item.frota || "—") + '</td>' +
        '<td>' + safe(item.turma || "—") + '</td>' +
        '<td class="ausencias-observacao">' + safe(item.observacao || "—") + '</td>' +
        '<td class="ausencias-acoes"><button type="button" class="btn btn-sm btn-outline" data-edit="' + safe(item.id) +
        '">Editar</button> <button type="button" class="btn btn-sm btn-ghost" data-delete="' +
        safe(item.id) + '">Excluir</button></td></tr>'
      )).join("") + '</tbody></table></div>';
  }

  function reset() {
    // Remove apenas as opções temporárias usadas por registros antigos.
    fields.observacao.querySelectorAll('option[data-legacy="true"]').forEach(option => option.remove());
    form.reset();
    editingId = null;
    submit.textContent = "Salvar registro";
    cancel.hidden = true;
  }

  function generateId() {
    nextId++;
    return "ausencia_" + Date.now().toString(36) + "_" + nextId;
  }

  function collect() {
    return {
      nome: fields.nome.value.trim(),
      supervisor: fields.supervisor.value.trim(),
      frota: fields.frota.value.trim(),
      turma: fields.turma.value.trim(),
      data: fields.data.value,
      observacao: fields.observacao.value.trim()
    };
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const entry = collect();
    if (!entry.nome || !entry.supervisor || !entry.frota || !["A", "B", "C", "D"].includes(entry.turma) || !entry.observacao || !validDate(entry.data)) {
      showMessage("Preencha Colaborador, Supervisor, Frota, Turno, Justificativa e uma Data válida.", true);
      return;
    }
    const current = editingId && registros.find(x => x.id === editingId);
    const updated = current
      ? registros.map(x => x.id === editingId ? {...x, ...entry} : x)
      : [...registros, {...entry, id: generateId(), criadoEm: new Date().toISOString()}];
    if (!persist(updated)) return;
    reset();
    render();
  });

  list.addEventListener("click", event => {
    const edit = event.target.closest("button[data-edit]");
    const remove = event.target.closest("button[data-delete]");
    if (edit) {
      const item = registros.find(x => x.id === edit.dataset.edit);
      if (!item) return;
      editingId = item.id;
      // Registros anteriores podiam conter observações livres.
      // Preserva o valor original durante a edição, sem acrescentá-lo à lista fixa.
      fields.observacao.querySelectorAll('option[data-legacy="true"]').forEach(option => option.remove());
      if (item.observacao && !Array.from(fields.observacao.options).some(option => option.value === item.observacao)) {
        const legacyOption = document.createElement("option");
        legacyOption.value = item.observacao;
        legacyOption.textContent = item.observacao + " (registro anterior)";
        legacyOption.dataset.legacy = "true";
        fields.observacao.appendChild(legacyOption);
      }
      Object.keys(fields).forEach(k => { fields[k].value = item[k] || ""; });
      submit.textContent = "Salvar alterações";
      cancel.hidden = false;
      fields.nome.focus();
      root.scrollIntoView({behavior:"smooth", block:"start"});
    } else if (remove) {
      const item = registros.find(x => x.id === remove.dataset.delete);
      if (!item || !confirm("Excluir o registro de " + item.nome + " em " + displayDate(item.data) + "?")) return;
      const next = registros.filter(x => x.id !== item.id);
      if (!persist(next)) return;
      if (editingId === item.id) reset();
      render();
    }
  });


  // Um único PDF, abrangendo todos os registros atualmente salvos na relação.
  function gerarPdfRelacao(items) {
    const Ctor = window.jspdf && window.jspdf.jsPDF;
    if (typeof Ctor !== "function") {
      throw new Error("A biblioteca de PDF não foi carregada.");
    }

    // Layout horizontal: cabeçalho com dados da relação e tabela como na tela.
    const pdf = new Ctor({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const left = 13;
    const right = pageWidth - 13;
    const width = right - left;
    const bottom = pageHeight - 18;
    const tableTop = 49;
    const firstRowY = 60;
    const lineHeight = 4.8;
    let y = firstRowY;

    const ordered = [...items].sort((a, b) =>
      b.data.localeCompare(a.data) || (b.criadoEm || "").localeCompare(a.criadoEm || ""));

    const printable = value => String(value == null || value === "" ? "-" : value)
      .replace(/\r/g, "").replace(/\t/g, "  ").replace(/\u0000/g, "").trim() || "-";

    // Quando a relação contém valores diferentes, não atribuir um único
    // supervisor, turno, frota ou data a todos os registros.
    function resumo(selector, plural) {
      const distinct = [...new Set(ordered.map(item => printable(selector(item))))];
      return distinct.length === 1 ? distinct[0] : plural;
    }

    const metadata = [
      { label: "Data", value: resumo(item => displayDate(item.data), "Várias datas"), width: 49 },
      { label: "Supervisor", value: resumo(item => item.supervisor, "Vários supervisores"), width: 76 },
      { label: "Turno", value: resumo(item => item.turma, "Vários turnos"), width: 35 },
      { label: "Frota", value: resumo(item => item.frota, "Várias frotas"), width: width - 160 }
    ];

    const columns = [
      { label: "Data", width: 29, value: item => displayDate(item.data) },
      { label: "Colaborador", width: 48, value: item => item.nome },
      { label: "Supervisor", width: 44, value: item => item.supervisor },
      { label: "Frota", width: 58, value: item => item.frota },
      { label: "Turno", width: 22, value: item => item.turma },
      { label: "Justificativa", width: width - 201, value: item => item.observacao }
    ];

    function pageHeader() {
      pdf.setTextColor(28, 42, 61);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("Registro de Ausências", left, 17);

      let x = left;
      metadata.forEach(field => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(82, 93, 110);
        pdf.text(field.label, x + 2, 28);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(28, 42, 61);
        const valueLines = pdf.splitTextToSize(field.value, field.width - 6).slice(0, 2);
        valueLines.forEach((line, i) => pdf.text(line, x + 2, 35 + i * 4.5));
        x += field.width;
      });

      pdf.setDrawColor(211, 217, 225);
      pdf.line(left, 44, right, 44);
      pdf.setFillColor(245, 247, 250);
      pdf.rect(left, tableTop, width, 10, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(28, 42, 61);
      x = left;
      columns.forEach(column => {
        pdf.text(column.label, x + 2.5, tableTop + 6.4);
        x += column.width;
      });
      pdf.setDrawColor(211, 217, 225);
      pdf.line(left, tableTop + 10, right, tableTop + 10);
      y = firstRowY;
    }

    function newPage() {
      pdf.addPage();
      pageHeader();
    }

    pageHeader();

    ordered.forEach(item => {
      const cells = columns.map(column =>
        pdf.splitTextToSize(printable(column.value(item)), column.width - 5));
      const totalLines = Math.max(...cells.map(lines => lines.length), 1);
      const fullRowHeight = Math.max(11, 5 + totalLines * lineHeight);

      // Manter cada linha inteira quando ela cabe numa página nova.
      if (y + fullRowHeight > bottom && fullRowHeight <= bottom - firstRowY) {
        newPage();
      }

      let offset = 0;
      while (offset < totalLines) {
        if (bottom - y < 11) newPage();
        const capacity = Math.floor((bottom - y - 5) / lineHeight);
        if (capacity < 1) {
          newPage();
          continue;
        }
        const count = Math.min(totalLines - offset, capacity);
        const rowHeight = Math.max(11, 5 + count * lineHeight);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.3);
        pdf.setTextColor(31, 41, 55);

        let x = left;
        cells.forEach((cellLines, i) => {
          cellLines.slice(offset, offset + count).forEach((line, j) => {
            pdf.text(line, x + 2.5, y + 6.3 + j * lineHeight);
          });
          x += columns[i].width;
        });

        y += rowHeight;
        pdf.setDrawColor(225, 230, 235);
        pdf.line(left, y, right, y);
        offset += count;
        if (offset < totalLines) newPage();
      }
    });

    const totalPaginas = pdf.internal.getNumberOfPages();
    for (let page = 1; page <= totalPaginas; page++) {
      pdf.setPage(page);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(98, 107, 122);
      pdf.text("Página " + page + " de " + totalPaginas, right, pageHeight - 9, { align: "right" });
    }

    const blob = pdf.output("blob");
    if (!blob || !blob.size || blob.type !== "application/pdf") {
      throw new Error("O PDF gerado não é válido.");
    }
    return blob;
  }

  function iniciarDownload(blob, filename) {
    if (!window.URL || typeof window.URL.createObjectURL !== "function") {
      throw new Error("Este navegador não permite iniciar o download.");
    }
    const url = window.URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
      }
    } finally {
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    }
  }

  function exportarELimpar() {
    if (!registros.length) {
      showMessage("Não há registros para exportar.", true);
      return;
    }
    if (!confirm("Baixar a relação completa em PDF e remover todos os registros de ausências deste navegador? Verifique o arquivo na pasta de downloads após a operação.")) {
      return;
    }

    exportButton.disabled = true;
    try {
      // Não excluir se a geração do PDF ou o início do download falhar.
      const blob = gerarPdfRelacao(registros);
      const dateTag = new Date().toISOString().slice(0, 10);
      iniciarDownload(blob, "Registro_Ausencias_" + dateTag + ".pdf");
    } catch (error) {
      console.error("Falha na exportação de ausências:", error);
      showMessage("Não foi possível gerar ou iniciar o download do PDF. Os registros foram mantidos.", true);
      exportButton.disabled = false;
      return;
    }

    try {
      localStorage.removeItem(KEY);
      registros = [];
      reset();
      render();
      showMessage("Download do PDF iniciado; registros removidos deste navegador. Confira se o arquivo foi salvo na pasta de downloads.", false);
    } catch (error) {
      console.error("Não foi possível apagar os registros locais:", error);
      showMessage("O download foi iniciado, mas não foi possível excluir os registros salvos neste navegador.", true);
      exportButton.disabled = false;
    }
  }

  exportButton.addEventListener("click", exportarELimpar);
  cancel.addEventListener("click", reset);
  registros = readStored();
  render();
})();