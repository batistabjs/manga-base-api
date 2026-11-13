"use strict";

/* =========================================================
   Manga Base — utilidades comuns
   - Cliente HTTP da API (/api/v1) com Bearer JWT
   - Sessão (token + usuário) no localStorage
   - Componentes compartilhados: menu, rodapé, toast,
     cartão de obra e modal "Ver detalhes"
   ========================================================= */

const CHAVE_TOKEN = "manga_base_token";
const CHAVE_USUARIO = "manga_base_usuario";
const CHAVE_TEMA = "manga_base_tema";

const TIPOS = ["manga", "manhwa", "gibi"];
const STATUS = ["em_andamento", "completo", "hiatus", "cancelado"];
const CLASSIFICACOES = ["L", "10", "12", "16", "18"];

const ROTULO_TIPO = { manga: "Mangá", manhwa: "Manhwa", gibi: "Gibi" };
const ROTULO_STATUS = { em_andamento: "Em andamento", completo: "Completo", hiatus: "Em hiatus", cancelado: "Cancelado" };
const COR_STATUS = { em_andamento: "cor-ok", completo: "cor-info", hiatus: "cor-alerta", cancelado: "cor-erro" };

/* ---------------- Sessão (JWT) ---------------- */

function tokenAtual() {
  return localStorage.getItem(CHAVE_TOKEN) || "";
}

function usuarioAtual() {
  try { return JSON.parse(localStorage.getItem(CHAVE_USUARIO) || "null"); }
  catch { return null; }
}

function salvarSessao(token, usuario) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario || null));
  document.dispatchEvent(new Event("manga-base:sessao"));
}

function encerrarSessao() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
  document.dispatchEvent(new Event("manga-base:sessao"));
}

/** Decodifica header/payload de um JWT (sem verificar assinatura — para exibição). */
function decodificarJwt(token) {
  try {
    const dec = (parte) => JSON.parse(atob(parte.replace(/-/g, "+").replace(/_/g, "/")));
    const partes = token.split(".");
    return { header: dec(partes[0]), payload: dec(partes[1]) };
  } catch { return null; }
}

/* ---------------- Rótulos auxiliares ---------------- */

function rotuloClassificacao(valor) {
  if (!valor) return "—";
  if (valor === "L") return "Livre";
  return String(valor).endsWith("+") ? valor : valor + "+";
}

