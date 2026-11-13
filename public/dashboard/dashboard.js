"use strict";

/* Dashboard de gerenciamento CRUD (/dashboard):
   - Sessão      -> GET /api/v1/auth/me (valida o Bearer token)
   - Estatísticas-> GET /api/v1/mangas/estatisticas
   - Tabela      -> GET /api/v1/mangas (filtros client-side na tela)
   - Criar/Editar-> POST / PUT /api/v1/mangas (modal)
   - Excluir     -> DELETE /api/v1/mangas/{id}
   - Terminal    -> loga cada chamada feita pelo cliente API comum
*/

const conteudo = document.getElementById("conteudo");
const corpoTabela = document.getElementById("corpo-tabela");
const filtroBusca = document.getElementById("filtro-busca");
const filtroTipo = document.getElementById("filtro-tipo");
const filtroStatus = document.getElementById("filtro-status");

let obras = [];
let idEdicao = null; // null => modal em modo POST

/* ---------- Sem sessão: vai direto para o login ---------- */
if (!tokenAtual()) {
  location.href = "/auth";
} else {
  conteudo.hidden = false;
  iniciar();
}

/* ---------- Usuário (GET /auth/me) ---------- */
async function carregarUsuario() {
  const resposta = await API.get("/auth/me");
  if (!resposta.ok) {
    mostrarErroSessao(resposta);
    return false;
  }
  const usuario = resposta.dados.usuario;
  document.getElementById("usuario-nome").textContent = `${usuario.nome} (#${usuario.id})`;
  document.getElementById("usuario-email").textContent = `${usuario.email} • @${usuario.nome_usuario}`;
  return true;
}

function mostrarErroSessao(resposta) {
  toast(resposta.dados.error || "Sessão inválida.", "erro");
  if (resposta.status === 401 || resposta.status === 403) {
    encerrarSessao();
    location.href = "/auth";
  }
}

document.getElementById("btn-atualizar-usuario").addEventListener("click", carregarUsuario);

/* ---------- Estatísticas ---------- */
async function carregarEstatisticas() {
  const resposta = await API.get("/mangas/estatisticas");
  if (!resposta.ok) return;
  const estatisticas = resposta.dados;
  const porTipo = estatisticas.por_tipo || [];
  const porStatus = estatisticas.por_status || [];

  document.getElementById("grade-stats").innerHTML = `
    <div class="stat"><strong>${estatisticas.total ?? 0}</strong><span>Total de obras</span></div>
    ${porTipo.slice(0, 2).map((t) => `<div class="stat"><strong>${t.total}</strong><span>${esc(ROTULO_TIPO[t.tipo] || t.tipo)}</span></div>`).join("")}
    <div class="stat chips-stat">
      <span>Por tipo</span>
      <div class="chips">${porTipo.map((t) => `<span class="chip inativo">${esc(ROTULO_TIPO[t.tipo] || t.tipo)}: ${t.total}</span>`).join("") || '<span class="dim">—</span>'}</div>
      <span>Por status</span>
      <div class="chips">${porStatus.map((s) => `<span class="chip inativo ${COR_STATUS[s.status] || ""}">${esc(ROTULO_STATUS[s.status] || s.status)}: ${s.total}</span>`).join("") || '<span class="dim">—</span>'}</div>
    </div>`;
}

/* ---------- Tabela (GET /mangas + filtros client-side) ---------- */
async function carregarTabela() {
  corpoTabela.innerHTML = '<tr><td colspan="9" class="dim">Carregando obras…</td></tr>';
  const resposta = await API.get("/mangas?pagina=1&tamanho_pagina=100&ordenar_por=id&direcao_ordenacao=asc");
  if (!resposta.ok) {
    mostrarErroSessao(resposta);
    return;
  }
  obras = resposta.dados.dados || [];
  renderizarTabela();
  carregarEstatisticas();
}

