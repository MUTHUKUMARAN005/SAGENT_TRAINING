@echo off
echo ========================================
echo Rebuilding DaanSetu Backend
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Cleaning previous build...
call mvnw.cmd clean
if errorlevel 1 (
    echo ERROR: Clean failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Compiling and packaging...
call mvnw.cmd compile
if errorlevel 1 (
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Verifying DaanSetuApplication.class exists...
if exist "target\classes\com\daansetu\DaanSetuApplication.class" (
    echo SUCCESS: DaanSetuApplication.class found!
) else (
    echo ERROR: DaanSetuApplication.class not found after compilation!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo You can now run the application from IntelliJ IDEA
pause
