@echo off

cd /d ..

echo Ativando ambiente virtual...
call .venv\Scripts\activate

cls

echo Iniciando backend (FastAPI)...
uvicorn main:app --reload

pause