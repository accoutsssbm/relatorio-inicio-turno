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
    count.textContent = registros.length + (registros.length === 1 ? " registro" : " registros");
    if (!registros.length) {
      list.innerHTML = '<p class="ausencias-vazio">Nenhuma ausência registrada.</p>';
      return;
    }
    const ordered = [...registros].sort((a, b) =>
      b.data.localeCompare(a.data) || (b.criadoEm || "").localeCompare(a.criadoEm || ""));
    list.innerHTML = '<div class="ausencias-tabela-scroll"><table class="ausencias-tabela">' +
      '<thead><tr><th>Data</th><th>Colaborador</th><th>Frota</th><th>Turma</th><th>Observação</th><th>Ações</th></tr></thead>' +
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

  cancel.addEventListener("click", reset);
  registros = readStored();
  render();
})();