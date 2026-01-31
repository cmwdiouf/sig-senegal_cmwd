#!/bin/bash
# Script d'installation rapide - SIG Sénégal PWA

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Bannière
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       SIG SÉNÉGAL - Installation Progressive Web App          ║"
echo "║                      Version 1.0.0                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Variables
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_TYPE=""
HTTPS_ENABLED=false

# ============================================================================
# 1. Détection du serveur web
# ============================================================================

echo -e "${YELLOW}[1/5] Détection du serveur web...${NC}"

if command -v apache2 &> /dev/null; then
    echo -e "${GREEN}✓ Apache2 détecté${NC}"
    SERVER_TYPE="apache"
elif command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓ Nginx détecté${NC}"
    SERVER_TYPE="nginx"
elif command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js détecté${NC}"
    SERVER_TYPE="node"
else
    echo -e "${YELLOW}⚠ Aucun serveur web détecté. Utilisation d'un serveur Python...${NC}"
    SERVER_TYPE="python"
fi

# ============================================================================
# 2. Vérification des fichiers PWA
# ============================================================================

echo -e "\n${YELLOW}[2/5] Vérification des fichiers PWA...${NC}"

FILES=(
    "manifest.json"
    "sw.js"
    "js/geolocation.js"
    "js/pwa.js"
    "index.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$APP_DIR/$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file - MANQUANT${NC}"
    fi
done

# ============================================================================
# 3. Configuration du serveur
# ============================================================================

echo -e "\n${YELLOW}[3/5] Configuration du serveur...${NC}"

case $SERVER_TYPE in
    apache)
        echo -e "${BLUE}Configuration Apache2${NC}"
        
        # Vérifier les modules
        if ! apache2ctl -M | grep -q rewrite; then
            echo -e "${YELLOW}⚠ Module rewrite non activé. Activation...${NC}"
            sudo a2enmod rewrite
        fi
        
        if ! apache2ctl -M | grep -q headers; then
            echo -e "${YELLOW}⚠ Module headers non activé. Activation...${NC}"
            sudo a2enmod headers
        fi
        
        # Créer .htaccess si nécessaire
        if [ ! -f "$APP_DIR/.htaccess" ]; then
            cat > "$APP_DIR/.htaccess" << 'EOF'
# Redirection HTTPS
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Headers de sécurité
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
    Header set Access-Control-Allow-Origin "*"
</IfModule>

# MIME types
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType application/json .json
    AddType application/geo+json .geojson
    AddType font/woff2 .woff2
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/xml
    AddOutputFilterByType DEFLATE text/css text/javascript
    AddOutputFilterByType DEFLATE application/xml application/json
</IfModule>
EOF
            echo -e "${GREEN}✓ .htaccess créé${NC}"
        fi
        ;;
        
    nginx)
        echo -e "${BLUE}Configuration Nginx${NC}"
        echo -e "${YELLOW}Créer/modifier /etc/nginx/sites-available/sig-senegal:${NC}"
        cat << 'EOF'

server {
    listen 443 ssl;
    server_name sig-senegal.local;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/html/sig-senegal;
    index index.html;
    
    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # Headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Access-Control-Allow-Origin "*";
    
    # Cache control
    location ~* \.(js|css|png|jpg|gif|ico|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML
    location ~ \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # Service Worker
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    
    # Manifest
    location = /manifest.json {
        add_header Cache-Control "no-cache";
        add_header Content-Type "application/json";
    }
}

# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name sig-senegal.local;
    return 301 https://$server_name$request_uri;
}
EOF
        ;;
        
    node)
        echo -e "${BLUE}Configuration Node.js${NC}"
        echo -e "${GREEN}Utilisation de: npx http-server${NC}"
        ;;
        
    python)
        echo -e "${BLUE}Configuration Python${NC}"
        echo -e "${GREEN}Utilisation de: python -m http.server${NC}"
        ;;
esac

# ============================================================================
# 4. Vérification HTTPS
# ============================================================================

echo -e "\n${YELLOW}[4/5] Vérification HTTPS...${NC}"

if [ "$SERVER_TYPE" = "apache" ] || [ "$SERVER_TYPE" = "nginx" ]; then
    echo -e "${YELLOW}⚠ IMPORTANT: HTTPS est OBLIGATOIRE pour les PWA${NC}"
    echo -e "${BLUE}Obtenir un certificat SSL gratuit avec Let's Encrypt:${NC}"
    echo -e "${GREEN}certbot certonly --standalone -d votre-domaine.com${NC}"
fi

# ============================================================================
# 5. Test de l'application
# ============================================================================

echo -e "\n${YELLOW}[5/5] Lancement de l'application...${NC}"

case $SERVER_TYPE in
    apache)
        echo -e "${GREEN}✓ Rechargez Apache: sudo systemctl reload apache2${NC}"
        ;;
    nginx)
        echo -e "${GREEN}✓ Testez Nginx: sudo nginx -t${NC}"
        echo -e "${GREEN}✓ Rechargez Nginx: sudo systemctl reload nginx${NC}"
        ;;
    node)
        cd "$APP_DIR"
        npx http-server --port 8080 --ssl
        ;;
    python)
        cd "$APP_DIR"
        echo -e "${GREEN}Serveur démarré sur http://localhost:8000${NC}"
        python3 -m http.server 8000
        ;;
esac

# ============================================================================
# Affichage final
# ============================================================================

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   Installation Terminée! 🎉                    ${NC}
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Prochaines étapes:${NC}"
echo -e "1. Accédez à: ${YELLOW}https://votre-domaine.com${NC}"
echo -e "2. Testez sur: ${YELLOW}DevTools (F12) → Application${NC}"
echo -e "3. Lisez: ${YELLOW}PWA_GUIDE.md${NC}"
echo -e "4. Installez sur mobile: ${YELLOW}Chrome/Safari → Menu d'installation${NC}"

echo -e "\n${BLUE}Documentation:${NC}"
echo -e "• PWA_GUIDE.md - Guide utilisateur complet"
echo -e "• INSTALLATION_GUIDE.md - Configuration serveur"
echo -e "• CHECKLIST.md - Vérification pré-déploiement"
echo -e "• EXAMPLES.js - Exemples de personnalisation"

echo -e "\n${BLUE}Support:${NC}"
echo -e "• Vérifier: DevTools → Console (F12)"
echo -e "• Service Worker: DevTools → Application"
echo -e "• Cache: DevTools → Application → Cache Storage"

# ============================================================================
# Fin du script
# ============================================================================
