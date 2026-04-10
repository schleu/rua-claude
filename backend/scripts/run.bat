@echo off

cd /d ..

:: Verifica se .venv existe
if not exist ".venv" (
    echo Ambiente virtual nao encontrado.
    echo Executando configure.bat...
    
    if exist "scripts\configure.bat" (
        call scripts\configure.bat
    ) else (
        echo ERRO: configure.bat nao encontrado em scripts\
        pause
        exit /b
    )
)

echo Ativando ambiente virtual...
call .venv\Scripts\activate

cls

echo Iniciando backend (FastAPI)...
uvicorn main:app --reload

pause