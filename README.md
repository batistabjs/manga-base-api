# Manga Base API

API RESTful para cadastro e gerenciamento de Mangás, Manhwas e Gibis.

## Tecnologias Utilizadas

- **PHP 8.2+** - Linguagem de programação
- **MySQL/MariaDB** - Banco de dados relacional
- **Apache/Nginx** - Servidor web
- **JWT (JSON Web Tokens)** - Autenticação

## Estrutura do Projeto

```
manga-base-api/
├── config/
│   └── Database.php        # Conexão com banco de dados
├── controllers/
│   ├── AuthController.php   # Controller de autenticação
│   └── MangaController.php  # Controller dos mangás
├── helpers/
│   ├── JWT.php              # Autenticação JWT
│   └── Response.php         # Respostas HTTP
├── middleware/
│   └── Auth.php             # Verificação de autenticação
├── models/
│   ├── Manga.php            # Model dos mangás
│   └── Usuario.php          # Model dos usuários
├── sql/
│   ├── schema.sql           # Estrutura do banco
│   └── seed.sql             # Dados iniciais
├── .htaccess                # URL rewriting
├── index.php                # Ponto de entrada
├── Router.php               # Router da API
└── README.md                # Este arquivo
```

## Autenticação

### Como Funciona

- **Endpoints GET** são **PÚBLICOS** - não requerem autenticação
- **Endpoints POST/PUT/DELETE** requerem autenticação via Token JWT
- Exceção: `auth/cadastro` e `auth/login` são públicos

### Obtendo um Token

1. Cadastre-se: `POST /api/v1/auth/cadastro`
2. Faça login: `POST /api/v1/auth/login`

### Usando o Token

Inclua o header `Authorization` em requisições autenticadas:

```
Authorization: Bearer SEU_TOKEN_AQUI
```

### Usuários Padrão (Seed)

| Email | Senha | Nome |
|-------|-------|------|
| admin@mangabase.com | 123456 | Administrador |
| carlos@mangabase.com | 123456 | Carlos Manga |
| maria@mangabase.com | 123456 | Maria Leitora |

## Tipos de Mangá Suportados

| Tipo | Descrição |
|------|-----------|
| **manga** | Histórias em quadrinhos japonesas |
| **manhwa** | Histórias em quadrinhos coreanas |
| **gibi** | Histórias em quadrinhos brasileiras |

## Instalação

### 1. Configurar o banco de dados

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p < sql/seed.sql
```

### 2. Editar credenciais

Edite `config/Database.php` com suas credenciais:

```php
private $host = 'localhost';
private $port = 3306;
private $dbname = 'manga_base_db';
private $username = 'root';
private $password = '';
```

### 3. Configurar servidor web

No terminal, certifique-se de que o php esteja instalado na máquina com o comando: 
```
php -v
```

Ainda no terminal, vá até a pasta do projeto e execute o comando:
```
php -S localhost:8080   
```

### 4. Testar a API

```
http://localhost:8080
```

## Endpoints da API

### Autenticação (Públicos)

| Método | Endpoint | Descrição | Autenticação |
|--------|----------|-----------|--------------|
| POST | /api/v1/auth/cadastro | Cadastrar novo usuário | Não |
| POST | /api/v1/auth/login | Login (retorna token) | Não |
| GET | /api/v1/auth/me | Dados do usuário logado | Sim |

### Mangás - Consultas (Públicas)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /api/v1/mangas | Listar todos os mangás |
| GET | /api/v1/mangas/{id} | Buscar mangá por ID |
| GET | /api/v1/mangas/tipo/{tipo} | Filtrar por tipo |
| GET | /api/v1/mangas/autor/{autor} | Filtrar por autor |
| GET | /api/v1/mangas/status/{status} | Filtrar por status |
| GET | /api/v1/mangas/genero/{genero} | Filtrar por gênero |
| GET | /api/v1/mangas/ano/{ano} | Filtrar por ano |
| GET | /api/v1/mangas/buscar?q={termo} | Busca textual |
| GET | /api/v1/mangas/estatisticas | Estatísticas |

### Mangás - Cadastro (Autenticados)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/v1/mangas | Criar novo mangá |
| PUT | /api/v1/mangas/{id} | Atualizar mangá |
| DELETE | /api/v1/mangas/{id} | Deletar mangá |

## Parâmetros de Paginação e Filtros

Para o endpoint `GET /api/v1/mangas`:

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| pagina | int | Número da página (padrão: 1) |
| tamanho_pagina | int | Itens por página (padrão: 10) |
| ordenar_por | string | Campo para ordenar (padrão: id) |
| direcao_ordenacao | string | asc ou desc (padrão: asc) |
| busca | string | Busca em título, autor e sinopse |
| tipo | string | manga, manhwa ou gibi |
| status | string | em_andamento, completo, hiatus, cancelado |

## Exemplos de Uso

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mangabase.com",
    "senha": "123456"
  }'
```

