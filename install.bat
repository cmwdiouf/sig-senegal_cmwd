@echo off
REM Installation rapide - SIG Sénégal PWA (Windows)
REM Exécuter en tant qu'administrateur

setlocal enabledelayedexpansion
setlocal enableextensions

REM Couleurs
color 0B

cls
echo.
echo ════════════════════════════════════════════════════════════════
echo        SIG SÉNÉGAL - Installation Progressive Web App
echo                      Version 1.0.0
echo ════════════════════════════════════════════════════════════════
echo.

REM Déterminer le répertoire
set APP_DIR=%~dp0
cd /d "%APP_DIR%"

REM ========================================================================
REM 1. Vérification des fichiers PWA
REM ========================================================================

echo [1/4] Vérification des fichiers PWA...
echo.

set "missing=0"

for %%F in (manifest.json sw.js index.html) do (
    if exist "%%F" (
        echo [OK] %%F
    ) else (
        echo [ERREUR] %%F - MANQUANT
        set "missing=1"
    )
)

if exist "js\geolocation.js" (
    echo [OK] js\geolocation.js
) else (
    echo [ERREUR] js\geolocation.js - MANQUANT
    set "missing=1"
)

if !missing! equ 1 (
    echo.
    echo ERREUR: Des fichiers PWA sont manquants!
    echo Vérifiez votre installation.
    pause
    exit /b 1
)

echo.
echo [OK] Tous les fichiers PWA sont présents!
echo.

REM ========================================================================
REM 2. Créer le fichier .htaccess pour Apache
REM ========================================================================

echo [2/4] Configuration Apache...
echo.

if not exist ".htaccess" (
    echo Création de .htaccess...
    (
        echo # Redirection HTTPS
        echo ^<IfModule mod_rewrite.c^>
        echo     RewriteEngine On
        echo     RewriteCond %%{HTTPS} off
        echo     RewriteRule ^(.*)$ https://%%{HTTP_HOST}%%{REQUEST_URI} [L,R=301]
        echo ^</IfModule^>
        echo.
        echo # Headers de sécurité
        echo ^<IfModule mod_headers.c^>
        echo     Header set X-Frame-Options "SAMEORIGIN"
        echo     Header set X-Content-Type-Options "nosniff"
        echo     Header set X-XSS-Protection "1; mode=block"
        echo     Header set Access-Control-Allow-Origin "*"
        echo ^</IfModule^>
        echo.
        echo # MIME types
        echo ^<IfModule mod_mime.c^>
        echo     AddType application/javascript .js
        echo     AddType application/json .json
        echo     AddType application/geo+json .geojson
        echo ^</IfModule^>
    ) > .htaccess
    echo [OK] .htaccess créé!
) else (
    echo [OK] .htaccess existe déjà
)

echo.

REM ========================================================================
REM 3. Déterminer le serveur web local
REM ========================================================================

echo [3/4] Détection du serveur local...
echo.

set "server_found=0"

REM Vérifier si Python est installé
python --version >nul 2>&1
if !errorlevel! equ 0 (
    for /f "tokens=*" %%A in ('python --version 2^>^&1') do set "py_version=%%A"
    echo [OK] Python trouvé: !py_version!
    set "server_found=1"
    set "use_python=1"
)

REM Vérifier si Node.js est installé
if !server_found! equ 0 (
    node --version >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "tokens=*" %%A in ('node --version') do set "node_version=%%A"
        echo [OK] Node.js trouvé: !node_version!
        set "server_found=1"
        set "use_node=1"
    )
)

if !server_found! equ 0 (
    echo [ATTENTION] Aucun serveur local détecté
    echo Vous devez installer:
    echo - Python: https://www.python.org
    echo - OU Node.js: https://nodejs.org
)

echo.

REM ========================================================================
REM 4. Lancer le serveur local
REM ========================================================================

echo [4/4] Lancement du serveur local...
echo.

if "!use_python!"=="1" (
    cls
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo                    SIG Sénégal - En ligne!
    echo ════════════════════════════════════════════════════════════════
    echo.
    echo Serveur: http://localhost:8000
    echo IMPORTANT: Utilisez HTTPS en production!
    echo.
    echo Appuyez sur Ctrl+C pour arrêter le serveur
    echo.
    
    python -m http.server 8000
) else if "!use_node!"=="1" (
    cls
    echo.
    echo ════════════════════════════════════════════════════════════════
    echo                    SIG Sénégal - En ligne!
    echo ════════════════════════════════════════════════════════════════
    echo.
    echo Serveur: http://localhost:8080
    echo IMPORTANT: Utilisez HTTPS en production!
    echo.
    echo Appuyez sur Ctrl+C pour arrêter le serveur
    echo.
    
    npx http-server --port 8080
) else (
    echo.
    echo ERREUR: Impossible de lancer le serveur local
    echo Veuillez installer Python ou Node.js
    echo.
    pause
    exit /b 1
)

pause
