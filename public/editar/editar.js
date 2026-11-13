"use strict";

/* Edição de obra (/editar?id=N):
   - Carregar lista     -> GET /api/v1/mangas (seletor de obra)
   - Carregar obra      -> GET /api/v1/mangas/{id}
   - Salvar             -> PUT /api/v1/mangas/{id} (Bearer JWT)
   - Excluir            -> DELETE /api/v1/mangas/{id} com confirmação digitada
*/

const avisos = document.getElementById("avisos");
const seletorObra = document.getElementById("seletor-obra");
const conteudoEdicao = document.getElementById("conteudo-edicao");
const mensagemVazia = document.getElementById("mensagem-vazia");

const btnSalvar = document.getElementById("btn-salvar");
const btnDescartar = document.getElementById("btn-descartar");

const CAMPOS = ["titulo", "tipo", "autor", "editora", "sinopse", "ano_lancamento", "volumetria", "genero", "classificacao_etaria", "status", "url_capa"];

let obraAtual = null;      // dados vindos da API (fonte da verdade para "Descartar")
let idObra = null;         // id carregado

function mostrarAviso(tipo, html) {
  const aviso = document.createElement("div");
  aviso.className = "aviso-caixa " + tipo;
  aviso.innerHTML = html;
  avisos.appendChild(aviso);
}

const valor = (id) => document.getElementById(id).value;

function montarPayload() {
  const ano = valor("ano_lancamento");
  return {
    titulo: valor("titulo").trim(),
    tipo: valor("tipo"),
    autor: valor("autor").trim(),
    editora: valor("editora").trim() || null,
    sinopse: valor("sinopse").trim() || null,
    ano_lancamento: ano ? Number(ano) : null,
    volumetria: valor("volumetria").trim() || null,
    genero: valor("genero").trim() || null,
    classificacao_etaria: valor("classificacao_etaria") || null,
    status: valor("status"),
    url_capa: valor("url_capa").trim() || null,
  };
}

function preencherFormulario(m) {
  for (const campo of CAMPOS) {
    const el = document.getElementById(campo);
    if (el) el.value = m[campo] ?? "";
  }
  atualizarPrevia();
  atualizarAuditoria(m);
}

function atualizarPrevia() {
  const caixa = document.getElementById("previa-capa");
  if (valor("url_capa")) {
    caixa.innerHTML = `<img src="${esc(valor("url_capa"))}" alt="Capa atual"
      onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;capa-fallback&quot;>?</span>')">`;
  } else {
    caixa.innerHTML = '<span class="capa-fallback">?</span>';
  }
}

function atualizarAuditoria(m) {
  document.getElementById("auditoria-criada").textContent = rotuloData(m.created_at);
  document.getElementById("auditoria-editada").textContent = rotuloData(m.updated_at);
  document.getElementById("auditoria-id").textContent = "#" + m.id;
  document.getElementById("rotulo-id").textContent = "(#" + m.id + ")";
}

/* ---------- Seletor de obras ---------- */
async function carregarListaObras() {
  const resposta = await API.get("/mangas?pagina=1&tamanho_pagina=100&ordenar_por=id&direcao_ordenacao=asc");
  const lista = resposta.ok ? (resposta.dados.dados || []) : [];
  seletorObra.innerHTML = '<option value="">— selecione uma obra —</option>' +
    lista.map((m) => `<option value="${m.id}">#${m.id} — ${esc(m.titulo)}</option>`).join("");
  if (idObra) seletorObra.value = String(idObra);
}

seletorObra.addEventListener("change", () => {
  if (seletorObra.value) location.href = "/editar?id=" + seletorObra.value;
});

/* ---------- Carregar obra ---------- */
async function carregarObra(id) {
  const resposta = await API.get("/mangas/" + id);
  if (!resposta.ok) {
    mostrarAviso("erro", esc(resposta.dados.error || "Obra não encontrada.") +
      ' <a href="/catalogo">Voltar ao catálogo</a>');
    mensagemVazia.textContent = "Não foi possível carregar a obra #" + id + ".";
    return;
  }
  obraAtual = resposta.dados;
  idObra = obraAtual.id;
  preencherFormulario(obraAtual);
  conteudoEdicao.classList.remove("oculto");
  mensagemVazia.classList.add("oculto");
  btnSalvar.disabled = false;
  btnDescartar.disabled = false;
  document.getElementById("btn-abrir-excluir").disabled = false;
  document.getElementById("btn-abrir-excluir-2").disabled = false;
}

