<?php
/**
 * Controller: Manga
 * Manga Base API
 * 
 * Métodos GET são públicos (sem autenticação)
 * Métodos POST, PUT, DELETE requerem autenticação
 */

class MangaController {
    private $mangaModel;
    
    public function __construct() {
        $this->mangaModel = new Manga();
    }
    
    /**
     * GET /api/v1/mangas
     * Lista todos os mangás com paginação e filtros (PÚBLICO)
     */
    public function index(): void {
        $filtros = [
            'pagina' => isset($_GET['pagina']) ? (int) $_GET['pagina'] : 1,
            'tamanho_pagina' => isset($_GET['tamanho_pagina']) ? (int) $_GET['tamanho_pagina'] : 10,
            'ordenar_por' => $_GET['ordenar_por'] ?? 'id',
            'direcao_ordenacao' => $_GET['direcao_ordenacao'] ?? 'asc',
            'busca' => $_GET['busca'] ?? null,
            'tipo' => $_GET['tipo'] ?? null,
            'status' => $_GET['status'] ?? null
        ];
        
        $resultado = $this->mangaModel->getAll($filtros);
        
        Response::success($resultado);
    }
    
    /**
     * GET /api/v1/mangas/{id}
     * Busca mangá por ID (PÚBLICO)
     */
    public function show(int $id): void {
        $manga = $this->mangaModel->getById($id);
        
        if (!$manga) {
            Response::notFound('Mangá não encontrado');
        }
        
        Response::success($manga);
    }
    
    /**
     * POST /api/v1/mangas
     * Cria novo mangá (REQUER AUTENTICAÇÃO)
     */
    public function store(): void {
        Auth::check();
        
        $data = Response::getRequestBody();
        
        // Validações
        $errors = $this->validateData($data);
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        $manga = $this->mangaModel->create($data);
        
        Response::created([
            'mensagem' => 'Mangá criado com sucesso',
            'manga' => $manga
        ]);
    }
    
    /**
     * PUT /api/v1/mangas/{id}
     * Atualiza mangá (REQUER AUTENTICAÇÃO)
     */
    public function update(int $id): void {
        Auth::check();
        
        $manga = $this->mangaModel->getById($id);
        
        if (!$manga) {
            Response::notFound('Mangá não encontrado');
        }
        
        $data = Response::getRequestBody();
        
        // Validações
        $errors = $this->validateData($data, true);
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        $manga = $this->mangaModel->update($id, $data);
        
        Response::success([
            'mensagem' => 'Mangá atualizado com sucesso',
            'manga' => $manga
        ]);
    }
    
    /**
     * DELETE /api/v1/mangas/{id}
     * Deleta mangá (REQUER AUTENTICAÇÃO)
     */
    public function destroy(int $id): void {
        Auth::check();
        
        $manga = $this->mangaModel->getById($id);
        
        if (!$manga) {
            Response::notFound('Mangá não encontrado');
        }
        
        $this->mangaModel->delete($id);
        
        Response::success([
            'mensagem' => 'Mangá removido com sucesso'
        ]);
    }
    
    /**
     * GET /api/v1/mangas/tipo/{tipo}
     * Lista mangás por tipo (manga, manhwa, gibi) (PÚBLICO)
     */
    public function byTipo(string $tipo): void {
        if (!in_array($tipo, Manga::TIPOS_PERMITIDOS)) {
            Response::validationError(['tipo' => ['Tipo inválido. Use: manga, manhwa ou gibi']]);
        }
        
        $mangas = $this->mangaModel->getByTipo($tipo);
        
        Response::success([
            'tipo' => $tipo,
            'total' => count($mangas),
            'dados' => $mangas
        ]);
    }
    
    /**
     * GET /api/v1/mangas/autor/{autor}
     * Lista mangás por autor (PÚBLICO)
     */
    public function byAutor(string $autor): void {
        $mangas = $this->mangaModel->getByAutor($autor);
        
        Response::success([
            'autor' => $autor,
            'total' => count($mangas),
            'dados' => $mangas
        ]);
    }
    
    /**
     * GET /api/v1/mangas/status/{status}
     * Lista mangás por status (PÚBLICO)
     */
    public function byStatus(string $status): void {
        if (!in_array($status, Manga::STATUS_PERMITIDOS)) {
            Response::validationError(['status' => ['Status inválido. Use: em_andamento, completo, hiatus ou cancelado']]);
        }
        
        $mangas = $this->mangaModel->getByStatus($status);
        
        Response::success([
            'status' => $status,
            'total' => count($mangas),
            'dados' => $mangas
        ]);
    }
    
    /**
     * GET /api/v1/mangas/genero/{genero}
     * Lista mangás por gênero (PÚBLICO)
     */
    public function byGenero(string $genero): void {
        $mangas = $this->mangaModel->getByGenero($genero);
        
        Response::success([
            'genero' => $genero,
            'total' => count($mangas),
            'dados' => $mangas
        ]);
    }
    
