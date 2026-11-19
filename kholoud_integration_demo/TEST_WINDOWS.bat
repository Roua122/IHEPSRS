@echo off
cd /d "%~dp0"
py -3 -m unittest -v test_integration.py
if errorlevel 1 python -m unittest -v test_integration.py
pause
