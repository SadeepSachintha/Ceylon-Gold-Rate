# Use the official PHP 8.2 Apache base image
FROM php:8.2-apache

# Expose port 7860 as required by Hugging Face Spaces
EXPOSE 7860

# Configure Apache to listen on port 7860 instead of the default port 80
RUN sed -i 's/Listen 80/Listen 7860/g' /etc/apache2/ports.conf && \
    sed -i 's/<VirtualHost \*:80>/<VirtualHost \*:7860>/g' /etc/apache2/sites-available/000-default.conf

# Install system dependencies and ensure the PHP curl extension is enabled
RUN apt-get update && apt-get install -y \
    libcurl4-openssl-dev \
    pkg-config \
    && docker-php-ext-install curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the application source code to the Apache document root
COPY . /var/www/html/

# Create the rates cache file and grant full write permissions to the Apache web server user (www-data)
RUN touch /var/www/html/rates_cache.json && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html

# Start Apache in the foreground
CMD ["apache2-foreground"]
