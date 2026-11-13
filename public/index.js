"use strict";

/* Landing page (/):
   - Contadores do hero  -> GET /api/v1/mangas/estatisticas
   - Vitrine por tipo    -> GET /api/v1/mangas | GET /api/v1/mangas/tipo/{tipo}
   - Busca instantânea   -> filtra os cartões já renderizados (igual à maquete)
   - Snippets da API     -> cópia para a área de transferência
*/

const gradeDestaques = document.getElementById("grade-destaques");
const vazioVitrine = document.getElementById("vitrine-vazio");

/* Contadores rápidos do hero (dados reais da API) */
async function carregarContadores() {
  const resposta = await API.get("/mangas/estatisticas");
  if (!resposta.ok) return;
  const estatisticas = resposta.dados;
  const porTipo = Object.fromEntries((estatisticas.por_tipo || []).map((i) => [i.tipo, i.total]));
  const valores = [
    estatisticas.total ?? 0,
    porTipo.manga || 0,
    porTipo.manhwa || 0,
    porTipo.gibi || 0,
  ];
  document.querySelectorAll("#hero-contadores .contador strong").forEach((el, i) => {
    el.textContent = valores[i] + "+";
  });
}

/* Vitrine de destaques por tipo */
async function carregarVitrine(tipo) {
  gradeDestaques.innerHTML = '<p class="dim">Carregando destaques…</p>';
  vazioVitrine.hidden = true;

  const resposta = tipo === "all"
    ? await API.get("/mangas?pagina=1&tamanho_pagina=6&ordenar_por=id&direcao_ordenacao=desc")
    : await API.get("/mangas/tipo/" + encodeURIComponent(tipo));

  gradeDestaques.innerHTML = "";
  const lista = (resposta.dados && resposta.dados.dados) || [];
  lista.slice(0, 6).forEach((m) => gradeDestaques.appendChild(criarCartaoObra(m)));
  vazioVitrine.hidden = lista.length > 0;
}

/* Abas da vitrine */
document.getElementById("abas-catalogo").addEventListener("click", (e) => {
  const botao = e.target.closest("[data-tipo]");
  if (!botao) return;
  document.querySelectorAll("#abas-catalogo .aba").forEach((b) => b.classList.toggle("ativo", b === botao));
  carregarVitrine(botao.dataset.tipo);
});

/* Busca instantânea: filtra os cartões renderizados e rola até a vitrine */
document.getElementById("form-busca-vitrine").addEventListener("submit", (e) => {
  e.preventDefault();
  const termo = document.getElementById("busca-vitrine").value.trim().toLowerCase();
  document.getElementById("vitrine").scrollIntoView({ behavior: "smooth" });
  let visiveis = 0;
  gradeDestaques.querySelectorAll(".cartao-obra").forEach((cartao) => {
    const bate = !termo || cartao.innerText.toLowerCase().includes(termo);
    cartao.style.display = bate ? "" : "none";
    if (bate) visiveis++;
  });
  vazioVitrine.hidden = visiveis > 0;
});

/* Snippets: alternância cURL / Fetch + cópia */
document.querySelectorAll(".aba-code").forEach((aba) => {
  aba.addEventListener("click", () => {
    document.querySelectorAll(".aba-code").forEach((b) => b.classList.toggle("ativo", b === aba));
    document.getElementById("snippet-curl").classList.toggle("oculto", aba.dataset.snippet !== "curl");
    document.getElementById("snippet-fetch").classList.toggle("oculto", aba.dataset.snippet !== "fetch");
  });
});
document.getElementById("btn-copiar-snippet").addEventListener("click", () => {
  const ativo = [...document.querySelectorAll("#snippet-curl, #snippet-fetch")].find((s) => !s.classList.contains("oculto"));
  copiarTexto(ativo.innerText, "Snippet copiado");
});

carregarContadores();
carregarVitrine("all");
