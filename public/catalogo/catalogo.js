"use strict";

/* Catálogo público (/catalogo):
   - Listagem paginada -> GET /api/v1/mangas?pagina&tamanho_pagina&busca&tipo&status&ordenar_por&direcao_ordenacao
   - Contadores        -> GET /api/v1/mangas/estatisticas
   - Detalhe (modal)   -> GET /api/v1/mangas/{id}
   - Gêneros           -> filtro client-side sobre a página carregada
                          (a API expõe também GET /api/v1/mangas/genero/{genero})
*/

const estado = {
  busca: "",
  tipo: "all",
  status: "all",
  generos: new Set(),
  ordenar: "id",
  direcao: "asc",
  pagina: 1,
  tamanho: 6,
};

const campoBusca = document.getElementById("campo-busca");
const btnLimparBusca = document.getElementById("btn-limpar-busca");
const gradeObras = document.getElementById("grade-obras");
const bannerVazio = document.getElementById("banner-vazio");

/* ---------- Contadores das etiquetas de filtro ---------- */
async function carregarEstatisticas() {
  const resposta = await API.get("/mangas/estatisticas");
  if (!resposta.ok) return;
  const estatisticas = resposta.dados;
  const porTipo = Object.fromEntries((estatisticas.por_tipo || []).map((i) => [i.tipo, i.total]));
  const porStatus = Object.fromEntries((estatisticas.por_status || []).map((i) => [i.status, i.total]));
  document.querySelectorAll("[data-conta-tipo]").forEach((el) => {
    el.textContent = el.dataset.contaTipo === "all" ? (estatisticas.total ?? 0) : (porTipo[el.dataset.contaTipo] || 0);
  });
  document.querySelectorAll("[data-conta-status]").forEach((el) => {
    el.textContent = el.dataset.contaStatus === "all" ? (estatisticas.total ?? 0) : (porStatus[el.dataset.contaStatus] || 0);
  });
  document.getElementById("total-indexados").textContent = estatisticas.total ?? 0;
}

/* ---------- Montagem da consulta ---------- */
function montarConsulta() {
  const p = new URLSearchParams();
  p.set("pagina", estado.pagina);
  p.set("tamanho_pagina", estado.tamanho);
  if (estado.busca) p.set("busca", estado.busca);
  if (estado.tipo !== "all") p.set("tipo", estado.tipo);
  if (estado.status !== "all") p.set("status", estado.status);
  p.set("ordenar_por", estado.ordenar);
  p.set("direcao_ordenacao", estado.direcao);
  return "/mangas?" + p.toString();
}

/* ---------- Carregar resultados ---------- */
async function carregar() {
  gradeObras.innerHTML = '<p class="dim">Carregando acervo…</p>';

  const resposta = await API.get(montarConsulta());
  if (!resposta.ok) {
    gradeObras.innerHTML = "";
    bannerVazio.hidden = false;
    bannerVazio.querySelector("p").textContent = resposta.dados.error || "Erro ao carregar o catálogo.";
    return;
  }

  let lista = resposta.dados.dados || [];

  // Filtro de gênero aplicado sobre a página carregada
  if (estado.generos.size > 0) {
    lista = lista.filter((m) => {
      const generosObra = (m.genero || "").toLowerCase();
      return [...estado.generos].every((g) => generosObra.includes(g.toLowerCase()));
    });
  }

  gradeObras.innerHTML = "";
  lista.forEach((m) => gradeObras.appendChild(criarCartaoObra(m)));

  document.getElementById("rotulo-resultados").textContent =
    `Exibindo ${lista.length} de ${resposta.dados.total_registros} obras`;
  atualizarPaginacao(resposta.dados.pagina_atual, resposta.dados.total_paginas);

  const semResultados = lista.length === 0;
  bannerVazio.hidden = !semResultados;
  if (semResultados) bannerVazio.querySelector("p").textContent =
    "Tente remover alguns filtros ou buscar por termos mais genéricos como \"Ação\", \"Oda\" ou \"Turma\".";
}

