<?php
/**
 * Model: Usuário
 * Manga Base API
 */

class Usuario {
    private $db;
    private $table = 'usuarios';
    
    public int $id;
    public string $nome;
    public string $email;
    public string $nome_usuario;
    public string $senha;
    public string $created_at;
    public string $updated_at;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Busca usuário por email (com senha para autenticação)
     */
    public function getByEmailWithPassword(string $email): ?array {
        $stmt = $this->db->prepare("SELECT * FROM {$this->table} WHERE email = ?");
        $stmt->execute([$email]);
        
        return $stmt->fetch() ?: null;
    }
    
    /**
     * Busca usuário por ID (sem senha)
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT id, nome, email, nome_usuario, created_at, updated_at FROM {$this->table} WHERE id = ?");
        $stmt->execute([$id]);
        
        return $this->mapUser($stmt->fetch()) ?: null;
    }
    
    /**
     * Cria novo usuário
     */
    public function create(array $data): array {
        $senhaHash = hash('sha256', $data['senha']);
        
        $stmt = $this->db->prepare("INSERT INTO {$this->table} (nome, email, nome_usuario, senha) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $data['nome'],
            $data['email'],
            $data['nome_usuario'],
            $senhaHash
        ]);
        
        $this->id = (int) $this->db->lastInsertId();
        
        return $this->getById($this->id);
    }
    
    /**
     * Verifica se email já existe
     */
    public function emailExists(string $email, int $excludeId = 0): bool {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE email = ? AND id != ?");
        $stmt->execute([$email, $excludeId]);
        
        return $stmt->fetchColumn() > 0;
    }
    
    /**
     * Verifica se nome de usuário já existe
     */
    public function usernameExists(string $nomeUsuario, int $excludeId = 0): bool {
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM {$this->table} WHERE nome_usuario = ? AND id != ?");
        $stmt->execute([$nomeUsuario, $excludeId]);
        
        return $stmt->fetchColumn() > 0;
    }
    
    /**
     * Mapeia dados do usuário (remove senha)
     */
    private function mapUser(?array $user): ?array {
        if (!$user) {
            return null;
        }
        
        unset($user['senha']);
        return $user;
    }
}
