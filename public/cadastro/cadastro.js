"use strict";

/* Cadastro de obra (/cadastro):
   - Envio real     -> POST /api/v1/mangas (Authorization: Bearer <token>)
   - Prévia ao vivo -> cartão da capa + payload JSON que será enviado
   - Erros 422      -> exibidos por campo (data-erro)
*/

const form = document.getElementById("form-obra");
const btnEnviar = document.getElementById("btn-enviar");
const resultadoEnvio = document.getElementById("resultado-envio");

const valor = (id) => document.getElementById(id).value;

function generosSelecionados() {
  return [...document.querySelectorAll("#chips-generos .chip.ativo")].map((c) => c.dataset.genero);
}

/** Monta o corpo exato que será enviado ao POST /api/v1/mangas. */
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
    genero: generosSelecionados().join(", ") || null,
    classificacao_etaria: valor("classificacao_etaria") || null,
    status: valor("status"),
    url_capa: valor("url_capa").trim() || null,
  };
}

/* ---------- Prévia ao vivo ---------- */
function atualizarPrevia() {
  const payload = montarPayload();

  // Cartão de prévia
  document.getElementById("previa-titulo").textContent = payload.titulo || "Sem título";
  document.getElementById("previa-autor").textContent = payload.autor || "Autor desconhecido";
  document.getElementById("previa-ano").textContent = payload.ano_lancamento || "—";
  document.getElementById("previa-vol").textContent = payload.volumetria || "—";
  document.getElementById("previa-classificacao").textContent = rotuloClassificacao(payload.classificacao_etaria);
  document.getElementById("previa-tipo").textContent = (ROTULO_TIPO[payload.tipo] || payload.tipo).toUpperCase();
  document.getElementById("previa-tipo").className = "etiqueta etiqueta-" + payload.tipo;
  const pontoStatus = { em_andamento: "cor-ok ponto-pulsa", completo: "cor-info", hiatus: "cor-alerta", cancelado: "cor-erro" }[payload.status];
  document.getElementById("previa-status").innerHTML =
    `<span class="ponto ${pontoStatus}" style="background:currentColor"></span> ${esc(ROTULO_STATUS[payload.status] || payload.status)}`;

  // Imagem da capa
  const imagem = document.getElementById("previa-imagem");
  if (payload.url_capa) {
    imagem.innerHTML =
      `<img src="${esc(payload.url_capa)}" alt="Prévia da capa"
        onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;capa-fallback&quot;>?</span>')">`;
  } else {
    imagem.innerHTML = '<span class="capa-fallback">?</span>';
  }

  // Contador de sinopse
  document.getElementById("contador-sinopse").textContent = `${payload.sinopse ? payload.sinopse.length : 0} / 5000`;
}

/* Seletor de tipo */
document.querySelectorAll("[data-tipo-opcao]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("[data-tipo-opcao]").forEach((c) => c.classList.toggle("ativo", c === chip));
    document.getElementById("tipo").value = chip.dataset.tipoOpcao;
    atualizarPrevia();
  });
});

/* Seletor de status */
document.querySelectorAll("[data-status-opcao]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("[data-status-opcao]").forEach((c) => c.classList.toggle("ativo", c === chip));
    document.getElementById("status").value = chip.dataset.statusOpcao;
    atualizarPrevia();
  });
});

/* Gêneros multi-seleção */
document.querySelectorAll("#chips-generos .chip").forEach((chip) => {
  chip.addEventListener("click", () => { chip.classList.toggle("ativo"); atualizarPrevia(); });
});

/* Campos de texto atualizam a prévia */
form.addEventListener("input", atualizarPrevia);
form.addEventListener("change", atualizarPrevia);

/* ---------- Validação local (espelha validateMangaData do servidor) ---------- */
function validarLocalmente() {
  const erros = [];
  if (valor("titulo").trim().length < 2) erros.push("Título é obrigatório (mínimo 2 caracteres).");
  if (!TIPOS.includes(valor("tipo"))) erros.push("Tipo inválido (manga, manhwa ou gibi).");
  if (!valor("autor").trim()) erros.push("Autor é obrigatório.");
  const ano = valor("ano_lancamento");
  if (ano && (Number(ano) < 1900 || Number(ano) > new Date().getFullYear() + 5)) erros.push("Ano de lançamento inválido.");
  return erros;
}