Resposta (200 OK):

```json
{
  "token_gerado": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nome": "Administrador",
    "email": "admin@mangabase.com",
    "nome_usuario": "admin"
  }
}
```

### Cadastrar Usuário

```bash
curl -X POST http://localhost:8080/api/v1/auth/cadastro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Novo Usuário",
    "email": "novo@email.com",
    "nome_usuario": "novo_usuario",
    "senha": "123456"
  }'
```

### Listar Mangás (Público - Sem Token)

```bash
# Listar todos
curl "http://localhost:8080/api/v1/mangas"

# Filtrar por tipo
curl "http://localhost:8080/api/v1/mangas?tipo=manhwa"

# Buscar por título
curl "http://localhost:8080/api/v1/mangas?busca=one+piece"

# Paginação
curl "http://localhost:8080/api/v1/mangas?pagina=2&tamanho_pagina=5"
```

### Criar Mangá (Autenticado)

```bash
curl -X POST http://localhost:8080/api/v1/mangas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "One Piece",
    "tipo": "manga",
    "autor": "Eiichiro Oda",
    "editora": "Shueisha",
    "sinopse": "Aventura dos chapéus de palha em busca do tesouro One Piece",
    "ano_lancamento": 1997,
    "status": "em_andamento",
    "volumetoria": "107+ volumes",
    "genero": "Ação, Aventura, Comédia",
    "classificacao_etaria": "12",
    "url_capa": "https://example.com/covers/one-piece.jpg"
  }'
```

### Criar Manhwa (Autenticado)

```bash
curl -X POST http://localhost:8080/api/v1/mangas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "Solo Leveling",
    "tipo": "manhwa",
    "autor": "Geon-goo Kim",
    "sinopse": "Sung Jin-Woo se torna o caçador mais poderoso",
    "url_capa": "https://example.com/solo-leveling.jpg"
  }'
```

### Criar Gibi (Autenticado)

```bash
curl -X POST http://localhost:8080/api/v1/mangas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "titulo": "Turma da Mônica",
    "tipo": "gibi",
    "autor": "Mauricio de Sousa",
    "editora": "Editora Mauricio de Sousa",
    "url_capa": "https://example.com/monica.jpg"
  }'
```

### Atualizar Mangá (Autenticado)

```bash
curl -X PUT http://localhost:8080/api/v1/mangas/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "status": "completo",
    "volumetoria": "34 volumes"
  }'
```

### Deletar Mangá (Autenticado)

```bash
curl -X DELETE http://localhost:8080/api/v1/mangas/1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Estrutura do Banco de Dados

### Tabela: usuarios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único (auto increment) |
| nome | VARCHAR(100) | Nome do usuário |
| email | VARCHAR(150) | E-mail (único) |
| nome_usuario | VARCHAR(50) | Nome de usuário (único) |
| senha | VARCHAR(64) | Senha (SHA256) |

### Tabela: mangas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único (auto increment) |
| titulo | VARCHAR(200) | Título do mangá |
| tipo | ENUM | manga, manhwa, gibi |
| autor | VARCHAR(150) | Nome do autor |
| editora | VARCHAR(150) | Editora (opcional) |
| sinopse | TEXT | Sinopse (opcional) |
| ano_lancamento | YEAR | Ano de lançamento |
| status | ENUM | em_andamento, completo, hiatus, cancelado |
| volumetoria | VARCHAR(50) | Info de volumes/capítulos |
| genero | VARCHAR(200) | Gêneros (separados por vírgula) |
| classificacao_etaria | VARCHAR(20) | L, 10, 12, 16, 18 |
| url_capa | VARCHAR(500) | URL da imagem de capa |

### Tabelas Auxiliares

- **autores** - Cadastro detalhado de autores
- **generos** - Lista de gêneros
- **manga_generos** - Relacionamento N:N
- **capitulos** - Capítulos dos mangás

## Status Codes

| Código | Descrição |
|--------|-----------|
| 200 | OK - Sucesso |
| 201 | Created - Criado |
| 400 | Bad Request - Requisição inválida |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Não encontrado |
| 422 | Unprocessable Entity - Erro de validação |
| 500 | Internal Server Error - Erro interno |

## Licença

MIT License