    /**
     * GET /api/v1/mangas/ano/{ano}
     * Lista mangás por ano de lançamento (PÚBLICO)
     */
    public function byAno(int $ano): void {
        $mangas = $this->mangaModel->getByAno($ano);
        
        Response::success([
            'ano' => $ano,
            'total' => count($mangas),
            'dados' => $mangas
        ]);
    }
    
    /**
     * GET /api/v1/mangas/buscar?q={termo}
     * Busca textual em mangás (PÚBLICO)
     */
    public function search(): void {
        $termo = $_GET['q'] ?? $_GET['termo'] ?? null;
        
        if (!$termo || strlen($termo) < 2) {
            Response::badRequest('Termo de busca deve ter pelo menos 2 caracteres');
        }
        
        $mangas = $this->mangaModel->search($termo);
        
        Response::success([
            'termo' => $termo,
            'total' => count($mangas),
            'dados' => $mangas
        ]);
    }
    
    /**
     * GET /api/v1/mangas/estatisticas
     * Retorna estatísticas dos mangás (PÚBLICO)
     */
    public function stats(): void {
        $stats = $this->mangaModel->getStats();
        
        Response::success($stats);
    }
    
    /**
     * Valida dados do mangá
     */
    private function validateData(array $data, bool $isUpdate = false): array {
        $errors = [];
        
        // Título (obrigatório na criação)
        if (!$isUpdate || isset($data['titulo'])) {
            if (empty($data['titulo'])) {
                $errors['titulo'] = ['O campo título é obrigatório'];
            } elseif (strlen($data['titulo']) < 2) {
                $errors['titulo'] = ['O título deve ter pelo menos 2 caracteres'];
            } elseif (strlen($data['titulo']) > 200) {
                $errors['titulo'] = ['O título deve ter no máximo 200 caracteres'];
            }
        }
        
        // Tipo (obrigatório na criação)
        if (!$isUpdate || isset($data['tipo'])) {
            if (empty($data['tipo'])) {
                $errors['tipo'] = ['O campo tipo é obrigatório'];
            } elseif (!in_array($data['tipo'], Manga::TIPOS_PERMITIDOS)) {
                $errors['tipo'] = ['Tipo inválido. Valores permitidos: manga, manhwa, gibi'];
            }
        }
        
        // Autor (obrigatório na criação)
        if (!$isUpdate || isset($data['autor'])) {
            if (empty($data['autor'])) {
                $errors['autor'] = ['O campo autor é obrigatório'];
            } elseif (strlen($data['autor']) > 150) {
                $errors['autor'] = ['O autor deve ter no máximo 150 caracteres'];
            }
        }
        
        // Editora
        if (isset($data['editora']) && !empty($data['editora'])) {
            if (strlen($data['editora']) > 150) {
                $errors['editora'] = ['A editora deve ter no máximo 150 caracteres'];
            }
        }
        
        // Sinopse
        if (isset($data['sinopse']) && !empty($data['sinopse'])) {
            if (strlen($data['sinopse']) > 5000) {
                $errors['sinopse'] = ['A sinopse deve ter no máximo 5000 caracteres'];
            }
        }
        
        // Ano de lançamento
        if (isset($data['ano_lancamento']) && !empty($data['ano_lancamento'])) {
            $ano = (int) $data['ano_lancamento'];
            if ($ano < 1900 || $ano > date('Y') + 5) {
                $errors['ano_lancamento'] = ['Ano de lançamento inválido'];
            }
        }
        
        // Status
        if (isset($data['status']) && !empty($data['status'])) {
            if (!in_array($data['status'], Manga::STATUS_PERMITIDOS)) {
                $errors['status'] = ['Status inválido. Valores permitidos: em_andamento, completo, hiatus, cancelado'];
            }
        }
        
        // Classificação etária
        if (isset($data['classificacao_etaria']) && !empty($data['classificacao_etaria'])) {
            if (!in_array($data['classificacao_etaria'], Manga::CLASSIFICACOES_ETARIAS)) {
                $errors['classificacao_etaria'] = ['Classificação etária inválida. Valores permitidos: L, 10, 12, 16, 18'];
            }
        }
        
        // URL da capa
        if (isset($data['url_capa']) && !empty($data['url_capa'])) {
            if (!filter_var($data['url_capa'], FILTER_VALIDATE_URL)) {
                $errors['url_capa'] = ['URL da capa inválida'];
            } elseif (strlen($data['url_capa']) > 500) {
                $errors['url_capa'] = ['A URL da capa deve ter no máximo 500 caracteres'];
            }
        }
        
        return $errors;
    }
}
