# HTH-CV-09 Model Training Pipeline Script (Windows PowerShell)
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " HTH-CV-09 Sign Language Training Pipeline" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Dataset Audit
Write-Host "`n[1/3] Running Dataset Audit..." -ForegroundColor Yellow
python training/inspect_dataset.py

# 2. Train Model
Write-Host "`n[2/3] Training and Selecting Best Classifier..." -ForegroundColor Yellow
python training/train.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "Training failed." -ForegroundColor Red
    exit 1
}

# 3. Comprehensive Evaluation
Write-Host "`n[3/3] Generating Evaluation Metrics and Confusion Matrix..." -ForegroundColor Yellow
python training/evaluate.py

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " Training & Evaluation Complete!" -ForegroundColor Green
Write-Host " Model: models/best_model.pkl" -ForegroundColor White
Write-Host " Report: reports/model_evaluation.md" -ForegroundColor White
Write-Host " Matrix: reports/confusion_matrix.png" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Green
