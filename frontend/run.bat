@echo off

echo Instalando dependencias...
call npm install

echo.
echo Iniciando frontend (React)...
call npm run dev

pause