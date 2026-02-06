#!/bin/bash
# Stop all AgentChat live services

echo "Stopping AgentChat services..."

# Stop backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "✓ Backend stopped (PID: $BACKEND_PID)"
    else
        echo "✓ Backend already stopped"
    fi
    rm .backend.pid
fi

# Stop simulator
if [ -f .simulator.pid ]; then
    SIMULATOR_PID=$(cat .simulator.pid)
    if kill -0 $SIMULATOR_PID 2>/dev/null; then
        kill $SIMULATOR_PID
        echo "✓ Simulator stopped (PID: $SIMULATOR_PID)"
    else
        echo "✓ Simulator already stopped"
    fi
    rm .simulator.pid
fi

echo ""
echo "All services stopped."
