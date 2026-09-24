"""
Cross-Platform Single Command Application Launcher (HTH-CV-09)
Launches FastAPI backend (port 8000) and Vite React frontend (port 5173).
"""

import os
import sys
import time
import subprocess
import signal

def main():
    print("==================================================")
    print(" HTH-CV-09 Sign Language Communication Bridge")
    print("==================================================")

    model_path = os.path.join("models", "best_model.pkl")
    if not os.path.exists(model_path):
        print("\nModel not found. Running training pipeline...")
        subprocess.run([sys.executable, "training/train.py"], check=True)

    print("\nStarting Backend (Uvicorn FastAPI)...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    backend_proc = subprocess.Popen(backend_cmd)

    time.sleep(3)

    print("\nStarting Frontend (Vite React)...")
    frontend_dir = os.path.abspath("frontend")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)

    print("\n==================================================")
    print(" Application is RUNNING:")
    print("   Frontend: http://localhost:5173")
    print("   Backend:  http://localhost:8000")
    print("   Health:   http://localhost:8000/health")
    print("==================================================")
    print("Press Ctrl+C to terminate both servers.\n")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
