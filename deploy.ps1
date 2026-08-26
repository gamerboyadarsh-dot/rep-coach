for ($i = 0; $i -lt 5; $i++) {
  Write-Host "Deploying attempt $i..."
  npx surge dist repcoach-hackathon-live.surge.sh
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!"
    exit 0
  }
  Write-Host "Deployment failed. Retrying in 5s..."
  Start-Sleep -Seconds 5
}
exit 1