function renderizarTabela() {
  const busca = filtroBusca.value.trim().toLowerCase();
  const tipo = filtroTipo.value;
  const status = filtroStatus.value;

  const filtradas = obras.filter((m) => {
    const texto = `${m.titulo} ${m.autor} ${m.editora || ""} ${m.genero || ""}`.toLowerCase();
    return (!busca || texto.includes(busca)) && (!tipo || m.tipo === tipo) && (!status || m.status === status);
  });

  corpoTabela.innerHTML = filtradas.length
    ? filtradas.map((m) => `
      <tr data-id="${m.id}">
        <td class="mono dim">#${m.id}</td>
        <td><strong>${esc(m.titulo)}</strong><br><span class="dim" style="font-size:12px">${esc(m.volumetria || "")}</span></td>
        <td><span class="etiqueta etiqueta-${esc(m.tipo)}">${esc(ROTULO_TIPO[m.tipo] || m.tipo)}</span></td>
        <td>${esc(m.autor)}</td>
        <td class="dim">${esc(m.editora || "—")}</td>
        <td class="mono">${esc(m.ano_lancamento || "—")}</td>
        <td><span class="etiqueta etiqueta-status ${COR_STATUS[m.status] || ""}"><span class="ponto" style="background:currentColor"></span>${esc(ROTULO_STATUS[m.status] || m.status)}</span></td>
        <td class="mono dim">${esc(rotuloData(m.updated_at))}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-mini" data-acao="detalhe" type="button">Detalhes</button>
            <button class="btn btn-mini" data-acao="editar" type="button">Editar</button>
            <button class="btn btn-mini btn-perigo" data-acao="excluir" type="button">Excluir</button>
            <button class="btn btn-mini btn-borda" data-acao="curl" type="button">cURL</button>
          </div>
        </td>
      </tr>`).join("")
    : '<tr><td colspan="9" class="dim">Nenhuma obra corresponde aos filtros.</td></tr>';

  document.getElementById("rotulo-tabela").textContent =
    `Exibindo ${filtradas.length} de ${obras.length} obras carregadas (GET /api/v1/mangas?tamanho_pagina=100).`;
}

[filtroBusca, filtroTipo, filtroStatus].forEach((el) => el.addEventListener("input", renderizarTabela));
document.getElementById("btn-atualizar").addEventListener("click", async () => {
  await carregarTabela();
  toast("Dados sincronizados com o servidor.");
});
document.getElementById("btn-nova-obra").addEventListener("click", () => abrirModal(null));

/* Ações da tabela (delegação) */
corpoTabela.addEventListener("click", async (e) => {
  const botao = e.target.closest("[data-acao]");
  if (!botao) return;
  const linha = botao.closest("tr");
  const id = Number(linha.dataset.id);
  const obra = obras.find((m) => m.id === id);
  if (!obra) return;

  if (botao.dataset.acao === "detalhe") {
    detalharObra(id);
  } else if (botao.dataset.acao === "editar") {
    abrirModal(obra);
  } else if (botao.dataset.acao === "curl") {
    const curl = `curl -X ${botao.dataset.metodo || "GET"} "http://localhost:8081/api/v1/mangas/${id}" \\\n  -H "Authorization: Bearer ${tokenAtual()}" \\\n  -H "Accept: application/json"`;
    copiarTexto(curl, `cURL da obra #${id} copiado`);
  } else if (botao.dataset.acao === "excluir") {
    const ok = confirm(`Excluir "${obra.titulo}" (ID #${id})?\n\nEsta ação envia DELETE /api/v1/mangas/${id} e não pode ser desfeita.`);
    if (!ok) return;
    const resposta = await API.del("/mangas/" + id);
    if (resposta.ok) {
      toast(resposta.dados.mensagem + " (200 OK)");
      await carregarTabela();
    } else {
      mostrarErroSessao(resposta);
    }
  }
});

/* ---------- Modal criar/editar (POST/PUT) ---------- */
const modalObra = document.getElementById("modal-obra");
const formModal = document.getElementById("form-modal");
const CAMPOS_MODAL = ["titulo", "tipo", "autor", "editora", "status", "classificacao", "ano", "volumetria", "genero", "capa", "sinopse"];

function abrirModal(obra) {
  idEdicao = obra ? obra.id : null;
  limparErros(formModal);
  document.getElementById("modal-erro-geral").classList.add("oculto");
  CAMPOS_MODAL.forEach((campo) => {
    const el = document.getElementById("m-" + campo);
    if (el) el.value = obra ? (obra[mapearCampo(campo)] ?? "") : "";
  });
  document.getElementById("m-tipo").value = obra ? obra.tipo : "manga";
  document.getElementById("m-status").value = obra ? obra.status : "em_andamento";

  document.getElementById("modal-titulo").textContent = obra ? `Editar obra #${obra.id}` : "Cadastrar nova obra";
  document.getElementById("modal-metodo").textContent = obra ? `PUT /api/v1/mangas/${obra.id}` : "POST /api/v1/mangas";
  modalObra.classList.remove("oculto");
  document.getElementById("m-titulo").focus();
}

