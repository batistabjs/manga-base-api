<?php
/**
 * Helper para autenticação JWT
 * Manga Base API
 */

class JWT {
    private static $secret = 'manga_base_secret_key_2024_!@#$%';
    private static $algorithm = 'HS256';
    private static $expiration = 3600;
    
    public static function generateToken(int $userId): string {
        $header = self::base64UrlEncode(json_encode([
            'typ' => 'JWT',
            'alg' => self::$algorithm
        ]));
        
        $payload = self::base64UrlEncode(json_encode([
            'iat' => time(),
            'exp' => time() + self::$expiration,
            'user_id' => $userId
        ]));
        
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::$secret, true)
        );
        
        return "$header.$payload.$signature";
    }
    
    public static function validateToken(string $token): ?array {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }
        
        [$header, $payload, $signature] = $parts;
        
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::$secret, true)
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }
        
        $data = json_decode(self::base64UrlDecode($payload), true);
        
        if (!$data) {
            return null;
        }
        
        if (isset($data['exp']) && $data['exp'] < time()) {
            return null;
        }
        
        return $data;
    }
    
    public static function getUserIdFromToken(string $token): ?int {
        $data = self::validateToken($token);
        
        if (!$data || !isset($data['user_id'])) {
            return null;
        }
        
        return (int) $data['user_id'];
    }
    
    public static function getTokenFromHeader(): ?string {
        $headers = self::getAuthorizationHeader();
        
        if (!$headers) {
            return null;
        }
        
        if (preg_match('/Bearer\s+(.+)$/i', $headers, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    private static function getAuthorizationHeader(): ?string {
        $headers = [];
        
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers['authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        if (empty($headers['authorization'])) {
            if (function_exists('apache_request_headers')) {
                $allHeaders = apache_request_headers();
                foreach ($allHeaders as $key => $value) {
                    if (strtolower($key) === 'authorization') {
                        $headers['authorization'] = $value;
                        break;
                    }
                }
            }
        }
        
        return $headers['authorization'] ?? null;
    }
    
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
