-- ============================================
-- Manga Base API - Schema do Banco de Dados
-- ============================================

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS manga_base_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE manga_base_db;

-- ============================================
-- Tabela: usuarios (para autenticação)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    nome_usuario VARCHAR(50) NOT NULL,
    senha VARCHAR(64) NOT NULL COMMENT 'SHA256 hash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_email (email),
    UNIQUE KEY uk_nome_usuario (nome_usuario),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: mangas
-- ============================================
CREATE TABLE IF NOT EXISTS mangas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    tipo ENUM('manga', 'manhwa', 'gibi') NOT NULL DEFAULT 'manga' COMMENT 'Tipo: manga, manhwa ou gibi',
    autor VARCHAR(150) NOT NULL,
    editora VARCHAR(150) DEFAULT NULL,
    sinopse TEXT DEFAULT NULL,
    ano_lancamento YEAR DEFAULT NULL,
    status ENUM('em_andamento', 'completo', 'hiatus', 'cancelado') DEFAULT 'em_andamento',
    volumetoria VARCHAR(50) DEFAULT NULL COMMENT 'Ex: 12 volumes, 200 capítulos',
    genero VARCHAR(200) DEFAULT NULL COMMENT 'Ex: Ação, Aventura, Fantasia',
    classificacao_etaria VARCHAR(20) DEFAULT NULL COMMENT 'Ex: L, 10, 12, 16, 18',
    url_capa VARCHAR(500) DEFAULT NULL COMMENT 'URL da imagem de capa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_titulo (titulo),
    INDEX idx_tipo (tipo),
    INDEX idx_autor (autor),
    INDEX idx_editora (editora),
    INDEX idx_status (status),
    INDEX idx_ano_lancamento (ano_lancamento),
    FULLTEXT idx_busca (titulo, autor, sinopse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: capitulos (para referência futura)
-- ============================================
CREATE TABLE IF NOT EXISTS capitulos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    manga_id INT UNSIGNED NOT NULL,
    numero VARCHAR(20) NOT NULL,
    titulo VARCHAR(200) DEFAULT NULL,
    descricao TEXT DEFAULT NULL,
    data_lancamento DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_manga_numero (manga_id, numero),
    INDEX idx_manga_id (manga_id),
    INDEX idx_numero (numero),
    
    CONSTRAINT fk_capitulos_manga
        FOREIGN KEY (manga_id) 
        REFERENCES mangas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: autores (entidade separada opcional)
-- ============================================
CREATE TABLE IF NOT EXISTS autores (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    nome_japones VARCHAR(150) DEFAULT NULL,
    data_nascimento DATE DEFAULT NULL,
    nacionalidade VARCHAR(50) DEFAULT NULL,
    biografia TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome),
    FULLTEXT idx_busca (nome, nome_japones)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: generos (tag de gêneros)
-- ============================================
CREATE TABLE IF NOT EXISTS generos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabela: manga_generos (relacionamento N:N)
-- ============================================
CREATE TABLE IF NOT EXISTS manga_generos (
    manga_id INT UNSIGNED NOT NULL,
    genero_id INT UNSIGNED NOT NULL,
    
    PRIMARY KEY (manga_id, genero_id),
    
    CONSTRAINT fk_mangageneros_manga
        FOREIGN KEY (manga_id) 
        REFERENCES mangas(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_mangageneros_genero
        FOREIGN KEY (genero_id) 
        REFERENCES generos(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
