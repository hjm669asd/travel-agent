#!/bin/bash

echo "🗺️ 旅行规划 Agent 启动脚本"
echo "================================"
echo ""

BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

echo "[1/3] 检查后端依赖..."
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "  正在创建 Python 虚拟环境..."
    python -m venv $BACKEND_DIR/venv
fi

echo "  激活虚拟环境并安装依赖..."
source $BACKEND_DIR/venv/bin/activate
pip install -r $BACKEND_DIR/requirements.txt -q

echo ""
echo "[2/3] 检查前端依赖..."
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "  正在安装前端依赖..."
    cd $FRONTEND_DIR && npm install && cd ..
fi

echo ""
echo "[3/3] 启动服务..."
echo ""
echo "后端服务将在 http://localhost:8000 运行"
echo "前端服务将在 http://localhost:5173 运行"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

trap 'kill $(jobs -p) 2>/dev/null; exit' INT TERM

cd $BACKEND_DIR && source venv/bin/activate && python -m uvicorn app.main:app --reload --port 8000 &
cd $FRONTEND_DIR && npm run dev &

wait
