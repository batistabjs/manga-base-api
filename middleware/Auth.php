<?php
/**
 * Middleware de Autenticação
 * Manga Base API
 */

class Auth {
    public static function check(): int {
        $token = JWT::getTokenFromHeader();
        
        if (!$token) {
            Response::unauthorized('Usuário não autenticado');
        }
        
        $userId = JWT::getUserIdFromToken($token);
        
        if (!$userId) {
            Response::forbidden('Chave de acesso inválida');
        }
        
        return $userId;
    }
    
    public static function optional(): ?int {
        $token = JWT::getTokenFromHeader();
        
        if (!$token) {
            return null;
        }
        
        return JWT::getUserIdFromToken($token);
    }
}
