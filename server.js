const http = require('http');
const url = require('url');
const jwt = require('./jwt');
const dados = require('./dados');
const crypto = require('crypto');

const PORT = 8081;

const TIPOS_PERMITIDOS = ['manga', 'manhwa', 'gibi'];
const STATUS_PERMITIDOS = ['em_andamento', 'completo', 'hiatus', 'cancelado'];
const CLASSIFICACOES_ETARIAS = ['L', '10', '12', '16', '18'];

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function checkAuth(req) {
  const token = jwt.getTokenFromHeader(req);
  if (!token) return { error: 'Usuário não autenticado', status: 401 };
  const userId = jwt.getUserIdFromToken(token);
  if (!userId) return { error: 'Chave de acesso inválida', status: 403 };
  return { userId };
}

function parseQuery(queryString) {
  const params = {};
  if (!queryString) return params;
  for (const [key, value] of new URLSearchParams(queryString)) {
    params[key] = value;
  }
  return params;
}

function matchRoute(method, path) {
  const routes = {
    GET: [
      { pattern: /^\/mangas\/tipo\/([^/]+)$/, handler: 'byTipo' },
      { pattern: /^\/mangas\/autor\/([^/]+)$/, handler: 'byAutor' },
      { pattern: /^\/mangas\/status\/([^/]+)$/, handler: 'byStatus' },
      { pattern: /^\/mangas\/genero\/([^/]+)$/, handler: 'byGenero' },
      { pattern: /^\/mangas\/ano\/(\d+)$/, handler: 'byAno' },
      { pattern: /^\/mangas\/buscar$/, handler: 'search' },
      { pattern: /^\/mangas\/estatisticas$/, handler: 'stats' },
      { pattern: /^\/mangas\/(\d+)$/, handler: 'show' },
      { pattern: /^\/mangas$/, handler: 'index' },
      { pattern: /^\/auth\/me$/, handler: 'authMe' },
      { pattern: /^\/$/, handler: 'root' },
    ],
    POST: [
      { pattern: /^\/mangas$/, handler: 'store' },
      { pattern: /^\/auth\/cadastro$/, handler: 'cadastro' },
      { pattern: /^\/auth\/login$/, handler: 'login' },
    ],
    PUT: [{ pattern: /^\/mangas\/(\d+)$/, handler: 'update' }],
    DELETE: [{ pattern: /^\/mangas\/(\d+)$/, handler: 'destroy' }],
  };

  const methodRoutes = routes[method];
  if (!methodRoutes) return null;

  for (const route of methodRoutes) {
    const match = path.match(route.pattern);
    if (match) {
      return { handler: route.handler, params: match.slice(1) };
    }
  }
  return null;
}

function validateMangaData(data, isUpdate = false) {
  const errors = {};

  if (!isUpdate || 'titulo' in data) {
    if (!data.titulo) errors.titulo = ['O campo título é obrigatório'];
    else if (data.titulo.length < 2) errors.titulo = ['O título deve ter pelo menos 2 caracteres'];
    else if (data.titulo.length > 200) errors.titulo = ['O título deve ter no máximo 200 caracteres'];
  }

  if (!isUpdate || 'tipo' in data) {
    if (!data.tipo) errors.tipo = ['O campo tipo é obrigatório'];
    else if (!TIPOS_PERMITIDOS.includes(data.tipo))
      errors.tipo = ['Tipo inválido. Valores permitidos: manga, manhwa, gibi'];
  }

  if (!isUpdate || 'autor' in data) {
    if (!data.autor) errors.autor = ['O campo autor é obrigatório'];
    else if (data.autor.length > 150) errors.autor = ['O autor deve ter no máximo 150 caracteres'];
  }

  if (data.editora && data.editora.length > 150) {
    errors.editora = ['A editora deve ter no máximo 150 caracteres'];
  }

  if (data.sinopse && data.sinopse.length > 5000) {
    errors.sinopse = ['A sinopse deve ter no máximo 5000 caracteres'];
  }

  if (data.ano_lancamento !== undefined && data.ano_lancamento !== null) {
    const ano = Number(data.ano_lancamento);
    const anoAtual = new Date().getFullYear();
    if (ano < 1900 || ano > anoAtual + 5) {
      errors.ano_lancamento = ['Ano de lançamento inválido'];
    }
  }

  if (data.status && !STATUS_PERMITIDOS.includes(data.status)) {
    errors.status = ['Status inválido. Valores permitidos: em_andamento, completo, hiatus, cancelado'];
  }

  if (data.classificacao_etaria && !CLASSIFICACOES_ETARIAS.includes(data.classificacao_etaria)) {
    errors.classificacao_etaria = ['Classificação etária inválida. Valores permitidos: L, 10, 12, 16, 18'];
  }

  if (data.url_capa) {
    try {
      new URL(data.url_capa);
      if (data.url_capa.length > 500) errors.url_capa = ['A URL da capa deve ter no máximo 500 caracteres'];
    } catch {
      errors.url_capa = ['URL da capa inválida'];
    }
  }

  return errors;
}

