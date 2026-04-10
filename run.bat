@echo off

echo Iniciando backend...
start "Backend" cmd /k "cd /d backend\scripts && call run.bat"

echo Iniciando frontend...
start "Frontend" cmd /k "cd /d frontend\ && call run.bat"

echo.
echo Ambos os servicos foram iniciados em janelas separadas.
pause