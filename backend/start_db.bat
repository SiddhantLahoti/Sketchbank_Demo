@echo off
echo Starting Portable PostgreSQL Server...
"D:\INTERNGOLD_PROJECTS\Jewelery_Management_System\database\pgsql\bin\pg_ctl.exe" -D "D:\INTERNGOLD_PROJECTS\Jewelery_Management_System\database\pgsql\data" start
echo.
echo Database server is ready!
pause