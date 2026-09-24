# HTH-CV-09 Test Suite Execution Script (Windows PowerShell)
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " HTH-CV-09 Test Suite" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host "`n[1/4] Running Normalization & Feature Engineering Tests..." -ForegroundColor Yellow
python tests/test_normalization.py

Write-Host "`n[2/4] Running Model & Inference Latency Tests..." -ForegroundColor Yellow
python tests/test_model.py

Write-Host "`n[3/4] Running FastAPI & WebSocket Integration Tests..." -ForegroundColor Yellow
python tests/test_api.py

Write-Host "`n[4/4] Running Robustness & Stress Benchmark..." -ForegroundColor Yellow
python tests/test_robustness.py

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " All Tests & Benchmarks Completed Successfully!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
