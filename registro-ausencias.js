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
      '<thead><tr><th>Data</th><th>Colaborador</th><th>Frota</th><th>Turno</th><th>Observação</th><th>Ações</th></tr></thead>' +
      '<tbody>' + ordered.map(item => (
        '<tr><td>' + safe(displayDate(item.data)) + '</td>' +
        '<td>' + safe(item.nome) + '</td>' +
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
      frota: fields.frota.value.trim(),
      turma: fields.turma.value.trim(),
      data: fields.data.value,
      observacao: fields.observacao.value.trim()
    };
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const entry = collect();
    if (!entry.nome || !validDate(entry.data)) {
      showMessage("Preencha o colaborador e uma data válida.", true);
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

    const pdf = new Ctor({ orientation: "portrait", unit: "mm", format: "a4" });
    const left = 16;
    const right = 194;
    const printableWidth = right - left;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const bottom = pageHeight - 20;
    let y = 25;

    function novoCabecalho(continuacao) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Registro de Ausências" + (continuacao ? " - continuação" : ""), left, 17);
      pdf.setDrawColor(205, 210, 215);
      pdf.line(left, 19, right, 19);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
    }

    function espaco(altura) {
      if (y + altura > bottom) {
        pdf.addPage();
        y = 27;
        novoCabecalho(true);
      }
    }

    function linha(label, value) {
      const content = String(value == null || value === "" ? "—" : value)
        .replace(/\r/g, "").replace(/\t/g, "    ").replace(/\u0000/g, "");
      const paragraphs = content.split("\n");
      paragraphs.forEach((paragraph, index) => {
        const head = index === 0 ? label + ": " : "";
        const wrapped = pdf.splitTextToSize(head + (paragraph || (index === 0 ? "—" : "")), printableWidth);
        wrapped.forEach((part) => {
          espaco(5.3);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9.5);
          pdf.text(part, left, y);
          y += 5.3;
        });
      });
    }

    novoCabecalho(false);
    const geradoEm = new Date().toLocaleString("pt-BR");
    linha("Gerado em", geradoEm);
    linha("Total de registros", items.length);
    y += 5;

    const ordered = [...items].sort((a, b) =>
      b.data.localeCompare(a.data) || (b.criadoEm || "").localeCompare(a.criadoEm || ""));

    ordered.forEach((item, index) => {
      espaco(16);
      pdf.setDrawColor(224, 228, 232);
      pdf.line(left, y - 2.5, right, y - 2.5);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text("Registro " + (index + 1), left, y + 2);
      y += 9;
      linha("Data", displayDate(item.data));
      linha("Colaborador", item.nome);
      linha("Frota", item.frota);
      linha("Turno", item.turma);
      linha("Observação", item.observacao);
      y += 7;
    });

    const totalPaginas = pdf.internal.getNumberOfPages();
    for (let page = 1; page <= totalPaginas; page++) {
      pdf.setPage(page);
      pdf.setDrawColor(225, 228, 231);
      pdf.line(left, pageHeight - 14, right, pageHeight - 14);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
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