/**
 * Calendários para campos de data dos relatórios de início e fim de turno.
 * Preserva os campos de texto, os horários e as rotinas existentes de salvamento.
 */
(function () {
  "use strict";

  var camposDeData = [
    "#field-data",
    "#fim-data",
    '#container-preventivas input[oninput*="dataParada"]',
    '#container-preventivas input[oninput*="previsaoLiberacao"]',
    '#container-corretivas input[oninput*="dataParada"]',
    '#container-corretivas input[oninput*="previsaoLiberacao"]',
    '#panel-fim input[data-field="dataParada"]',
    '#panel-fim input[data-field="previsaoLiberacao"]',
    '#panel-fim input[data-field="liberacao"]',
    '#panel-fim input[data-field="data"]'
  ].join(", ");

  function interpretarData(texto) {
    var match = String(texto || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})(?=\s|$)/);
    if (!match) return null;

    var dia = Number(match[1]);
    var mes = Number(match[2]);
    var ano = Number(match[3]);
    if (match[3].length === 2) ano += ano >= 70 ? 1900 : 2000;

    var data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
      return null;
    }
    return {
      iso: String(ano).padStart(4, "0") + "-" +
        String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0"),
      anoCurto: match[3].length === 2,
      restante: String(texto).trim().slice(match[0].length)
    };
  }

  function montarData(valorISO, textoExistente) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valorISO);
    if (!match) return textoExistente;

    var antiga = interpretarData(textoExistente);
    var ano = antiga && antiga.anoCurto ? match[1].slice(-2) : match[1];
    var sufixo = antiga ? antiga.restante : "";
    return match[3] + "/" + match[2] + "/" + ano + sufixo;
  }

  function prepararCampo(input) {
    if (!input || input.closest(".campo-com-calendario")) return;
    var container = document.createElement("span");
    container.className = "campo-com-calendario";
    input.parentNode.insertBefore(container, input);
    container.appendChild(input);

    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-calendario";
    botao.setAttribute("aria-label", "Selecionar data no calendário");
    botao.title = "Selecionar data no calendário";
    botao.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';

    var calendario = document.createElement("input");
    calendario.type = "date";
    calendario.className = "seletor-calendario-nativo";
    calendario.setAttribute("aria-label", "Escolher data");
    calendario.tabIndex = -1;

    if (typeof calendario.showPicker !== "function") {
      calendario.classList.add("seletor-calendario-alternativo");
      botao.tabIndex = -1;
    }

    botao.addEventListener("click", function () {
      var dataAtual = interpretarData(input.value);
      calendario.value = dataAtual ? dataAtual.iso : "";
      if (typeof calendario.showPicker === "function") {
        try {
          calendario.showPicker();
          return;
        } catch (e) {
          // Alguns navegadores exigem interação direta com o input.
        }
      }
      calendario.focus();
      calendario.click();
    });

    calendario.addEventListener("change", function () {
      if (!calendario.value) return;
      input.value = montarData(calendario.value, input.value);
      // Dispara os mesmos handlers já existentes para atualizar o rascunho e a prévia.
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    input.addEventListener("change", function () {
      var dataAtual = interpretarData(input.value);
      calendario.value = dataAtual ? dataAtual.iso : "";
    });

    container.appendChild(botao);
    container.appendChild(calendario);
  }

  function prepararDatas() {
    document.querySelectorAll(camposDeData).forEach(prepararCampo);
  }

  function iniciarCalendarios() {
    prepararDatas();
    [
      document.getElementById("container-preventivas"),
      document.getElementById("container-corretivas"),
      document.querySelector('#panel-fim [data-list="preventivas"]'),
      document.querySelector('#panel-fim [data-list="corretivas"]'),
      document.querySelector('#panel-fim [data-list="liberados"]')
    ].filter(Boolean).forEach(function (container) {
      var observer = new MutationObserver(prepararDatas);
      observer.observe(container, { childList: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarCalendarios);
  } else {
    iniciarCalendarios();
  }
})();