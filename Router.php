<?php
/**
 * Router - Rotas da API
 * Manga Base API
 */

class Router {
    private $routes = [];
    
    public function get(string $path, $handler): self {
        $this->routes['GET'][$path] = $handler;
        return $this;
    }
    
    public function post(string $path, $handler): self {
        $this->routes['POST'][$path] = $handler;
        return $this;
    }
    
    public function put(string $path, $handler): self {
        $this->routes['PUT'][$path] = $handler;
        return $this;
    }
    
    public function delete(string $path, $handler): self {
        $this->routes['DELETE'][$path] = $handler;
        return $this;
    }
    
    public function dispatch(): void {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = $_SERVER['REQUEST_URI'];
        
        // Remover query string e barra final
        $uri = strtok($uri, '?');
        $uri = rtrim($uri, '/');
        
        // Normalizar URI
        $path = preg_replace('#^/api/v1#', '', $uri);
        $path = $path ?: '/';
        
        // Verificar rota exata
        if (isset($this->routes[$method][$path])) {
            $this->callRoute($this->routes[$method][$path]);
            return;
        }
        
        // Verificar rotas com parâmetros
        if (isset($this->routes[$method])) {
            foreach ($this->routes[$method] as $routePath => $handler) {
                $pattern = $this->convertToRegex($routePath);
                
                if (preg_match($pattern, $path, $matches)) {
                    $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                    $this->callRoute($handler, $params);
                    return;
                }
            }
        }
        
        Response::notFound('Rota não encontrada');
    }
    
    private function convertToRegex(string $pattern): string {
        $pattern = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        return '#^' . $pattern . '$#';
    }
    
    private function callRoute($handler, array $params = []): void {
        // Se for uma closure
        if (is_callable($handler) && !is_array($handler)) {
            call_user_func_array($handler, array_values($params));
            return;
        }
        
        // Se for array [Controller, method]
        [$controllerName, $methodName] = $handler;
        
        // Mapear nomes de controller
        $classMap = [
            'Manga' => 'MangaController'
        ];
        
        $className = $classMap[$controllerName] ?? $controllerName . 'Controller';
        
        if (!class_exists($className)) {
            Response::serverError("Controller não encontrado: {$className}");
        }
        
        $controller = new $className();
        
        if (!method_exists($controller, $methodName)) {
            Response::serverError("Método não encontrado: {$methodName}");
        }
        
        call_user_func_array([$controller, $methodName], array_values($params));
    }
}
