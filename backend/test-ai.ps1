# File paths
$inputFile = "inputs.json"
$logFile = "ai_results.log"
$csvFile = "ai_results.csv"

# If CSV does not exist, create header
if (-not (Test-Path $csvFile)) {
    "timestamp,features,prediction,probabilities" | Out-File -FilePath $csvFile -Encoding utf8
}

Write-Host "🔄 Watching $inputFile for new inputs... Press Ctrl+C to stop.`n"

# Keep track of already processed feature sets
$processed = @{}

while ($true) {
    try {
        # Load inputs from JSON
        $inputs = Get-Content $inputFile | ConvertFrom-Json

        foreach ($item in $inputs) {
            $key = ($item.features -join ",")

            # Skip if already processed
            if ($processed.ContainsKey($key)) { continue }

            # Convert input back to JSON string for curl
            $input = @{ features = $item.features } | ConvertTo-Json -Compress
            Write-Host "Sending new input: $input"

            # Send request and parse response
            $response = curl -X POST http://127.0.0.1:5000/ai_classify `
                -H "Content-Type: application/json" `
                -d $input | ConvertFrom-Json

            # Extract details
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $features = $item.features -join ", "
            $prediction = $response.prediction
            $probs = $response.probabilities -join ", "

            # Write human-readable log
            $logLine = "$timestamp | Input: [$features] | Prediction: $prediction | Probabilities: [$probs]"
            $logLine | Out-File -FilePath $logFile -Append -Encoding utf8

            # Write structured CSV row
            $csvLine = "$timestamp,""$features"",$prediction,""$probs"""
            $csvLine | Out-File -FilePath $csvFile -Append -Encoding utf8

            Write-Host "✅ Logged: $logLine`n-----------------------------`n"

            # Mark this input as processed
            $processed[$key] = $true
        }

    } catch {
        Write-Host "⚠️ Error reading $inputFile or sending request."
    }

    # Wait before checking again
    Start-Sleep -Seconds 10
}
