# Script para debuggear las preguntas desde la API

Write-Host "=== Checking Preguntas API ===" -ForegroundColor Cyan

# Intentar obtener todas las preguntas
Write-Host "Fetching all preguntas from API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/preguntas" -Method Get -ContentType "application/json" -ErrorAction Stop
    $preguntas = $response.Content | ConvertFrom-Json
    
    Write-Host "Total de preguntas: $($preguntas.Count)" -ForegroundColor Green
    
    if ($preguntas.Count -gt 0) {
        Write-Host "`nPrimera pregunta:" -ForegroundColor Yellow
        Write-Host ($preguntas[0] | ConvertTo-Json -Depth 3)
        
        Write-Host "`nNombres de propiedades de la primera pregunta:" -ForegroundColor Yellow
        $preguntas[0].PSObject.Properties.Name | ForEach-Object { Write-Host "  - $_" }
        
        Write-Host "`nMuestra de 5 preguntas (solo Idmodulo y Pregunta):" -ForegroundColor Yellow
        $preguntas | Select-Object -First 5 | ForEach-Object {
            Write-Host "  Idmodulo: $($_.Idmodulo), Pregunta: $($_.Pregunta | Substring 0 50)..."
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`nPrueba completada" -ForegroundColor Cyan
