<?php
/**
 * Controller: Autenticação
 * Manga Base API
 */

class AuthController {
    private $usuarioModel;
    
    public function __construct() {
        $this->usuarioModel = new Usuario();
    }
    
    /**
     * POST /api/v1/auth/cadastro
     * Cadastra novo usuário e retorna token
     */
    public function cadastro(): void {
        $data = Response::getRequestBody();
        
        // Validações
        $errors = $this->validateCadastro($data);
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        // Verificar se email já existe
        if ($this->usuarioModel->emailExists($data['email'])) {
            Response::validationError(['email' => ['Este e-mail já está em uso']]);
        }
        
        // Verificar se nome de usuário já existe
        if ($this->usuarioModel->usernameExists($data['nome_usuario'])) {
            Response::validationError(['nome_usuario' => ['Este nome de usuário já está em uso']]);
        }
        
        // Criar usuário
        $usuario = $this->usuarioModel->create($data);
        
        // Gerar token
        $token = JWT::generateToken($usuario['id']);
        
        Response::created([
            'token_gerado' => $token,
            'mensagem' => 'Cadastro realizado com sucesso',
            'usuario' => $usuario
        ]);
    }
    
    /**
     * POST /api/v1/auth/login
     * Autentica usuário e retorna token
     */
    public function login(): void {
        $data = Response::getRequestBody();
        
        // Validações
        $errors = [];
        
        if (empty($data['email'])) {
            $errors['email'] = ['O campo e-mail é obrigatório'];
        }
        
        if (empty($data['senha'])) {
            $errors['senha'] = ['O campo senha é obrigatório'];
        }
        
        if (!empty($errors)) {
            Response::validationError($errors);
        }
        
        // Buscar usuário por email
        $usuario = $this->usuarioModel->getByEmailWithPassword($data['email']);
        
        if (!$usuario) {
            Response::validationError(['email' => ['E-mail ou senha inválidos']], 'E-mail ou senha inválidos');
        }
        
        // Verificar senha
        $senhaHash = hash('sha256', $data['senha']);
        
        if ($senhaHash !== $usuario['senha']) {
            Response::validationError(['senha' => ['E-mail ou senha inválidos']], 'E-mail ou senha inválidos');
        }
        
        // Gerar token
        $token = JWT::generateToken($usuario['id']);
        
        Response::success([
            'token_gerado' => $token,
            'usuario' => [
                'id' => $usuario['id'],
                'nome' => $usuario['nome'],
                'email' => $usuario['email'],
                'nome_usuario' => $usuario['nome_usuario']
            ]
        ]);
    }
    
    /**
     * GET /api/v1/auth/me
     * Retorna dados do usuário autenticado
     */
    public function me(): void {
        $userId = Auth::check();
        
        $usuario = $this->usuarioModel->getById($userId);
        
        if (!$usuario) {
            Response::notFound('Usuário não encontrado');
        }
        
        Response::success([
            'usuario' => $usuario
        ]);
    }
    
    /**
     * Valida dados de cadastro
     */
    private function validateCadastro(array $data): array {
        $errors = [];
        
        if (empty($data['nome'])) {
            $errors['nome'] = ['O campo nome é obrigatório'];
        } elseif (strlen($data['nome']) < 3) {
            $errors['nome'] = ['O nome deve ter no mínimo 3 caracteres'];
        }
        
        if (empty($data['email'])) {
            $errors['email'] = ['O campo e-mail é obrigatório'];
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = ['E-mail inválido'];
        }
        
        if (empty($data['nome_usuario'])) {
            $errors['nome_usuario'] = ['O campo nome de usuário é obrigatório'];
        } elseif (strlen($data['nome_usuario']) < 3) {
            $errors['nome_usuario'] = ['O nome de usuário deve ter no mínimo 3 caracteres'];
        }
        
        if (empty($data['senha'])) {
            $errors['senha'] = ['O campo senha é obrigatório'];
        } elseif (strlen($data['senha']) < 6) {
            $errors['senha'] = ['A senha deve ter um mínimo de 6 caracteres'];
        }
        
        return $errors;
    }
}
