# Azure OpenAI Test Script
# Replace the variables below with your actual values

# ========================================
# CONFIGURATION - UPDATE THESE VALUES
# ========================================
$endpoint = "https://YOUR-RESOURCE-NAME.openai.azure.com/"
$apiKey = "YOUR-API-KEY-HERE"
$deployment = "gpt-4o"  # or your deployment name

# ========================================
# TEST SCRIPT - DO NOT MODIFY BELOW
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Azure OpenAI Connection Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate inputs
if ($endpoint -eq "https://YOUR-RESOURCE-NAME.openai.azure.com/" -or $apiKey -eq "YOUR-API-KEY-HERE") {
    Write-Host "❌ ERROR: Please update the configuration variables at the top of this script!" -ForegroundColor Red
    Write-Host ""
    Write-Host "You need to set:" -ForegroundColor Yellow
    Write-Host "  1. endpoint  - Your Azure OpenAI endpoint URL"
    Write-Host "  2. apiKey    - Your API key from Azure Portal"
    Write-Host "  3. deployment - Your model deployment name (e.g., gpt-4o)"
    Write-Host ""
    exit 1
}

Write-Host "Configuration:" -ForegroundColor White
Write-Host "  Endpoint   : $endpoint" -ForegroundColor Gray
Write-Host "  Deployment : $deployment" -ForegroundColor Gray
Write-Host "  API Key    : $($apiKey.Substring(0, 10))..." -ForegroundColor Gray
Write-Host ""

# Construct test URL
$testUrl = "${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview"

Write-Host "Step 1: Testing basic connectivity..." -ForegroundColor Cyan

# Test payload
$body = @{
    messages = @(
        @{
            role = "system"
            content = "You are a helpful assistant."
        }
        @{
            role = "user"
            content = "Say 'Azure OpenAI is working correctly!' and nothing else."
        }
    )
    max_tokens = 50
    temperature = 0.7
} | ConvertTo-Json

# Make request
try {
    $response = Invoke-RestMethod -Uri $testUrl `
        -Method Post `
        -Headers @{
            "api-key" = $apiKey
            "Content-Type" = "application/json"
        } `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response from Azure OpenAI:" -ForegroundColor White
    Write-Host "  $($response.choices[0].message.content)" -ForegroundColor Green
    Write-Host ""
    
    # Show usage stats
    Write-Host "Token Usage:" -ForegroundColor White
    Write-Host "  Prompt tokens     : $($response.usage.prompt_tokens)" -ForegroundColor Gray
    Write-Host "  Completion tokens : $($response.usage.completion_tokens)" -ForegroundColor Gray
    Write-Host "  Total tokens      : $($response.usage.total_tokens)" -ForegroundColor Gray
    Write-Host ""
    
    # Test document analysis capability
    Write-Host "Step 2: Testing document analysis capability..." -ForegroundColor Cyan
    
    $analysisBody = @{
        messages = @(
            @{
                role = "system"
                content = "You are an expert document analyst."
            }
            @{
                role = "user"
                content = "Analyze this sample document: 'Important Contract - Payment due: $50,000 on Jan 15, 2025. Risk: Late payment penalty of 5%. Action required: Review and sign by Dec 31.' Provide a brief JSON summary with executiveSummary, keyPoints (array), risks (array), and nextActions (array)."
            }
        )
        max_tokens = 500
        temperature = 0.7
        response_format = @{ type = "json_object" }
    } | ConvertTo-Json
    
    $analysisResponse = Invoke-RestMethod -Uri $testUrl `
        -Method Post `
        -Headers @{
            "api-key" = $apiKey
            "Content-Type" = "application/json"
        } `
        -Body $analysisBody `
        -ErrorAction Stop
    
    Write-Host "✅ Document analysis test successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sample Analysis Output:" -ForegroundColor White
    $analysisContent = $analysisResponse.choices[0].message.content
    Write-Host $analysisContent -ForegroundColor Gray
    Write-Host ""
    
    # Final summary
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   ✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Azure OpenAI configuration is correct!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Use these credentials in your PCF control" -ForegroundColor White
    Write-Host "  2. Test the control with: npm start watch" -ForegroundColor White
    Write-Host "  3. Or deploy to Dynamics 365" -ForegroundColor White
    Write-Host ""
    Write-Host "Configuration to use in PCF:" -ForegroundColor Yellow
    Write-Host "  Azure OpenAI Endpoint : $endpoint" -ForegroundColor White
    Write-Host "  Azure API Key         : [Use your key securely]" -ForegroundColor White
    Write-Host "  Deployment Name       : $deployment" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR: Connection failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Message -match "404") {
        Write-Host "💡 Troubleshooting 404 Error:" -ForegroundColor Yellow
        Write-Host "  - Deployment name might be incorrect" -ForegroundColor White
        Write-Host "  - Check deployment name in Azure Portal" -ForegroundColor White
        Write-Host "  - Ensure model is fully deployed (not in 'Creating' state)" -ForegroundColor White
    }
    elseif ($_.Exception.Message -match "401") {
        Write-Host "💡 Troubleshooting 401 Error:" -ForegroundColor Yellow
        Write-Host "  - API key might be incorrect" -ForegroundColor White
        Write-Host "  - Copy key again from Azure Portal (Keys and Endpoint)" -ForegroundColor White
        Write-Host "  - Ensure no extra spaces in the key" -ForegroundColor White
    }
    elseif ($_.Exception.Message -match "403") {
        Write-Host "💡 Troubleshooting 403 Error:" -ForegroundColor Yellow
        Write-Host "  - Check Azure subscription is active" -ForegroundColor White
        Write-Host "  - Verify you have permissions to access the resource" -ForegroundColor White
    }
    else {
        Write-Host "💡 General Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  - Verify endpoint URL format: https://name.openai.azure.com/" -ForegroundColor White
        Write-Host "  - Check Azure OpenAI resource is running (not stopped)" -ForegroundColor White
        Write-Host "  - Ensure deployment is complete (not in progress)" -ForegroundColor White
        Write-Host "  - Check firewall/network settings" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "Need help? Check AZURE_SETUP_TEST.md for detailed guidance" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}
