@echo off

echo Verificando se a porta 5173 esta em uso...

netstat -ano | findstr :5173 > nul

if %errorlevel%==0 (
    echo Porta 5173 ja esta em uso.
    echo Frontend provavelmente ja esta rodando.
    pause
    exit /b
)

echo Instalando dependencias...
call npm install

echo.
echo Iniciando frontend (React)...
call npm run dev

pause