document.getElementById("btn-validar").addEventListener("click", () => {
  const erros = validarLocalmente();
  resultadoEnvio.className = erros.length ? "aviso-caixa erro" : "aviso-caixa ok";
  resultadoEnvio.textContent = erros.length
    ? erros.join(" ")
    : "Validação local OK — todos os campos obrigatórios conformes com POST /api/v1/mangas.";
  resultadoEnvio.classList.remove("oculto");
});

/* ---------- Seed / Limpar ---------- */
document.getElementById("btn-seed").addEventListener("click", () => {
  document.getElementById("titulo").value = "Turma da Mônica Jovem: Novos Horizontes";
  document.getElementById("autor").value = "Mauricio de Sousa";
  document.getElementById("editora").value = "Panini Comics Brasil";
  document.getElementById("sinopse").value =
    "Mônica, Cebolinha, Magali e Cascão agora adolescentes desvendam mistérios e lidam com dramas da vida escolar no Bairro do Limoeiro, com traço influenciado pelos mangás.";
  document.getElementById("ano_lancamento").value = "2024";
  document.getElementById("volumetria").value = "12 volumes";
  document.getElementById("classificacao_etaria").value = "12";
  document.getElementById("url_capa").value = "https://m.media-amazon.com/images/I/716EGgqzyOL.jpg";
  document.querySelector('[data-tipo-opcao="gibi"]').click();
  document.querySelectorAll("#chips-generos .chip").forEach((chip) => {
    const quer = ["Comédia", "Aventura", "Fantasia"].includes(chip.dataset.genero);
    chip.classList.toggle("ativo", quer);
  });
  atualizarPrevia();
});

document.getElementById("btn-limpar").addEventListener("click", () => {
  form.reset();
  document.getElementById("tipo").value = "manga";
  document.getElementById("status").value = "em_andamento";
  document.querySelectorAll("[data-tipo-opcao]").forEach((c) => c.classList.toggle("ativo", c.dataset.tipoOpcao === "manga"));
  document.querySelectorAll("[data-status-opcao]").forEach((c) => c.classList.toggle("ativo", c.dataset.statusOpcao === "em_andamento"));
  document.querySelectorAll("#chips-generos .chip").forEach((c) => c.classList.remove("ativo"));
  limparErros(form);
  resultadoEnvio.classList.add("oculto");
  atualizarPrevia();
});

/* ---------- Envio (POST /api/v1/mangas) ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErros(form);
  resultadoEnvio.classList.add("oculto");

  const erros = validarLocalmente();
  if (erros.length) {
    resultadoEnvio.className = "aviso-caixa erro";
    resultadoEnvio.textContent = erros.join(" ");
    resultadoEnvio.classList.remove("oculto");
    return;
  }
  if (!tokenAtual()) {
    resultadoEnvio.className = "aviso-caixa erro";
    resultadoEnvio.innerHTML = 'Você precisa estar autenticado para cadastrar obras. <a href="/auth">Entrar / criar conta →</a>';
    resultadoEnvio.classList.remove("oculto");
    return;
  }

  btnEnviar.disabled = true;
  btnEnviar.textContent = "Enviando payload…";
  const resposta = await API.post("/mangas", montarPayload());
  btnEnviar.disabled = false;
  btnEnviar.textContent = "＋ Cadastrar obra";

  if (resposta.ok) {
    const manga = resposta.dados.manga;
    resultadoEnvio.className = "aviso-caixa ok";
    resultadoEnvio.innerHTML =
      `${esc(resposta.dados.mensagem)} — <strong>#${manga.id} ${esc(manga.titulo)}</strong>. ` +
      `<a href="/catalogo">Ver no catálogo</a> ou <a href="/editar?id=${manga.id}">editar agora</a>.`;
    resultadoEnvio.classList.remove("oculto");
    toast(`Obra #${manga.id} criada com sucesso!`);
  } else {
    mostrarErros(form, resposta.dados, resposta.dados.error || "Não foi possível cadastrar a obra.");
    if (resposta.status === 401 || resposta.status === 403) {
      resultadoEnvio.className = "aviso-caixa erro";
      resultadoEnvio.innerHTML = 'Sessão expirada ou ausente. <a href="/auth">Renovar o token JWT →</a>';
      resultadoEnvio.classList.remove("oculto");
    }
  }
});

atualizarPrevia();