function rotuloData(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

/* ---------------- Cliente HTTP da API ---------------- */

const API = {
  /** Ouvintes de log de requisições (usado pelo terminal do dashboard). */
  ouvintes: [],
  aoLogar(fn) { API.ouvintes.push(fn); },

  /** Executa uma requisição e devolve { status, ok, dados }. */
  async pedir(metodo, caminho, corpo) {
    const url = "/api/v1" + caminho;
    const opcoes = { method: metodo, headers: {} };
    if (corpo !== undefined) {
      opcoes.headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(corpo);
    }
    const token = tokenAtual();
    if (token) opcoes.headers["Authorization"] = "Bearer " + token;

    let status = 0;
    let dados = { error: "Falha de rede — o servidor não respondeu." };
    try {
      const resposta = await fetch(url, opcoes);
      status = resposta.status;
      try { dados = await resposta.json(); } catch { /* resposta sem corpo */ }
    } catch (erro) {
      dados = { error: "Falha de rede: " + erro.message };
    }

    const evento = { metodo, url, status, quando: new Date() };
    API.ouvintes.forEach((fn) => { try { fn(evento); } catch { /* ouvinte com erro */ } });
    return { status, ok: status >= 200 && status < 300, dados: dados || {} };
  },
};

API.get = (caminho) => API.pedir("GET", caminho);
API.post = (caminho, corpo) => API.pedir("POST", caminho, corpo || {});
API.put = (caminho, corpo) => API.pedir("PUT", caminho, corpo || {});
API.del = (caminho) => API.pedir("DELETE", caminho);

/* ---------------- Utilidades de UI ---------------- */

function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function toast(mensagem, tipo = "ok") {
  let caixa = document.getElementById("toasts");
  if (!caixa) {
    caixa = document.createElement("div");
    caixa.id = "toasts";
    caixa.className = "toasts";
    document.body.appendChild(caixa);
  }
  const item = document.createElement("div");
  item.className = "toast " + tipo;
  item.textContent = mensagem;
  caixa.appendChild(item);
  setTimeout(() => item.remove(), 3400);
}

async function copiarTexto(texto, mensagem = "Copiado para a área de transferência") {
  try {
    await navigator.clipboard.writeText(texto);
    toast(mensagem);
    return true;
  } catch {
    toast("Não foi possível copiar", "erro");
    return false;
  }
}

/** JSON colorido para blocos <pre class="json-caixa">. */
function destacarJson(valor) {
  const json = JSON.stringify(valor, null, 2)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /("(\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?/g,
    (trecho) => {
      let classe = "numero";
      if (trecho.startsWith('"')) classe = trecho.endsWith(":") ? "chave" : "texto";
      else if (trecho === "true" || trecho === "false" || trecho === "null") classe = "nulo";
      return `<span class="${classe}">${trecho}</span>`;
    }
  );
}

/** Exibe erros de validação (422) por campo: <span data-erro="campo">. */
function limparErros(container) {
  container.querySelectorAll("[data-erro]").forEach((el) => (el.textContent = ""));
  container.querySelectorAll(".aviso-caixa[data-erro-geral]").forEach((el) => el.remove());
}

/** Preenche os spans [data-erro] com base no corpo { errors: { campo: [msgs] } }. */
function mostrarErros(container, dados, mensagemPadrao = "") {
  let algum = false;
  const erros = dados && dados.errors;
  if (erros && typeof erros === "object") {
    for (const [campo, mensagens] of Object.entries(erros)) {
      const alvo = container.querySelector(`[data-erro="${campo}"]`);
      if (alvo) { alvo.textContent = Array.isArray(mensagens) ? mensagens.join(" ") : String(mensagens); algum = true; }
    }
  }
  if (!algum) {
    const aviso = document.createElement("div");
    aviso.className = "aviso-caixa erro";
    aviso.dataset.erroGeral = "1";
    aviso.textContent = (dados && (dados.error || dados.mensagem)) || mensagemPadrao || "Não foi possível concluir a operação.";
    container.prepend(aviso);
  }
}

/* ---------------- Cartão de obra ---------------- */

function montarCapa(m) {
  const inicial = esc((m.titulo || "?").charAt(0).toUpperCase());
  if (m.url_capa) {
    return `<img src="${esc(m.url_capa)}" alt="Capa de ${esc(m.titulo)}" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
      <span class="capa-fallback" style="display:none">${inicial}</span>`;
  }
  return `<span class="capa-fallback">${inicial}</span>`;
}

/** Cria um cartão de obra com selos de tipo/status e botão "Ver detalhes". */
function criarCartaoObra(m) {
  const cartao = document.createElement("article");
  cartao.className = "cartao-obra";
  cartao.dataset.id = m.id;
  cartao.innerHTML = `
    <div class="capa">
      ${montarCapa(m)}
      <div class="selos">
        <span class="etiqueta etiqueta-${esc(m.tipo)}">${esc(ROTULO_TIPO[m.tipo] || m.tipo)}</span>
        <span class="selo-nota">${esc(rotuloClassificacao(m.classificacao_etaria))}</span>
      </div>
      <span class="selo-status ${COR_STATUS[m.status] || ""}">${esc(ROTULO_STATUS[m.status] || m.status)}</span>
    </div>
    <div class="cartao-obra-corpo">
      <div class="linha-titulo">
        <h3>${esc(m.titulo)}</h3>
        <span class="mono dim">${esc(m.volumetria || "")}</span>
      </div>
      <p class="autor">${esc(m.autor)} • ${esc(m.ano_lancamento || "—")}</p>
      <p class="sinopse">${esc(m.sinopse || "Sem sinopse cadastrada.")}</p>
      <div class="cartao-obra-acoes">
        <span class="genero-mini">${esc((m.genero || "").split(",")[0].trim() || "—")}</span>
        <button class="btn btn-mini" type="button" data-detalhe="${m.id}">Ver detalhes ▸</button>
      </div>
    </div>`;
  cartao.querySelector("[data-detalhe]").addEventListener("click", () => detalharObra(m.id));
  return cartao;
}

/* ---------------- Modal "Ver detalhes" (GET /mangas/{id}) ---------------- */

async function detalharObra(id) {
  const fundo = document.createElement("div");
  fundo.className = "modal-fundo";
  fundo.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-cabecalho">
        <strong>Carregando obra…</strong>
        <button class="btn btn-mini" type="button" data-fechar>✕ Fechar (Esc)</button>
      </div>
      <div class="modal-corpo">
        <p class="mono dim">GET /api/v1/mangas/${id} …</p>
      </div>
    </div>`;
  const fechar = () => {
    fundo.remove();
    document.removeEventListener("keydown", aoTeclar);
  };
  const aoTeclar = (e) => { if (e.key === "Escape") fechar(); };
  fundo.addEventListener("click", (e) => { if (e.target === fundo) fechar(); });
  fundo.querySelector("[data-fechar]").addEventListener("click", fechar);
  document.addEventListener("keydown", aoTeclar);
  document.body.appendChild(fundo);

  const resposta = await API.get("/mangas/" + id);
  const corpo = fundo.querySelector(".modal-corpo");
  if (!resposta.ok) {
    corpo.innerHTML = `<div class="aviso-caixa erro">${esc(resposta.dados.error || "Erro ao carregar a obra.")}</div>`;
    return;
  }
  const m = resposta.dados;
  fundo.querySelector("strong").textContent = `${m.titulo} (#${m.id})`;
  const generos = (m.genero || "").split(",").map((g) => g.trim()).filter(Boolean);
  corpo.innerHTML = `
    <div class="detalhe-grade">
      <div class="detalhe-capa">${montarCapa(m)}</div>
      <div>
        <p class="lista-dados">
          <span class="rotulo-inline">Identificação</span>
          <span class="mono">#${m.id}</span> •
          <span class="etiqueta etiqueta-${esc(m.tipo)}">${esc(ROTULO_TIPO[m.tipo] || m.tipo)}</span> •
          <span class="etiqueta etiqueta-status ${COR_STATUS[m.status] || ""}">
            <span class="ponto ponto-pulsa" style="background:currentColor"></span>${esc(ROTULO_STATUS[m.status] || m.status)}
          </span>
        </p>
        <p class="lista-dados">
          <span class="rotulo-inline">Créditos</span>
          Autor: <strong>${esc(m.autor)}</strong>
          ${m.editora ? ` • Editora: <strong>${esc(m.editora)}</strong>` : ""}
        </p>
        <p class="lista-dados">
          <span class="rotulo-inline">Publicação</span>
          Ano: <strong>${esc(m.ano_lancamento || "—")}</strong> •
          Extensão: <strong>${esc(m.volumetria || "—")}</strong> •
          Classificação: <strong>${esc(rotuloClassificacao(m.classificacao_etaria))}</strong>
        </p>
        <p class="lista-dados">
          <span class="rotulo-inline">Registro</span>
          <span class="mono dim">criado em ${esc(rotuloData(m.created_at))} • atualizado em ${esc(rotuloData(m.updated_at))}</span>
        </p>
      </div>
    </div>
    <div>
      <span class="rotulo-inline">Sinopse</span>
      <p style="margin:6px 0 0">${esc(m.sinopse || "Sem sinopse cadastrada.")}</p>
    </div>
    ${generos.length ? `<div><span class="rotulo-inline">Gêneros</span><div class="chips" style="margin-top:6px">${generos.map((g) => `<span class="chip inativo">${esc(g)}</span>`).join("")}</div></div>` : ""}
    <div>
      <div class="cabeca-json">
        <span class="mono dim">Resposta da API — GET /api/v1/mangas/${m.id}</span>
        <button class="btn btn-mini" type="button" data-copiar-json>Copiar JSON</button>
      </div>
      <pre class="json-caixa" style="margin-top:8px">${destacarJson(m)}</pre>
    </div>`;
  corpo.querySelector("[data-copiar-json]").addEventListener("click", () => copiarTexto(JSON.stringify(m, null, 2), "JSON da obra copiado"));
}

/* ---------------- Menu e rodapé ---------------- */

function aplicarTema() {
  document.documentElement.classList.toggle("clara", localStorage.getItem(CHAVE_TEMA) === "clara");
}

function alternarTema() {
  const clara = document.documentElement.classList.toggle("clara");
  localStorage.setItem(CHAVE_TEMA, clara ? "clara" : "escura");
}

function construirMenu() {
  const topo = document.getElementById("topo");
  if (!topo) return;
  const pagina = document.body.dataset.pagina || "";
  const usuario = usuarioAtual();
  const links = [
    ["/", "Início", "inicio"],
    ["/catalogo", "Catálogo", "catalogo"],
  ];
  topo.innerHTML = `
    <div class="container topo-interno">
      <a class="logo" href="/"><span class="marca">MB</span> Manga Base</a>
      <nav class="menu">
        ${links.map(([href, nome, id]) => `<a href="${href}"${id === pagina ? ' class="ativo"' : ""}>${nome}</a>`).join("")}
      </nav>
      <div class="topo-acoes">
        <button class="btn btn-mini" type="button" id="btn-tema" title="Alternar tema claro/escuro">◐ Tema</button>
        ${usuario
          ? `<span class="usuario-chip" title="${esc(usuario.email || "")}">● ${esc(usuario.nome || usuario.nome_usuario || "Usuário")}</span>
             <a class="btn btn-mini btn-borda" href="/auth">Meu token</a>
             <button class="btn btn-mini" type="button" id="btn-sair">Sair</button>`
          : `<a class="btn btn-mini btn-primario" href="/auth">Entrar / Cadastrar</a>`}
      </div>
    </div>`;
  topo.querySelector("#btn-tema").addEventListener("click", alternarTema);
  const botaoSair = topo.querySelector("#btn-sair");
  if (botaoSair) {
    botaoSair.addEventListener("click", () => {
      encerrarSessao();
      toast("Sessão encerrada. Token removido do navegador.");
      construirMenu();
    });
  }
}

function construirRodape() {
  const rodape = document.getElementById("rodape");
  if (!rodape) return;
  rodape.innerHTML = `
    <div class="container rodape-interno">
      <span>© 2026 Manga Base Hub — API RESTful de Mangás, Manhwas e Gibis (MIT).</span>
      <span class="mono">localhost:8081 • /api/v1</span>
      <span><a href="/catalogo">Acervo</a> · <a href="/#documentacao">Endpoints</a> · <a href="/auth">Conta</a></span>
    </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarTema();
  construirMenu();
  construirRodape();
});
