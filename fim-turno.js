/* Relatório de fim de turno: estado, formulário e exportações independentes. */
(function () {
  "use strict";
  const root = document.getElementById("panel-fim");
  if (!root) return;
  const STORAGE = "relatorio_fim_turno_draft";
  const modelo = {
    frota:"Transporte GP",turma:"A",supervisor:"Felipe Fontes",tecPrev:"Rocha",
    tecCorr:"Mário Barbosa",data:"29/10/2026",qtdPrev:2,qtdCorr:1,qtdAcid:0,
    qtdLiberados:2,seguranca:"",escopoPrev:"Transporte GP",
    preventivas:[{
      id:"fp1",tag:"CM4050",atividades:"MP 500hs / Franzen / Analub / Automação / Subst. cuica / Suporte do reboque / Backlog\u0060s (Linha 01)",
      equipeCampos:["Fenelon","Guilherme","Carlos","Zé Maria",""],
      tempoProgramado:"36horas",dataParada:"29/10/26 23:00h",previsaoLiberacao:"30/10/26 15:00h",
      executadas:"PM concluída\nSubstituído Cuicas\nExtra: Substituído Baterias",
      desvios:"Ausência do Soldador, para atividade do suporte de reboque\nCuicas vieram erradas (04 horas de atraso devido necessidade de buscar no armazém)",
      pendencias:"Remover/Substituir Suporte Reboque\nDialise (Analub)\nFranzen\nExtra: Substituir motor partida inferior\nExtra: Laudo CMA"
    }],
    corretivas:[{
      id:"fc1",tag:"CM4119",ordem:"202605667699",falha:"Câmera frontal esquerda inoperante",
      equipe:"Pedro e Robson",dataParada:"29/10/26 15:55h",previsaoLiberacao:"Em diagnostico",
      descricaoAtividade:"Equipamento apresentou falha nas câmeras. Foi observado que as câmeras tanto frontal, lateral e traseira estão em funcionamento. Porém apresentou falha (taxa de atualização anormal. Uma perca de comunicação dos sensores traseiros, lateral e dianteiros. Verificada alimentação em todos os sensores\nVerificada alimentação no conector do monitor 24.2 v\nVerificado com o cat ET os alarmes ativos referentes a falha no monitor das câmeras. Falhas de taxa de atualização anormal. Perda de comunicação dos sensores traseiros/laterais e dianteiros.",
      pendencias:"Continuidade diagnóstico da falha\nOu substituir sistema de câmeras e monitor"
    }],
    liberados:[{
      id:"fl1",tipo:"corretiva",tag:"CM4121",ordem:"202605667690",equipe:"Fabio Landin, George",
      data:"28/10/2026 12:00h",descricaoFalha:"Vazamento de água quando aplica o retardado manual",
      correcaoFalha:"Foi realizado a Drenagem de sedimentos de água acumulado no reservatório de ar do sistema de freios do equipamento.\nRealizado teste no equipamento após a atividade concluída.\nEquipamento foi direcionado para a manutenção de pneus.\nApós realização da atividade da manutenção de pneus realizar a liberação do equipamento"
    },{
      id:"fl2",tipo:"preventiva",tag:"CM4050",
      atividades:"MP 500hs / Franzen / Analub / Automação / Subst. cuica / Suporte do reboque / Backlog\u0060s (Linha 01)",
      equipe:"Fenelon, Guilherme, Carlos e Zé Maria",liberacao:"29/10/26 15:00h",
      executadas:"PM concluída\nSubstituído Cuicas\nExtra: Substituído Baterias",
      desvios:"Ausência do Soldador, para atividade do suporte de reboque\nCuicas vieram erradas (04 horas de atraso devido necessidade de buscar no armazém)"
    }]
  };
  const clone = x => JSON.parse(JSON.stringify(x));
  const groups = ["preventivas","corretivas","liberados"];
  const mainKeys = ["frota","turma","supervisor","tecPrev","tecCorr","data","qtdPrev","qtdCorr","qtdAcid","qtdLiberados","seguranca","escopoPrev"];
  const countKeys = {preventivas:"qtdPrev",corretivas:"qtdCorr",liberados:"qtdLiberados"};
  const fields = {
    preventivas:[
      ["tag","TAG"],["atividades","Atividades"],["equipeCampos","Equipe"],
      ["tempoProgramado","Tempo programado"],["dataParada","Data da Parada"],
      ["previsaoLiberacao","Previsão Liberação"],["executadas","Principais Atividades Executadas no turno","area"],
      ["desvios","Desvios durante o turno","area"],["pendencias","Pendências para o próximo turno","area"]
    ],
    corretivas:[
      ["tag","TAG"],["ordem","Ordem"],["falha","Falha"],["equipe","Equipe"],
      ["dataParada","Data da Parada"],["previsaoLiberacao","Previsão Liberação"],
      ["descricaoAtividade","Descrição Atividade","area"],["pendencias","Pendências para o próximo turno","area"]
    ],
    liberadoCorretiva:[
      ["tag","TAG"],["ordem","Ordem"],["equipe","Equipe"],["data","Data"],
      ["descricaoFalha","Descrição da falha","area"],["correcaoFalha","Correção da falha","area"]
    ],
    liberadoPreventiva:[
      ["tag","TAG"],["atividades","Atividades"],["equipe","Equipe"],["liberacao","Liberação"],
      ["executadas","Principais Atividades Executadas","area"],["desvios","Desvios","area"]
    ]
  };
  let state = clone(modelo);
  let counter=0;
  try {
    const stored=localStorage.getItem(STORAGE);
    if(stored) {
      const parsed=JSON.parse(stored);
      if(parsed && groups.every(g=>Array.isArray(parsed[g]))) state=Object.assign(clone(modelo),parsed);
    }
  } catch(error) { console.warn("Rascunho de fim de turno indisponível.",error); }
  function normalizarTurno(value) {
    const turno = String(value || "").trim().toUpperCase();
    return ["A", "B", "C", "D"].includes(turno) ? turno : "";
  }
  function normalizarFrota(value) {
    const texto = String(value || "").trim();
    if (texto === "Escavação/Perfuratriz") return "Escavação/Perfuração";
    return ["Transporte GP", "Infraestrutura", "Escavação/Perfuração"].includes(texto) ? texto : "";
  }
  state.frota = normalizarFrota(state.frota);
  state.escopoPrev = normalizarFrota(state.escopoPrev);
  state.turma = normalizarTurno(state.turma);
  const htmlEscape = v => String(v == null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  const val=(k)=>String(state[k]==null?"":state[k]);
  const num=x=>Math.max(0,parseInt(x,10)||0);
  const pad=x=>String(num(x)).padStart(2,"0");
  const splitLines=text=>String(text||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const bullet=text=>splitLines(text).map(x=>"- "+x.replace(/^[-•]\s*/,""));
  const team=p=>Array.isArray(p.equipeCampos)?p.equipeCampos.map(x=>String(x||"").trim()).filter(Boolean).join(", "):String(p.equipe||"");
  const getItem=(g,id)=>state[g].find(x=>x.id===id);
  const makeId=g=>g+"_"+Date.now().toString(36)+"_"+(++counter);
  function showFormField(g,id,item,entry) {
    const [field,label,kind]=entry;
    if(field==="equipeCampos") {
      const equipe=Array.isArray(item.equipeCampos)?item.equipeCampos:["","","","",""];
      return '<div class="form-group fim-wide"><label>Equipe</label><div class="grid grid-2">' +
        [0,1,2,3,4].map(i=>'<div class="form-group"><label>Integrante '+(i+1)+'</label><input type="text" data-group="'+g+'" data-id="'+htmlEscape(id)+'" data-person="'+i+'" value="'+htmlEscape(equipe[i]||"")+'" placeholder="Nome"></div>').join("")+'</div></div>';
    }
    const attrs=' data-group="'+g+'" data-id="'+htmlEscape(id)+'" data-field="'+field+'"';
    const content=kind==="area"?
      '<textarea rows="4"'+attrs+' placeholder="Descreva uma atividade por linha">'+htmlEscape(item[field]||"")+'</textarea>':
      '<input type="text"'+attrs+' value="'+htmlEscape(item[field]||"")+'">';
    return '<div class="form-group '+(kind==="area" || field==="atividades" || field==="falha"?"fim-wide":"")+'"><label>'+htmlEscape(label)+'</label>'+content+'</div>';
  }
  function renderGroup(group) {
    const host=root.querySelector('[data-list="'+group+'"]');
    host.innerHTML=state[group].map((item,i)=>{
      const type=item.tipo==="preventiva"?"preventiva":"corretiva";
      const schema=group==="liberados"?(type==="preventiva"?fields.liberadoPreventiva:fields.liberadoCorretiva):fields[group];
      const typePicker=group==="liberados"?
        '<div class="form-group fim-wide"><label>Tipo de manutenção</label><select data-group="liberados" data-id="'+htmlEscape(item.id)+'" data-field="tipo"><option value="corretiva"'+(type==="corretiva"?" selected":"")+'>Corretiva</option><option value="preventiva"'+(type==="preventiva"?" selected":"")+'>Preventiva</option></select></div>':"";
      const colorClass=group==="preventivas"?"card-prev":group==="corretivas"?"card-corr":"card-liberado";
      return '<article class="item-card '+colorClass+'"><div class="item-header"><span class="item-tag-title">Equipamento '+(i+1)+' — '+htmlEscape(item.tag||"Nova TAG")+'</span><button type="button" class="btn-remove-item" data-remove="'+group+'" data-id="'+htmlEscape(item.id)+'" aria-label="Remover equipamento" title="Remover equipamento">✕</button></div><div class="grid grid-2">'+typePicker+schema.map(f=>showFormField(group,item.id,item,f)).join("")+'</div></article>';
    }).join("");
  }
  function refresh() {
    mainKeys.forEach(k=>{
      const e=root.querySelector('[data-main="'+k+'"]');
      if(e) e.value=val(k);
    });
    groups.forEach(renderGroup);
    preview();
  }
  function persist() {
    const status=root.querySelector("#fim-draft-status");
    try {
      localStorage.setItem(STORAGE,JSON.stringify(state));
      if(status) status.textContent="Rascunho salvo às "+new Date().toLocaleTimeString("pt-BR");
    } catch(error) {
      if(status) status.textContent="Rascunho não salvo neste navegador";
      console.warn(error);
    }
    preview();
  }
  function blankState() {
    const next=clone(modelo);
    mainKeys.forEach(k=>next[k]="");
    next.data=new Date().toLocaleDateString("pt-BR");
    ["qtdPrev","qtdCorr","qtdAcid","qtdLiberados"].forEach(k=>next[k]=0);
    groups.forEach(g=>next[g]=[]);
    return next;
  }
  function newItem(group) {
    const item={id:makeId(group),tag:""};
    const schema=group==="liberados"?fields.liberadoCorretiva:fields[group];
    schema.forEach(f=>{item[f[0]]=f[0]==="equipeCampos"?["","","","",""]:"";});
    if(group==="liberados") item.tipo="corretiva";
    return item;
  }
  function count(group) {
    const key=countKeys[group];
    state[key]=state[group].length;
    const input=root.querySelector('[data-main="'+key+'"]');
    if(input) input.value=state[key];
  }
  function formattedText() {
    const out=["Relatório de Final de Turno",
      "Frota: "+val("frota"),"Turno: "+val("turma"),"Supervisor: "+val("supervisor"),
      "Técnico Preventiva: "+val("tecPrev"),"Técnico Corretiva: "+val("tecCorr"),
      "Data: "+val("data"),"",
      "🔵 Preventiva: "+pad(state.qtdPrev),"🟡 Corretiva: "+pad(state.qtdCorr),
      "🔴 Acidente: "+pad(state.qtdAcid),"🟢 Liberado no Turno: "+pad(state.qtdLiberados),"",
      "⚠️Segurança/Meio Ambiente: "+val("seguranca"),"",
      "🔵Equipamento em Manutenção Preventiva: "+val("escopoPrev"),""];
    state.preventivas.forEach(p=>{
      out.push("TAG: "+(p.tag||""),"Atividades: "+(p.atividades||""),"Equipe: "+team(p),
        "Tempo programado: "+(p.tempoProgramado||""),"Data da Parada: "+(p.dataParada||""),
        "Previsão Liberação: "+(p.previsaoLiberacao||""),"Principais Atividades Executadas no turno:");
      out.push(...bullet(p.executadas),"Desvios durante o turno:",...bullet(p.desvios),
        "Pendências para o próximo turno:",...bullet(p.pendencias),"");
    });
    out.push("🟡Equipamentos em Corretiva:","");
    state.corretivas.forEach(c=>{
      out.push("TAG: "+(c.tag||""),"Ordem: "+(c.ordem||""),"Falha: "+(c.falha||""),
        "Equipe: "+(c.equipe||""),"Data da Parada: "+(c.dataParada||""),
        "Previsão Liberação: "+(c.previsaoLiberacao||""),"Descrição Atividade:",
        ...splitLines(c.descricaoAtividade),"","Pendências para o próximo turno:",
        ...bullet(c.pendencias),"");
    });
    out.push("🟢Equipamento Liberado no Turno","");
    state.liberados.forEach(l=>{
      if(l.tipo==="preventiva") {
        out.push("TAG: "+(l.tag||""),"Atividades: "+(l.atividades||""),
          "Equipe: "+(l.equipe||""),"Liberação: "+(l.liberacao||""),
          "Principais Atividades Executadas:",...bullet(l.executadas),
          "Desvios:",...bullet(l.desvios),"");
      } else {
        out.push("TAG: "+(l.tag||""),"Ordem: "+(l.ordem||""),
          "Equipe: "+(l.equipe||""),"Data: "+(l.data||""),
          "Descrição da falha:",...splitLines(l.descricaoFalha),
          "Correção da falha:",...splitLines(l.correcaoFalha),"");
      }
    });
    return out.join("\n").trim();
  }
  function preview() { root.querySelector("#fim-preview-text").textContent=formattedText(); }

function formatarTextoParaWhatsApp(texto) {
  const titulos = new Set([
    'Relatório de início de turno',
    'Relatório de Final de Turno',
    '🟡Equipamentos em Corretiva:',
    '🟢Equipamento Liberado no Turno',
    'Pontos de atenção:',
    'Principais Atividades Executadas no turno:',
    'Principais Atividades Executadas:',
    'Desvios durante o turno:',
    'Desvios:',
    'Pendências para o próximo turno:',
    'Descrição Atividade:',
    'Descrição da falha:',
    'Correção da falha:'
  ]);
  const campos = new Set([
    'Frota', 'Turno', 'Supervisor', 'Técnico Preventiva',
    'Técnico Corretiva', 'Data',
    '🔵 Preventiva', '🟡 Corretiva', '🔴 Acidente',
    '🟢 Liberado no Turno', '⚠️Segurança/Meio Ambiente',
    '🔵Equipamento em Manutenção Preventiva',
    'TAG', 'Ordem', 'Atividades', 'Equipe', 'Tempo programado',
    'Data da Parada', 'Previsão Liberação', 'Falha', 'Liberação'
  ]);
  return texto.split('\n').map(linha => {
    if (titulos.has(linha.trim())) return '*' + linha + '*';
    const pos = linha.indexOf(':');
    if (pos >= 0 && campos.has(linha.slice(0, pos).trim())) {
      return '*' + linha.slice(0, pos + 1) + '*' + linha.slice(pos + 1);
    }
    return linha;
  }).join('\n');
}

  function copy() {
    const text=formatarTextoParaWhatsApp(formattedText());
    function done() {
      const toast=root.querySelector("#fim-copy-toast");
      toast.classList.remove("hidden");
      setTimeout(()=>toast.classList.add("hidden"),2600);
    }
    function fallback() {
      const area=document.createElement("textarea");
      area.value=text;document.body.appendChild(area);area.select();
      let ok=false;
      try { ok=document.execCommand("copy"); } catch(err) {}
      area.remove();
      if(ok) done(); else alert("Não foi possível copiar. Selecione o conteúdo da prévia e copie manualmente.");
    }
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
    else fallback();
  }
  async function download() {
    if(!window.docx) {
      alert("A biblioteca para gerar Word não está disponível. Atualize a página.");
      return;
    }
    const {Document,Paragraph,TextRun,Packer}=window.docx;
    const lines=formattedText().split("\n");
    const headings=new Set(["Relatório de Final de Turno","🟡Equipamentos em Corretiva:",
      "🟢Equipamento Liberado no Turno","Principais Atividades Executadas no turno:",
      "Desvios durante o turno:","Pendências para o próximo turno:","Descrição Atividade:",
      "Descrição da falha:","Correção da falha:","Principais Atividades Executadas:","Desvios:"]);
    const children=lines.map((line,index)=>{
      let runs=[];
      const colon=line.indexOf(":");
      if(headings.has(line)) runs=[new TextRun({text:line,bold:true,size:22,font:"Calibri"})];
      else if(colon>0 && !line.startsWith("- ")) runs=[
        new TextRun({text:line.slice(0,colon+1),bold:true,size:22,font:"Calibri"}),
        new TextRun({text:line.slice(colon+1),size:22,font:"Calibri"})
      ];
      else runs=[new TextRun({text:line,size:22,font:"Calibri"})];
      return new Paragraph({children:runs,spacing:{after:line?105:155}});
    });
    const button=root.querySelector("#fim-download-docx"),old=button.textContent;
    button.disabled=true;button.textContent="Gerando arquivo Word...";
    try {
      const doc=new Document({sections:[{properties:{},children}]});
      const blob=await Packer.toBlob(doc);
      const file="Relatorio_Final_Turno_"+val("turma").replace(/[^a-zA-Z0-9]/g,"")+"_"+val("data").replace(/[^0-9a-zA-Z]/g,"-")+".docx";
      if(window.saveAs) window.saveAs(blob,file);
      else {
        const url=URL.createObjectURL(blob),a=document.createElement("a");
        a.href=url;a.download=file;document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    } catch(error) {
      console.error(error);
      alert("Não foi possível gerar o arquivo Word.");
    } finally { button.disabled=false;button.textContent=old; }
  }
  root.addEventListener("input",event=>{
    const e=event.target,k=e.dataset.main;
    if(k) {
      state[k]=k.startsWith("qtd")?num(e.value):e.value;
      persist();return;
    }
    const g=e.dataset.group,id=e.dataset.id;
    if(!groups.includes(g)||!id) return;
    const item=getItem(g,id);
    if(!item) return;
    if(e.dataset.person!==undefined) {
      if(!Array.isArray(item.equipeCampos)) item.equipeCampos=["","","","",""];
      item.equipeCampos[Number(e.dataset.person)]=e.value;
    } else if(e.dataset.field) item[e.dataset.field]=e.value;
    if(e.dataset.field==="tag") {
      const heading=e.closest(".item-card").querySelector(".item-tag-title");
      const pos=state[g].findIndex(x=>x.id===id);
      heading.textContent="Equipamento "+(pos+1)+" — "+(e.value||"Nova TAG");
    }
    persist();
  });
  root.addEventListener("change",event=>{
    const e=event.target;
    if(e.dataset.field==="tipo" && e.dataset.group==="liberados") {
      const item=getItem("liberados",e.dataset.id);
      if(item) { item.tipo=e.value;renderGroup("liberados");persist(); }
    }
  });
  root.addEventListener("click",event=>{
    const e=event.target.closest("button");
    if(!e || !root.contains(e)) return;
    if(e.dataset.add && groups.includes(e.dataset.add)) {
      const g=e.dataset.add;state[g].push(newItem(g));count(g);renderGroup(g);persist();
    } else if(e.dataset.remove && groups.includes(e.dataset.remove)) {
      const g=e.dataset.remove;
      state[g]=state[g].filter(x=>x.id!==e.dataset.id);
      count(g);renderGroup(g);persist();
    } else if(e.id==="fim-clear-all") {
      if(confirm("Limpar somente o relatório de fim de turno?")) {state=blankState();refresh();persist();}
    } else if(e.id==="fim-load-sample") {
      if(confirm("Carregar o exemplo do relatório de fim de turno?")) {state=clone(modelo);refresh();persist();}
    } else if(e.id==="fim-copy-whatsapp") copy();
    else if(e.id==="fim-download-docx") download();
    else if(e.id==="fim-print-report") window.print();
  });
  refresh();
})();