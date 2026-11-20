@echo off
cd /d "%~dp0"
call ..\venv\Scripts\activate.bat
python db_create.py
pause