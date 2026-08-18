<?php
/**
 * Model: Manga
 * Manga Base API
 */

class Manga {
    private $db;
    private $table = 'mangas';
    
    public int $id;
    public string $titulo;
    public string $tipo;
    public string $autor;
    public ?string $editora;
    public ?string $sinopse;
    public ?int $ano_lancamento;
    public ?string $status;
    public ?string $volumetoria;
    public ?string $genero;
    public ?string $classificacao_etaria;
    public ?string $url_capa;
    public string $created_at;
    public string $updated_at;
    
    // Tipos permitidos
    public const TIPOS_PERMITIDOS = ['manga', 'manhwa', 'gibi'];
    
    // Status permitidos
    public const STATUS_PERMITIDOS = ['em_andamento', 'completo', 'hiatus', 'cancelado'];
    
    // Classificações etárias
    public const CLASSIFICACOES_ETARIAS = ['L', '10', '12', '16', '18'];
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Lista todos os mangás com paginação e filtros
     */
    public function getAll(array $filtros = []): array {
        $pagina = $filtros['pagina'] ?? 1;
        $tamanhoPagina = $filtros['tamanho_pagina'] ?? 10;
        $ordenarPor = $filtros['ordenar_por'] ?? 'id';
        $direcaoOrdenacao = $filtros['direcao_ordenacao'] ?? 'asc';
        $busca = $filtros['busca'] ?? null;
        $tipo = $filtros['tipo'] ?? null;
        $status = $filtros['status'] ?? null;
        
        $permitidos = ['id', 'titulo', 'tipo', 'autor', 'editora', 'ano_lancamento', 'status', 'created_at'];
        $ordenarPor = in_array($ordenarPor, $permitidos) ? $ordenarPor : 'id';
        $direcaoOrdenacao = strtolower($direcaoOrdenacao) === 'desc' ? 'DESC' : 'ASC';
        
        $offset = ($pagina - 1) * $tamanhoPagina;
        
        $where = [];
        $params = [];
        
        // Filtro por busca (título ou autor)
        if ($busca) {
            $where[] = "(titulo LIKE ? OR autor LIKE ? OR sinopse LIKE ?)";
            $params[] = "%{$busca}%";
            $params[] = "%{$busca}%";
            $params[] = "%{$busca}%";
        }
        
        // Filtro por tipo
        if ($tipo && in_array($tipo, self::TIPOS_PERMITIDOS)) {
            $where[] = "tipo = ?";
            $params[] = $tipo;
        }
        
        // Filtro por status
        if ($status && in_array($status, self::STATUS_PERMITIDOS)) {
            $where[] = "status = ?";
            $params[] = $status;
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        // Contar total
        $countSql = "SELECT COUNT(*) FROM {$this->table} {$whereClause}";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $totalRegistros = $countStmt->fetchColumn();
        
        // Buscar dados
        $sql = "SELECT * FROM {$this->table} {$whereClause} ORDER BY {$ordenarPor} {$direcaoOrdenacao} LIMIT {$tamanhoPagina} OFFSET {$offset}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $dados = $stmt->fetchAll();
        
        return [
            'pagina_atual' => $pagina,
            'tamanho_pagina' => $tamanhoPagina,
            'total_registros' => (int) $totalRegistros,
            'total_paginas' => ceil($totalRegistros / $tamanhoPagina),
            'dados' => $dados
        ];
    }
    
    /**
     * Busca mangá por ID
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Busca mangás por tipo
     */
    public function getByTipo(string $tipo): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE tipo = ? ORDER BY titulo");
        $stmt->execute([$tipo]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Busca mangás por autor
     */
    public function getByAutor(string $autor): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE autor LIKE ? ORDER BY titulo");
        $stmt->execute(["%{$autor}%"]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Busca mangás por status
     */
    public function getByStatus(string $status): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE status = ? ORDER BY titulo");
        $stmt->execute([$status]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Busca mangás por gênero (campo texto)
     */
    public function getByGenero(string $genero): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE genero LIKE ? ORDER BY titulo");
        $stmt->execute(["%{$genero}%"]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Busca mangás por ano de lançamento
     */
    public function getByAno(int $ano): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE ano_lancamento = ? ORDER BY titulo");
        $stmt->execute([$ano]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Busca textual (título, autor, sinopse)
     */
    public function search(string $termo): array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE titulo LIKE ? OR autor LIKE ? OR sinopse LIKE ? ORDER BY titulo");
        $termo = "%{$termo}%";
        $stmt->execute([$termo, $termo, $termo]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Cria novo mangá
     */
    public function create(array $data): array {
        $stmt = $this->db->prepare("INSERT INTO {$this->table} 
            (titulo, tipo, autor, editora, sinopse, ano_lancamento, status, volumetoria, genero, classificacao_etaria, url_capa) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $data['titulo'],
            $data['tipo'],
            $data['autor'],
            $data['editora'] ?? null,
            $data['sinopse'] ?? null,
            $data['ano_lancamento'] ?? null,
            $data['status'] ?? 'em_andamento',
            $data['volumetoria'] ?? null,
            $data['genero'] ?? null,
            $data['classificacao_etaria'] ?? null,
            $data['url_capa'] ?? null
        ]);
        
        $this->id = (int) $this->db->lastInsertId();
        
        return $this->getById($this->id);
    }
    
    /**
     * Atualiza mangá
     */
    public function update(int $id, array $data): ?array {
        $fields = [];
        $values = [];
        
        $camposPermitidos = [
            'titulo', 'tipo', 'autor', 'editora', 'sinopse', 
            'ano_lancamento', 'status', 'volumetoria', 'genero', 
            'classificacao_etaria', 'url_capa'
        ];
        
        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $data)) {
                $fields[] = "{$campo} = ?";
                $values[] = $data[$campo];
            }
        }
        
        if (empty($fields)) {
            return $this->getById($id);
        }
        
        $values[] = $id;
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($values);
        
        return $this->getById($id);
    }
    
    /**
     * Deleta mangá
     */
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    /**
     * Retorna estatísticas básicas
     */
    public function getStats(): array {
        $stats = [];
        
        // Total por tipo
        $stmt = $this->db->query("SELECT tipo, COUNT(*) as total FROM {$this->table} GROUP BY tipo");
        $stats['por_tipo'] = $stmt->fetchAll();
        
        // Total por status
        $stmt = $this->db->query("SELECT status, COUNT(*) as total FROM {$this->table} GROUP BY status");
        $stats['por_status'] = $stmt->fetchAll();
        
        // Total geral
        $stmt = $this->db->query("SELECT COUNT(*) as total FROM {$this->table}");
        $stats['total'] = (int) $stmt->fetchColumn();
        
        return $stats;
    }
}