const handlers = {
  root() {
    return {
      nome: 'Manga Base API',
      versao: '1.0.0',
      descricao: 'API RESTful para cadastro de Mangás, Manhwas e Gibis',
      endpoints: {
        autenticacao: {
          'POST /api/v1/auth/cadastro': 'Cadastrar novo usuário (retorna token)',
          'POST /api/v1/auth/login': 'Login (retorna token)',
          'GET /api/v1/auth/me': 'Dados do usuário autenticado (requer token)',
        },
        mangas_publicos: {
          'GET /api/v1/mangas': 'Listar todos os mangás (paginação e filtros)',
          'GET /api/v1/mangas/{id}': 'Buscar mangá por ID',
          'GET /api/v1/mangas/tipo/{tipo}': 'Listar por tipo (manga, manhwa, gibi)',
          'GET /api/v1/mangas/autor/{autor}': 'Listar por autor',
          'GET /api/v1/mangas/status/{status}': 'Listar por status',
          'GET /api/v1/mangas/genero/{genero}': 'Listar por gênero',
          'GET /api/v1/mangas/ano/{ano}': 'Listar por ano',
          'GET /api/v1/mangas/buscar?q={termo}': 'Busca textual',
          'GET /api/v1/mangas/estatisticas': 'Estatísticas',
        },
        mangas_autenticados: {
          'POST /api/v1/mangas': 'Criar novo mangá (requer token)',
          'PUT /api/v1/mangas/{id}': 'Atualizar mangá (requer token)',
          'DELETE /api/v1/mangas/{id}': 'Deletar mangá (requer token)',
        },
      },
    };
  },

  index(req) {
    const query = parseQuery(req.url.split('?')[1]);
    const pagina = Number(query.pagina) || 1;
    const tamanhoPagina = Number(query.tamanho_pagina) || 10;
    const ordenarPor = query.ordenar_por || 'id';
    const direcaoOrdenacao = (query.direcao_ordenacao || 'asc').toLowerCase();
    const busca = query.busca || null;
    const tipo = query.tipo || null;
    const status = query.status || null;

    let mangas = dados.getMangas();

    if (busca) {
      const termo = busca.toLowerCase();
      mangas = mangas.filter(
        (m) =>
          m.titulo.toLowerCase().includes(termo) ||
          m.autor.toLowerCase().includes(termo) ||
          (m.sinopse && m.sinopse.toLowerCase().includes(termo))
      );
    }

    if (tipo && TIPOS_PERMITIDOS.includes(tipo)) {
      mangas = mangas.filter((m) => m.tipo === tipo);
    }

    if (status && STATUS_PERMITIDOS.includes(status)) {
      mangas = mangas.filter((m) => m.status === status);
    }

    const camposPermitidos = ['id', 'titulo', 'tipo', 'autor', 'editora', 'ano_lancamento', 'status', 'created_at'];
    const campoOrdenacao = camposPermitidos.includes(ordenarPor) ? ordenarPor : 'id';
    mangas.sort((a, b) => {
      const valA = a[campoOrdenacao];
      const valB = b[campoOrdenacao];
      if (typeof valA === 'string') {
        return direcaoOrdenacao === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return direcaoOrdenacao === 'desc' ? valB - valA : valA - valB;
    });

    const totalRegistros = mangas.length;
    const totalPaginas = Math.ceil(totalRegistros / tamanhoPagina);
    const inicio = (pagina - 1) * tamanhoPagina;
    const dadosPagina = mangas.slice(inicio, inicio + tamanhoPagina);

    return {
      pagina_atual: pagina,
      tamanho_pagina: tamanhoPagina,
      total_registros: totalRegistros,
      total_paginas: totalPaginas,
      dados: dadosPagina,
    };
  },

  show(_req, params) {
    const manga = dados.getMangaById(Number(params[0]));
    if (!manga) return { error: 'Mangá não encontrado', status: 404 };
    return manga;
  },

  store(req, _params, body) {
    const auth = checkAuth(req);
    if (auth.error) return { error: auth.error, status: auth.status };

    const errors = validateMangaData(body);
    if (Object.keys(errors).length > 0) return { error: 'Propriedades inválidas', status: 422, errors };

    const manga = dados.createManga(body);
    return { status: 201, mensagem: 'Mangá criado com sucesso', manga };
  },

  update(req, params, body) {
    const auth = checkAuth(req);
    if (auth.error) return { error: auth.error, status: auth.status };

    const manga = dados.getMangaById(Number(params[0]));
    if (!manga) return { error: 'Mangá não encontrado', status: 404 };

    const errors = validateMangaData(body, true);
    if (Object.keys(errors).length > 0) return { error: 'Propriedades inválidas', status: 422, errors };

    const atualizado = dados.updateManga(manga.id, body);
    return { mensagem: 'Mangá atualizado com sucesso', manga: atualizado };
  },

  destroy(req, params) {
    const auth = checkAuth(req);
    if (auth.error) return { error: auth.error, status: auth.status };

    const manga = dados.getMangaById(Number(params[0]));
    if (!manga) return { error: 'Mangá não encontrado', status: 404 };

    dados.deleteManga(manga.id);
    return { mensagem: 'Mangá removido com sucesso' };
  },

  byTipo(_req, params) {
    const tipo = params[0];
    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      return {
        error: 'Tipo inválido',
        status: 422,
        errors: { tipo: ['Tipo inválido. Use: manga, manhwa ou gibi'] },
      };
    }
    const mangas = dados.getMangas().filter((m) => m.tipo === tipo);
    return { tipo, total: mangas.length, dados: mangas };
  },

  byAutor(_req, params) {
    const autor = decodeURIComponent(params[0]).toLowerCase();
    const mangas = dados.getMangas().filter((m) => m.autor.toLowerCase().includes(autor));
    return { autor, total: mangas.length, dados: mangas };
  },

  byStatus(_req, params) {
    const status = params[0];
    if (!STATUS_PERMITIDOS.includes(status)) {
      return {
        error: 'Status inválido',
        status: 422,
        errors: { status: ['Status inválido. Use: em_andamento, completo, hiatus ou cancelado'] },
      };
    }
    const mangas = dados.getMangas().filter((m) => m.status === status);
    return { status, total: mangas.length, dados: mangas };
  },

  byGenero(_req, params) {
    const genero = decodeURIComponent(params[0]).toLowerCase();
    const mangas = dados
      .getMangas()
      .filter((m) => m.genero && m.genero.toLowerCase().includes(genero));
    return { genero, total: mangas.length, dados: mangas };
  },

  byAno(_req, params) {
    const ano = Number(params[0]);
    const mangas = dados.getMangas().filter((m) => m.ano_lancamento === ano);
    return { ano, total: mangas.length, dados: mangas };
  },

  search(req) {
    const query = parseQuery(req.url.split('?')[1]);
    const termo = query.q || query.termo;
    if (!termo || termo.length < 2) {
      return { error: 'Termo de busca deve ter pelo menos 2 caracteres', status: 400 };
    }
    const termoLower = termo.toLowerCase();
    const mangas = dados.getMangas().filter(
      (m) =>
        m.titulo.toLowerCase().includes(termoLower) ||
        m.autor.toLowerCase().includes(termoLower) ||
        (m.sinopse && m.sinopse.toLowerCase().includes(termoLower))
    );
    return { termo, total: mangas.length, dados: mangas };
  },

  stats() {
    const mangas = dados.getMangas();
    const porTipo = {};
    const porStatus = {};

    for (const m of mangas) {
      porTipo[m.tipo] = (porTipo[m.tipo] || 0) + 1;
      porStatus[m.status] = (porStatus[m.status] || 0) + 1;
    }

    return {
      por_tipo: Object.entries(porTipo)
        .map(([tipo, total]) => ({ tipo, total }))
        .sort((a, b) => b.total - a.total),
      por_status: Object.entries(porStatus)
        .map(([status, total]) => ({ status, total }))
        .sort((a, b) => b.total - a.total),
      total: mangas.length,
    };
  },

  cadastro(req, _params, body) {
    const errors = {};
    if (!body.nome) errors.nome = ['O campo nome é obrigatório'];
    else if (body.nome.length < 3) errors.nome = ['O nome deve ter no mínimo 3 caracteres'];

    if (!body.email) errors.email = ['O campo e-mail é obrigatório'];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.email = ['E-mail inválido'];

    if (!body.nome_usuario) errors.nome_usuario = ['O campo nome de usuário é obrigatório'];
    else if (body.nome_usuario.length < 3) errors.nome_usuario = ['O nome de usuário deve ter no mínimo 3 caracteres'];

    if (!body.senha) errors.senha = ['O campo senha é obrigatório'];
    else if (body.senha.length < 6) errors.senha = ['A senha deve ter um mínimo de 6 caracteres'];

    if (Object.keys(errors).length > 0) return { error: 'Propriedades inválidas', status: 422, errors };

    if (dados.getUsuarioByEmail(body.email)) {
      return { error: 'Propriedades inválidas', status: 422, errors: { email: ['Este e-mail já está em uso'] } };
    }

    const usuarios = dados.getUsuarios();
    if (usuarios.find((u) => u.nome_usuario === body.nome_usuario)) {
      return {
        error: 'Propriedades inválidas',
        status: 422,
        errors: { nome_usuario: ['Este nome de usuário já está em uso'] },
      };
    }

    const usuario = dados.createUsuario(body);
    const token = jwt.generateToken(usuario.id);
    return { status: 201, token_gerado: token, mensagem: 'Cadastro realizado com sucesso', usuario };
  },

  login(req, _params, body) {
    const errors = {};
    if (!body.email) errors.email = ['O campo e-mail é obrigatório'];
    if (!body.senha) errors.senha = ['O campo senha é obrigatório'];
    if (Object.keys(errors).length > 0) return { error: 'Propriedades inválidas', status: 422, errors };

    const usuario = dados.getUsuarioByEmail(body.email);
    if (!usuario) return { error: 'E-mail ou senha inválidos', status: 422, errors: { email: ['E-mail ou senha inválidos'] } };

    const senhaHash = crypto.createHash('sha256').update(body.senha).digest('hex');
    if (senhaHash !== usuario.senha) {
      return { error: 'E-mail ou senha inválidos', status: 422, errors: { senha: ['E-mail ou senha inválidos'] } };
    }

    const token = jwt.generateToken(usuario.id);
    return {
      token_gerado: token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, nome_usuario: usuario.nome_usuario },
    };
  },

  authMe(req) {
    const auth = checkAuth(req);
    if (auth.error) return { error: auth.error, status: auth.status };

    const usuario = dados.getUsuarioById(auth.userId);
    if (!usuario) return { error: 'Usuário não encontrado', status: 404 };
    return { usuario };
  },
};

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  let path = parsedUrl.pathname.replace(/^\/api\/v1/, '');
  path = path.replace(/\/$/, '') || '/';

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const route = matchRoute(req.method, path);
  if (!route) {
    return sendJson(res, 404, { mensagem: 'Rota não encontrada' });
  }

  try {
    let body = {};
    if (['POST', 'PUT'].includes(req.method)) {
      body = await getRequestBody(req);
    }

    const result = handlers[route.handler](req, route.params, body);

    const httpStatus = Number.isInteger(result.status) ? result.status : 200;
    return sendJson(res, httpStatus, result);
  } catch (err) {
    console.error('Erro:', err);
    return sendJson(res, 500, { mensagem: 'Erro interno do servidor' });
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Manga Base API rodando em http://localhost:${PORT}`);
  console.log(`Documentação: http://localhost:${PORT}/api/v1`);
});
