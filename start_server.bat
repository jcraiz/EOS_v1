@echo off
title Ingles en Escena - PWA Server
echo =========================================================================
echo INICIANDO SERVIDOR LOCAL PARA "INGLES EN ESCENA" (PWA)
echo =========================================================================
echo.
cd /d "%~dp0"

where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo Iniciando servidor con Node.js / npx...
    start http://localhost:3000
    npx -y serve . -l 3000
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Iniciando servidor con Python...
    start http://localhost:3000
    python -m http.server 3000
    goto end
)

echo No se detecto Node.js ni Python en el PATH del sistema.
echo Abriendo directamente index.html en tu navegador...
start index.html

:end
