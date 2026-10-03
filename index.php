<?php
/**
 * Manga Base API - Ponto de Entrada
 * 
 * API RESTful para cadastro de Mangás, Manhwas e Gibis
 * 
 * Endpoints GET são PÚBLICOS (sem autenticação)
 * Endpoints POST, PUT, DELETE REQUEREM autenticação (exceto auth/cadastro e auth/login)
 * 
 * @author Manga Base Team
 * @version 1.1.0
 */

// Configurar headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Tratar requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Autoloader simples
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/config/',
        __DIR__ . '/models/',
        __DIR__ . '/controllers/',
        __DIR__ . '/middleware/',
        __DIR__ . '/helpers/',
        __DIR__ . '/'
    ];
    
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Tratamento de erros
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

set_exception_handler(function ($exception) {
    error_log("Exceção não tratada: " . $exception->getMessage());
    Response::serverError('Erro interno do servidor');
});

// Inicializar rotas
$router = new Router();

// ============================================
// Rotas de Autenticação (PÚBLICAS)
// ============================================

// Cadastro de novo usuário (retorna token)
$router->post('/auth/cadastro', ['Auth', 'cadastro']);

// Login (retorna token)
$router->post('/auth/login', ['Auth', 'login']);

// Dados do usuário autenticado (REQUER TOKEN)
$router->get('/auth/me', ['Auth', 'me']);

// ============================================
// Rotas de Mangás - CRUD (GETs Públicos, POST/PUT/DELETE Autenticados)
// ============================================

// Listar todos os mangás (PÚBLICO)
// GET /api/v1/mangas?pagina=1&tamanho_pagina=10&busca=one&tipo=manga&status=completo
$router->get('/mangas', ['Manga', 'index']);

// Buscar mangá por ID (PÚBLICO)
$router->get('/mangas/{id}', ['Manga', 'show']);

// Criar novo mangá (REQUER AUTENTICAÇÃO)
$router->post('/mangas', ['Manga', 'store']);

// Atualizar mangá (REQUER AUTENTICAÇÃO)
$router->put('/mangas/{id}', ['Manga', 'update']);

// Deletar mangá (REQUER AUTENTICAÇÃO)
$router->delete('/mangas/{id}', ['Manga', 'destroy']);

// ============================================
// Rotas de Busca e Filtros (TODAS PÚBLICAS)
// ============================================

// Listar por tipo (manga, manhwa, gibi)
$router->get('/mangas/tipo/{tipo}', ['Manga', 'byTipo']);

// Listar por autor
$router->get('/mangas/autor/{autor}', ['Manga', 'byAutor']);

// Listar por status
$router->get('/mangas/status/{status}', ['Manga', 'byStatus']);

// Listar por gênero
$router->get('/mangas/genero/{genero}', ['Manga', 'byGenero']);

// Listar por ano de lançamento
$router->get('/mangas/ano/{ano}', ['Manga', 'byAno']);

// Busca textual
// GET /api/v1/mangas/buscar?q=one+piece
$router->get('/mangas/buscar', ['Manga', 'search']);

// Estatísticas
$router->get('/mangas/estatisticas', ['Manga', 'stats']);

// ============================================
// Rota raiz - Informações da API
// ============================================
$router->get('/', function() {
    Response::success([
        'nome' => 'Manga Base API',
        'versao' => '1.1.0',
        'descricao' => 'API RESTful para cadastro de Mangás, Manhwas e Gibis',
        'autenticacao' => [
            ' descricao' => 'Endpoints POST/PUT/DELETE requerem token Bearer no header Authorization',
            'como_obter_token' => 'POST /api/v1/auth/login com email e senha',
            'exemplo_header' => 'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...'
        ],
        'endpoints' => [
            'autenticacao' => [
                'POST /api/v1/auth/cadastro' => 'Cadastrar novo usuário (retorna token)',
                'POST /api/v1/auth/login' => 'Login (retorna token)',
                'GET /api/v1/auth/me' => 'Dados do usuário autenticado (requer token)'
            ],
            'mangas_publicos' => [
                'GET /api/v1/mangas' => 'Listar todos os mangás (paginação e filtros)',
                'GET /api/v1/mangas/{id}' => 'Buscar mangá por ID',
                'GET /api/v1/mangas/tipo/{tipo}' => 'Listar por tipo (manga, manhwa, gibi)',
                'GET /api/v1/mangas/autor/{autor}' => 'Listar por autor',
                'GET /api/v1/mangas/status/{status}' => 'Listar por status',
                'GET /api/v1/mangas/genero/{genero}' => 'Listar por gênero',
                'GET /api/v1/mangas/ano/{ano}' => 'Listar por ano',
                'GET /api/v1/mangas/buscar?q={termo}' => 'Busca textual',
                'GET /api/v1/mangas/estatisticas' => 'Estatísticas'
            ],
            'mangas_autenticados' => [
                'POST /api/v1/mangas' => 'Criar novo mangá (requer token)',
                'PUT /api/v1/mangas/{id}' => 'Atualizar mangá (requer token)',
                'DELETE /api/v1/mangas/{id}' => 'Deletar mangá (requer token)'
            ]
        ],
        'exemplo_login' => [
            'email' => 'admin@mangabase.com',
            'senha' => '123456'
        ],
        'exemplo_criacao' => [
            'titulo' => 'One Piece',
            'tipo' => 'manga',
            'autor' => 'Eiichiro Oda',
            'editora' => 'Shueisha',
            'sinopse' => 'Aventura dos chapéus de palha...',
            'ano_lancamento' => 1997,
            'status' => 'em_andamento',
            'volumetoria' => '107+ volumes',
            'genero' => 'Ação, Aventura, Comédia',
            'classificacao_etaria' => '12',
            'url_capa' => 'https://example.com/covers/one-piece.jpg'
        ]
    ]);
});

// Processar requisição
$router->dispatch();
