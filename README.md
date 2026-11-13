# Manga Base API

API RESTful para cadastro e gerenciamento de Mangás, Manhwas e Gibis.

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **JSON** - Armazenamento de dados em arquivos
- **JWT (JSON Web Tokens)** - Autenticação

## Estrutura do Projeto

```
manga-base-api/
├── dados/
│   ├── mangas.json            # Dados dos mangás
│   └── usuarios.json          # Dados dos usuários
├── public/                    # TELAS (front-end servido pelo server.js)
│   ├── css/comum.css          # Design system compartilhado (tokens + componentes)
│   ├── js/comum.js            # Cliente da API, sessão JWT, menu, modal "Ver detalhes"
│   ├── index.html|css|js      # Landing page (/)
│   ├── auth/                  # Autenticação JWT (/auth)
│   ├── catalogo/              # Catálogo público e busca (/catalogo)
│   ├── cadastro/              # Cadastro de obra (/cadastro)
│   ├── editar/                # Edição de obra (/editar?id=N)
│   └── dashboard/             # Gerenciamento CRUD (/dashboard)
├── telas/                     # Maquetes de referência (não servidas)
├── dados.js                   # Módulo de acesso aos dados
├── jwt.js                     # Autenticação JWT
├── package.json               # Dependências do projeto
├── server.js                  # Ponto de entrada / servidor
└── README.md                  # Este arquivo
```

## Telas (Front-end)

O padrão adotado: **uma pasta por tela em `public/`**, cada uma com três arquivos
(`index.html`, `<tela>.css`, `<tela>.js`) — HTML, CSS e JavaScript puros, sem frameworks.
Estilos e componentes compartilhados ficam em `public/css/comum.css` (paleta do
`telas/.../DESIGN.md`) e utilitários em `public/js/comum.js`.

| Rota | Tela | Endpoints consumidos |
|------|------|----------------------|
| `/` | Landing page (hero, vitrine, docs da API) | `GET /mangas`, `GET /mangas/tipo/{tipo}`, `GET /mangas/estatisticas`, `GET /mangas/{id}` |
| `/auth` | Entrar / criar conta + inspetor de JWT | `POST /auth/login`, `POST /auth/cadastro`, `GET /auth/me` |
| `/catalogo` | Catálogo público, busca, filtros, ordenação e paginação | `GET /mangas?…`, `GET /mangas/estatisticas`, `GET /mangas/{id}` |
| `/cadastro` | Cadastro de obra (prévia ao vivo + payload JSON) | `POST /mangas` (Bearer) |
| `/editar?id=N` | Edição de obra + exclusão confirmada | `GET /mangas/{id}`, `PUT /mangas/{id}`, `DELETE /mangas/{id}` (Bearer) |
| `/dashboard` | Gerenciamento CRUD completo + terminal de eventos | `GET /auth/me`, `GET /mangas/estatisticas`, `GET/POST/PUT/DELETE /mangas` (Bearer) |

O token JWT retornado por login/cadastro é salvo no `localStorage`
(`manga_base_token` / `manga_base_usuario`) e injetado automaticamente no header
`Authorization: Bearer …` por `public/js/comum.js`.

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

## Status Suportados

| Status | Descrição |
|--------|-----------|
| **em_andamento** | Publicação em andamento |
| **completo** | Obra finalizada |
| **hiatus** | Pausa temporária |
| **cancelado** | Obra cancelada |

## Instalação

### 1. Instalar Node.js

Certifique-se de que o Node.js esteja instalado:
```
node -v
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar o servidor

```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

### 4. Acessar a aplicação

```
http://localhost:8081/            → Landing page
http://localhost:8081/catalogo    → Catálogo público
http://localhost:8081/auth        → Login / cadastro de conta
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
curl -X POST http://localhost:8081/api/v1/auth/login \
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

### Listar Mangás (Público - Sem Token)

```bash
# Listar todos
curl "http://localhost:8081/api/v1/mangas"

# Filtrar por tipo
curl "http://localhost:8081/api/v1/mangas?tipo=manhwa"

# Buscar por título
curl "http://localhost:8081/api/v1/mangas?busca=one+piece"

# Paginação
curl "http://localhost:8081/api/v1/mangas?pagina=2&tamanho_pagina=5"
```

### Criar Mangá (Autenticado)

```bash
curl -X POST http://localhost:8081/api/v1/mangas \
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

### Atualizar Mangá (Autenticado)

```bash
curl -X PUT http://localhost:8081/api/v1/mangas/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "status": "completo",
    "volumetoria": "34 volumes"
  }'
```

### Deletar Mangá (Autenticado)

```bash
curl -X DELETE http://localhost:8081/api/v1/mangas/1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

## Estrutura do Dados (JSON)

### Arquivo: dados/usuarios.json

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | int | ID único (auto increment) |
| nome | string | Nome do usuário |
| email | string | E-mail (único) |
| nome_usuario | string | Nome de usuário (único) |
| senha | string | Senha (SHA256) |

### Arquivo: dados/mangas.json

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | int | ID único (auto increment) |
| titulo | string | Título do mangá |
| tipo | string | manga, manhwa, gibi |
| autor | string | Nome do autor |
| editora | string | Editora (opcional) |
| sinopse | string | Sinopse (opcional) |
| ano_lancamento | int | Ano de lançamento |
| status | string | em_andamento, completo, hiatus, cancelado |
| volumetoria | string | Info de volumes/capítulos |
| genero | string | Gêneros (separados por vírgula) |
| classificacao_etaria | string | L, 10, 12, 16, 18 |
| url_capa | string | URL da imagem de capa |

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