/* ---------- Salvar (PUT) ---------- */
btnSalvar.addEventListener("click", async () => {
  if (!idObra) return;
  limparErros(conteudoEdicao);

  if (!tokenAtual()) {
    mostrarAviso("erro", 'Sessão expirada ou ausente — <a href="/auth">renove o token JWT</a> e tente novamente.');
    return;
  }

  btnSalvar.disabled = true;
  btnSalvar.textContent = "Enviando PUT…";
  const resposta = await API.put("/mangas/" + idObra, montarPayload());
  btnSalvar.disabled = false;
  btnSalvar.textContent = "💾 Salvar alterações";

  if (resposta.ok) {
    obraAtual = resposta.dados.manga;
    preencherFormulario(obraAtual);
    document.getElementById("rotulo-alteracoes").textContent = "Alterações salvas";
    toast(resposta.dados.mensagem + " (200 OK)");
  } else {
    mostrarErros(conteudoEdicao, resposta.dados, resposta.dados.error || "Não foi possível salvar.");
    document.getElementById("rotulo-alteracoes").textContent = "Falha ao salvar";
  }
});

/* ---------- Descartar ---------- */
btnDescartar.addEventListener("click", () => {
  if (obraAtual) {
    preencherFormulario(obraAtual);
    limparErros(conteudoEdicao);
    document.getElementById("rotulo-alteracoes").textContent = "Alterações descartadas";
    toast("Formulário restaurado para os dados do servidor.", "aviso");
  }
});

/* ---------- Exclusão com confirmação digitada ---------- */
const modalExcluir = document.getElementById("modal-excluir");
const inputConfirmar = document.getElementById("input-confirmar-exclusao");
const btnConfirmarExcluir = document.getElementById("btn-confirmar-excluir");

function abrirModalExcluir() {
  if (!idObra) return;
  modalExcluir.classList.remove("oculto");
  inputConfirmar.value = "";
  btnConfirmarExcluir.disabled = true;
  document.getElementById("excluir-id").textContent = idObra;
  document.querySelectorAll(".texto-id").forEach((el) => (el.textContent = idObra));
  document.getElementById("excluir-resumo").innerHTML =
    `<strong>Obra:</strong> #${idObra} ${esc(obraAtual ? obraAtual.titulo : "")} — o registro sairá do catálogo permanentemente.`;
  inputConfirmar.focus();
}

function fecharModalExcluir() {
  modalExcluir.classList.add("oculto");
}

document.getElementById("btn-abrir-excluir").addEventListener("click", abrirModalExcluir);
document.getElementById("btn-abrir-excluir-2").addEventListener("click", abrirModalExcluir);
document.getElementById("btn-fechar-excluir").addEventListener("click", fecharModalExcluir);
document.getElementById("btn-cancelar-excluir").addEventListener("click", fecharModalExcluir);
modalExcluir.addEventListener("click", (e) => { if (e.target === modalExcluir) fecharModalExcluir(); });

inputConfirmar.addEventListener("input", () => {
  const confirmacao = "DELETE " + idObra;
  btnConfirmarExcluir.disabled = inputConfirmar.value.trim() !== confirmacao;
});

btnConfirmarExcluir.addEventListener("click", async () => {
  btnConfirmarExcluir.disabled = true;
  btnConfirmarExcluir.textContent = "Excluindo…";
  const resposta = await API.del("/mangas/" + idObra);
  btnConfirmarExcluir.textContent = "Confirmar exclusão";

  if (resposta.ok) {
    toast(resposta.dados.mensagem + " (200 OK)");
    fecharModalExcluir();
    setTimeout(() => (location.href = "/dashboard"), 900);
  } else {
    document.getElementById("erro-exclusao").textContent =
      resposta.dados.error || "Não foi possível excluir a obra.";
    btnConfirmarExcluir.disabled = false;
  }
});

/* ---------- Inicialização ---------- */
(async () => {
  if (!tokenAtual()) {
    mostrarAviso("info", 'Editar e excluir obras exige <span class="mono">Bearer JWT</span>. ' +
      '<a href="/auth">Entre ou crie uma conta</a> para habilitar o salvamento.');
  }
  const params = new URLSearchParams(location.search);
  idObra = params.get("id") ? Number(params.get("id")) : null;
  await carregarListaObras();
  if (idObra) await carregarObra(idObra);
})();