/* ---------- Paginação ---------- */
function atualizarPaginacao(atual, total) {
  total = Math.max(total || 1, 1);
  document.getElementById("pagina-atual").textContent = atual;
  document.getElementById("total-paginas").textContent = total;
  document.getElementById("btn-anterior").disabled = atual <= 1;
  document.getElementById("btn-proximo").disabled = atual >= total;

  const numeros = document.getElementById("numeros-pagina");
  numeros.innerHTML = "";
  let paginas = [];
  if (total <= 7) {
    paginas = Array.from({ length: total }, (_, i) => i + 1);
  } else {
    paginas = [1, atual - 1, atual, atual + 1, total].filter((p, i, arr) => p >= 1 && p <= total && arr.indexOf(p) === i).sort((a, b) => a - b);
    paginas = paginas[0] !== 1 ? [1, "…", ...paginas.slice(1)] : paginas;
    const ultima = paginas[paginas.length - 1];
    if (ultima !== total) paginas = [...paginas.slice(0, -1), "…", total];
  }
  paginas.forEach((p) => {
    if (p === "…") {
      const pontos = document.createElement("span");
      pontos.className = "ellipsis mono";
      pontos.textContent = "…";
      numeros.appendChild(pontos);
      return;
    }
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "btn btn-mini" + (p === atual ? " ativo" : "");
    botao.textContent = p;
    botao.addEventListener("click", () => { estado.pagina = p; carregar(); });
    numeros.appendChild(botao);
  });
}

/* ---------- Eventos ---------- */
function aplicarBusca() {
  estado.busca = campoBusca.value.trim();
  btnLimparBusca.classList.toggle("oculto", !estado.busca);
  estado.pagina = 1;
  carregar();
}
document.getElementById("btn-filtrar").addEventListener("click", aplicarBusca);
campoBusca.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); aplicarBusca(); } });
btnLimparBusca.addEventListener("click", () => { campoBusca.value = ""; aplicarBusca(); campoBusca.focus(); });

/* Trilho de tipos */
document.getElementById("trilho-tipos").addEventListener("click", (e) => {
  const chip = e.target.closest("[data-tipo]");
  if (!chip) return;
  document.querySelectorAll("#trilho-tipos .chip").forEach((c) => c.classList.toggle("ativo", c === chip));
  estado.tipo = chip.dataset.tipo;
  estado.pagina = 1;
  carregar();
});

/* Status (radios) */
document.querySelectorAll('#grupo-status input[name="status"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    estado.status = radio.value;
    estado.pagina = 1;
    carregar();
  });
});

/* Gêneros (chips — filtro na página carregada) */
document.querySelectorAll("#chips-generos .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const genero = chip.dataset.genero;
    if (estado.generos.has(genero)) { estado.generos.delete(genero); chip.classList.remove("ativo"); }
    else { estado.generos.add(genero); chip.classList.add("ativo"); }
    carregar();
  });
});

/* Ordenação (server-side) */
document.getElementById("ordenacao").addEventListener("change", (e) => {
  const [campo, direcao] = e.target.value.split("-");
  estado.ordenar = campo;
  estado.direcao = direcao;
  estado.pagina = 1;
  carregar();
});

/* Itens por página */
document.getElementById("tamanho-pagina").addEventListener("change", (e) => {
  estado.tamanho = Number(e.target.value);
  estado.pagina = 1;
  carregar();
});

/* Anterior / Próxima */
document.getElementById("btn-anterior").addEventListener("click", () => { estado.pagina--; carregar(); });
document.getElementById("btn-proximo").addEventListener("click", () => { estado.pagina++; carregar(); });

/* Resetar filtros */
function resetarFiltros() {
  estado.busca = ""; estado.tipo = "all"; estado.status = "all";
  estado.generos.clear(); estado.ordenar = "id"; estado.direcao = "asc";
  estado.pagina = 1; estado.tamanho = Number(document.getElementById("tamanho-pagina").value);

  campoBusca.value = "";
  btnLimparBusca.classList.add("oculto");
  document.getElementById("ordenacao").value = "id-asc";
  document.querySelectorAll("#trilho-tipos .chip").forEach((c) => c.classList.toggle("ativo", c.dataset.tipo === "all"));
  document.querySelector('#grupo-status input[value="all"]').checked = true;
  document.querySelectorAll("#chips-generos .chip").forEach((c) => c.classList.remove("ativo"));
  carregar();
}
document.getElementById("btn-resetar").addEventListener("click", resetarFiltros);
document.getElementById("btn-limpar-vazio").addEventListener("click", resetarFiltros);

/* ---------- Inicialização + deep-link (?busca=&tipo=&status=) ---------- */
(async () => {
  const params = new URLSearchParams(location.search);
  if (params.get("busca")) { estado.busca = params.get("busca"); campoBusca.value = estado.busca; btnLimparBusca.classList.remove("oculto"); }
  if (TIPOS.includes(params.get("tipo"))) {
    estado.tipo = params.get("tipo");
    document.querySelectorAll("#trilho-tipos .chip").forEach((c) => c.classList.toggle("ativo", c.dataset.tipo === estado.tipo));
  }
  if (STATUS.includes(params.get("status"))) {
    estado.status = params.get("status");
    const radio = document.querySelector(`#grupo-status input[value="${estado.status}"]`);
    if (radio) radio.checked = true;
  }
  await carregarEstatisticas();
  await carregar();
})();
