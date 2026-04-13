# 旅行规划 Agent - 启动脚本

Write-Host "🗺️ 旅行规划 Agent 启动脚本" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$BackendDir = "backend"
$FrontendDir = "frontend"

Write-Host "[1/3] 检查后端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "$BackendDir\venv")) {
    Write-Host "  正在创建 Python 虚拟环境..." -ForegroundColor Gray
    python -m venv $BackendDir\venv
}

Write-Host "  激活虚拟环境并安装依赖..." -ForegroundColor Gray
& "$BackendDir\venv\Scripts\Activate.ps1"
pip install -r $BackendDir\requirements.txt -q

Write-Host "`n[2/3] 检查前端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "$FrontendDir\node_modules")) {
    Write-Host "  正在安装前端依赖..." -ForegroundColor Gray
    npm install --prefix $FrontendDir
}

Write-Host "`n[3/3] 启动服务..." -ForegroundColor Yellow

Write-Host "`n后端服务将在 http://localhost:8000 运行" -ForegroundColor Green
Write-Host "前端服务将在 http://localhost:5173 运行`n" -ForegroundColor Green

Write-Host "按 Ctrl+C 停止所有服务`n" -ForegroundColor Gray

$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    & "..\venv\Scripts\python" -m uvicorn app.main:app --reload --port 8000
} -ArgumentList (Resolve-Path $BackendDir)

$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList (Resolve-Path $FrontendDir)

Write-Host "后端 Job ID: $($backendJob.Id)" -ForegroundColor Cyan
Write-Host "前端 Job ID: $($frontendJob.Id)`n" -ForegroundColor Cyan

Write-Host "等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "✅ 服务已启动！" -ForegroundColor Green
Write-Host "请在浏览器中打开: http://localhost:5173" -ForegroundColor Cyan

Receive-Job -Job $backendJob, $frontendJob -Wait
