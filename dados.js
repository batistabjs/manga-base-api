const fs = require('fs');
const path = require('path');

const DADOS_DIR = path.join(__dirname, 'dados');

function ensureDadosDir() {
  if (!fs.existsSync(DADOS_DIR)) {
    fs.mkdirSync(DADOS_DIR, { recursive: true });
  }
}

function readJson(filename) {
  ensureDadosDir();
  const filePath = path.join(DADOS_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function writeJson(filename, data) {
  ensureDadosDir();
  const filePath = path.join(DADOS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function getProximoId(items) {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id)) + 1;
}

// Mangás
function getMangas() {
  return readJson('mangas.json');
}

function saveMangas(mangas) {
  writeJson('mangas.json', mangas);
}

function getMangaById(id) {
  return getMangas().find((m) => m.id === id) || null;
}

function createManga(data) {
  const mangas = getMangas();
  const now = new Date().toISOString();
  const manga = {
    id: getProximoId(mangas),
    titulo: data.titulo,
    tipo: data.tipo,
    autor: data.autor,
    editora: data.editora || null,
    sinopse: data.sinopse || null,
    ano_lancamento: data.ano_lancamento || null,
    status: data.status || 'em_andamento',
    volumetoria: data.volumetoria || null,
    genero: data.genero || null,
    classificacao_etaria: data.classificacao_etaria || null,
    url_capa: data.url_capa || null,
    created_at: now,
    updated_at: now,
  };
  mangas.push(manga);
  saveMangas(mangas);
  return manga;
}

function updateManga(id, data) {
  const mangas = getMangas();
  const index = mangas.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const camposPermitidos = [
    'titulo', 'tipo', 'autor', 'editora', 'sinopse',
    'ano_lancamento', 'status', 'volumetoria', 'genero',
    'classificacao_etaria', 'url_capa',
  ];

  for (const campo of camposPermitidos) {
    if (campo in data) {
      mangas[index][campo] = data[campo];
    }
  }
  mangas[index].updated_at = new Date().toISOString();
  saveMangas(mangas);
  return mangas[index];
}

function deleteManga(id) {
  const mangas = getMangas();
  const index = mangas.findIndex((m) => m.id === id);
  if (index === -1) return false;
  mangas.splice(index, 1);
  saveMangas(mangas);
  return true;
}

// Usuários
function getUsuarios() {
  return readJson('usuarios.json');
}

function saveUsuarios(usuarios) {
  writeJson('usuarios.json', usuarios);
}

function getUsuarioById(id) {
  const usuario = getUsuarios().find((u) => u.id === id);
  if (!usuario) return null;
  const { senha, ...rest } = usuario;
  return rest;
}

function getUsuarioByEmail(email) {
  return getUsuarios().find((u) => u.email === email) || null;
}

function createUsuario(data) {
  const crypto = require('crypto');
  const usuarios = getUsuarios();
  const now = new Date().toISOString();
  const usuario = {
    id: getProximoId(usuarios),
    nome: data.nome,
    email: data.email,
    nome_usuario: data.nome_usuario,
    senha: crypto.createHash('sha256').update(data.senha).digest('hex'),
    created_at: now,
    updated_at: now,
  };
  usuarios.push(usuario);
  saveUsuarios(usuarios);
  const { senha, ...rest } = usuario;
  return rest;
}

module.exports = {
  getMangas,
  getMangaById,
  createManga,
  updateManga,
  deleteManga,
  getUsuarios,
  getUsuarioById,
  getUsuarioByEmail,
  createUsuario,
};