function mapearCampo(campo) {
  return { classificacao: "classificacao_etaria", ano: "ano_lancamento", capa: "url_capa" }[campo] || campo;
}

function fecharModal() {
  modalObra.classList.add("oculto");
  idEdicao = null;
}

document.getElementById("btn-fechar-modal").addEventListener("click", fecharModal);
document.getElementById("btn-cancelar-modal").addEventListener("click", fecharModal);
modalObra.addEventListener("click", (e) => { if (e.target === modalObra) fecharModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modalObra.classList.contains("oculto")) fecharModal(); });

function montarPayloadModal() {
  const ano = document.getElementById("m-ano").value;
  return {
    titulo: document.getElementById("m-titulo").value.trim(),
    tipo: document.getElementById("m-tipo").value,
    autor: document.getElementById("m-autor").value.trim(),
    editora: document.getElementById("m-editora").value.trim() || null,
    status: document.getElementById("m-status").value,
    classificacao_etaria: document.getElementById("m-classificacao").value || null,
    ano_lancamento: ano ? Number(ano) : null,
    volumetria: document.getElementById("m-volumetria").value.trim() || null,
    genero: document.getElementById("m-genero").value.trim() || null,
    url_capa: document.getElementById("m-capa").value.trim() || null,
    sinopse: document.getElementById("m-sinopse").value.trim() || null,
  };
}

formModal.addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErros(formModal);
  document.getElementById("modal-erro-geral").classList.add("oculto");

  const botao = document.getElementById("btn-enviar-modal");
  botao.disabled = true;
  botao.textContent = "Enviando…";

  const caminho = idEdicao ? "/mangas/" + idEdicao : "/mangas";
  const resposta = idEdicao
    ? await API.put(caminho, montarPayloadModal())
    : await API.post(caminho, montarPayloadModal());

  botao.disabled = false;
  botao.textContent = "Salvar";

  if (resposta.ok) {
    fecharModal();
    toast((resposta.dados.mensagem || "Operação concluída") + ` (${idEdicao ? 200 : 201})`);
    await carregarTabela();
  } else if (resposta.status === 401 || resposta.status === 403) {
    document.getElementById("modal-erro-geral").textContent =
      (resposta.dados.error || "Sessão inválida.") + ' Renove o token em /auth.';
    document.getElementById("modal-erro-geral").classList.remove("oculto");
  } else {
    mostrarErros(formModal, resposta.dados, resposta.dados.error || "Não foi possível salvar a obra.");
  }
});

/* ---------- Terminal de eventos (logs das chamadas) ---------- */
function registrarLog(evento) {
  const caixa = document.getElementById("logs");
  const primeiro = caixa.querySelector(".dim.mono");
  if (primeiro) primeiro.remove();

  const classeStatus = evento.status >= 500 ? "status-outro" : evento.status >= 400 ? "status-4xx" : evento.status === 0 ? "status-4xx" : "status-2xx";
  const linha = document.createElement("div");
  linha.className = "linha-log";
  linha.innerHTML = `
    <span class="log-esquerda">
      <span class="codigo-status ${classeStatus}">${evento.status || "ERR"}</span>
      <span class="metodo metodo-${evento.metodo.toLowerCase()}">${evento.metodo}</span>
      <span class="mono">${esc(evento.url)}</span>
    </span>
    <span class="mono dim">${evento.quando.toLocaleTimeString("pt-BR")}</span>`;
  caixa.prepend(linha);
  while (caixa.children.length > 30) caixa.lastChild.remove();
}

API.aoLogar(registrarLog);
document.getElementById("btn-limpar-logs").addEventListener("click", () => {
  document.getElementById("logs").innerHTML = '<span class="dim mono">Nenhum evento registrado nesta sessão.</span>';
});

/* ---------- Inicialização ---------- */
async function iniciar() {
  const sessaoOk = await carregarUsuario();
  if (!sessaoOk) return;
  await carregarEstatisticas();
  await carregarTabela();
}
