@echo off
echo Installing MCPHub Desktop Agent...
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed
    exit /b 1
)

echo.
echo [2/3] Building agent...
call npm run build
if %errorlevel% neq 0 (
    echo Error: Build failed
    exit /b 1
)

echo.
echo [3/3] Linking globally...
call npm link
if %errorlevel% neq 0 (
    echo Error: npm link failed
    echo Try running this script as Administrator
    exit /b 1
)

echo.
echo ===============================================
echo MCPHub Desktop Agent installed successfully!
echo ===============================================
echo.
echo To start the agent, run:
echo   mcphub-agent start
echo.
echo For more information, see SETUP.md
echo.
pause
