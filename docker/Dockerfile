FROM php:8.2-apache

# Enable Apache mod_rewrite for URL rewriting
RUN a2enmod rewrite

# Install PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql

# Copy project files to Apache document root
COPY .. /var/www/html/

# Ensure proper permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 8080
