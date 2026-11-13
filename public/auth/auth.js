"use strict";

/* Tela de autenticação (/auth):
   - Entrar     -> POST /api/v1/auth/login    (retorna token_gerado)
   - Cadastrar  -> POST /api/v1/auth/cadastro (retorna token_gerado)
   - O token fica salvo no localStorage e, após autenticar, o usuário é levado ao dashboard.
   - Sair fica no menu superior (botão "Sair").
*/

const formEntrada = document.getElementById("form-entrada");
const formCadastro = document.getElementById("form-cadastro");
const avisoSessao = document.getElementById("aviso-sessao");

/* ---------- Abas Entrar / Cadastrar ---------- */
function selecionarAba(cadastro) {
  document.getElementById("btn-tab-entrada").classList.toggle("ativo", !cadastro);
  document.getElementById("btn-tab-cadastro").classList.toggle("ativo", cadastro);
  formEntrada.classList.toggle("oculto", cadastro);
  formCadastro.classList.toggle("oculto", !cadastro);
  limparErros(formEntrada);
  limparErros(formCadastro);
}
document.getElementById("btn-tab-entrada").addEventListener("click", () => selecionarAba(false));
document.getElementById("btn-tab-cadastro").addEventListener("click", () => selecionarAba(true));

/* ---------- Mostrar/ocultar senha ---------- */
document.querySelectorAll("[data-alternar]").forEach((botao) => {
  botao.addEventListener("click", () => {
    const campo = document.getElementById(botao.dataset.alternar);
    campo.type = campo.type === "password" ? "text" : "password";
  });
});

/* ---------- Contas seed: preenchem o formulário e entram ---------- */
document.querySelectorAll("[data-seed]").forEach((botao) => {
  botao.addEventListener("click", () => {
    const seed = JSON.parse(botao.dataset.seed);
    document.getElementById("login-email").value = seed.email;
    document.getElementById("login-senha").value = seed.senha;
    enviarEntrada();
  });
});

/* ---------- Redirecionamento pós-autenticação ---------- */
function irParaDashboard() {
  location.href = "/dashboard";
}

/* ---------- Entrar ---------- */
async function enviarEntrada() {
  limparErros(formEntrada);
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  if (!email || !senha) {
    mostrarErros(formEntrada, {}, "Informe e-mail e senha.");
    return;
  }

  const resposta = await API.post("/auth/login", { email, senha });
  if (resposta.ok) {
    salvarSessao(resposta.dados.token_gerado, resposta.dados.usuario);
    irParaDashboard();
  } else {
    mostrarErros(formEntrada, resposta.dados, "Não foi possível entrar.");
  }
}
formEntrada.addEventListener("submit", (e) => { e.preventDefault(); enviarEntrada(); });

/* ---------- Cadastrar ---------- */
async function enviarCadastro() {
  limparErros(formCadastro);
  const corpo = {
    nome: document.getElementById("cad-nome").value.trim(),
    email: document.getElementById("cad-email").value.trim(),
    nome_usuario: document.getElementById("cad-usuario").value.trim(),
    senha: document.getElementById("cad-senha").value,
  };
  if (!corpo.nome || !corpo.email || !corpo.nome_usuario || !corpo.senha) {
    mostrarErros(formCadastro, {}, "Preencha todos os campos.");
    return;
  }

  const resposta = await API.post("/auth/cadastro", corpo);
  if (resposta.ok) {
    salvarSessao(resposta.dados.token_gerado, resposta.dados.usuario);
    irParaDashboard();
  } else {
    mostrarErros(formCadastro, resposta.dados, "Não foi possível cadastrar.");
  }
}
formCadastro.addEventListener("submit", (e) => { e.preventDefault(); enviarCadastro(); });

/* ---------- Sessão existente ---------- */
if (tokenAtual()) {
  const usuario = usuarioAtual();
  avisoSessao.innerHTML =
    `Sessão ativa como <strong>${esc(usuario?.nome || "usuário")}</strong>. ` +
    `<a href="/dashboard">Ir para o dashboard →</a> ou entre com outra conta.`;
  avisoSessao.classList.remove("oculto");
}
