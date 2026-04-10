@echo off
echo Saindo do ambiente virtual...
deactivate

echo Removendo ambiente virtual antigo...
rmdir /s /q .venv

echo Criando novo ambiente virtual...
py -m venv .venv

echo Ativando ambiente virtual...
call .\.venv\Scripts\activate


echo Atualizando o pip
python.exe -m pip install --upgrade pip

echo Instalando dependências...
pip install -r requirements.txt

echo Limpando console
cls

pause