@echo off
cd /d "%~dp0.."
echo Instalando/validando openpyxl...
py -m pip install openpyxl -q
echo.
echo Convirtiendo archivos de la carpeta "entrada" ...
py herramientas\build_data.py
echo.
echo Listo. Revisa las ADVERTENCIAS (si hay) y luego sube la carpeta "datos" al sitio.
pause
