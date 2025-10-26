# Azure Setup & Testing Guide

## 🚀 Quick Azure Setup

### Option 1: Create Azure OpenAI via Azure Portal (Easiest)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Search for "Azure OpenAI"** in the top search bar
3. **Click "Create"**
4. **Fill in details:**
   - Subscription: Your subscription
   - Resource Group: Create new (e.g., "DocPulseAI-RG")
   - Region: Choose one that supports GPT-4 (e.g., East US, Sweden Central)
   - Name: e.g., "docpulse-openai"
   - Pricing Tier: Standard S0
5. **Review + Create**
6. **Wait for deployment** (2-3 minutes)

7. **Deploy a Model:**
   - Open your Azure OpenAI resource
   - Go to **"Model deployments"** → **"Manage Deployments"**
   - Click **"Create new deployment"**
   - Select Model: **GPT-4o** or **GPT-4 Turbo with Vision**
   - Deployment name: `gpt-4o` (remember this!)
   - Click **Create**

8. **Get Your Credentials:**
   - Go to **"Keys and Endpoint"** in left menu
   - Copy **Endpoint** (e.g., `https://docpulse-openai.openai.azure.com/`)
   - Copy **Key 1**

### Option 2: Create via Azure CLI

```powershell
# Login to Azure
az login

# Set variables
$resourceGroup = "DocPulseAI-RG"
$location = "eastus"
$openaiName = "docpulse-openai-$(Get-Random -Minimum 1000 -Maximum 9999)"

# Create resource group
az group create --name $resourceGroup --location $location

# Create Azure OpenAI resource
az cognitiveservices account create `
  --name $openaiName `
  --resource-group $resourceGroup `
  --kind OpenAI `
  --sku S0 `
  --location $location `
  --yes

# Deploy GPT-4o model
az cognitiveservices account deployment create `
  --name $openaiName `
  --resource-group $resourceGroup `
  --deployment-name gpt-4o `
  --model-name gpt-4o `
  --model-version "2024-05-13" `
  --model-format OpenAI `
  --sku-capacity 10 `
  --sku-name Standard

# Get endpoint
Write-Host "`n=== YOUR ENDPOINT ===" -ForegroundColor Green
az cognitiveservices account show `
  --name $openaiName `
  --resource-group $resourceGroup `
  --query properties.endpoint `
  --output tsv

# Get API key
Write-Host "`n=== YOUR API KEY ===" -ForegroundColor Yellow
az cognitiveservices account keys list `
  --name $openaiName `
  --resource-group $resourceGroup `
  --query key1 `
  --output tsv

Write-Host "`n=== YOUR DEPLOYMENT NAME ===" -ForegroundColor Cyan
Write-Host "gpt-4o"
```

---

## 🧪 Testing Your Azure Endpoint

### Test 1: Simple API Test (PowerShell)

```powershell
# Replace these with your actual values
$endpoint = "https://your-resource.openai.azure.com/"
$apiKey = "your-api-key-here"
$deployment = "gpt-4o"

# Test URL
$testUrl = "${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview"

# Test payload
$body = @{
    messages = @(
        @{
            role = "user"
            content = "Say 'Hello from Azure OpenAI!'"
        }
    )
    max_tokens = 50
} | ConvertTo-Json

# Make request
try {
    Write-Host "Testing Azure OpenAI connection..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $testUrl `
        -Method Post `
        -Headers @{
            "api-key" = $apiKey
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ SUCCESS! Azure OpenAI is working!" -ForegroundColor Green
    Write-Host "Response: $($response.choices[0].message.content)" -ForegroundColor White
    Write-Host "`nYour configuration is correct! You can use these credentials in the PCF control." -ForegroundColor Green
    
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nCommon issues:" -ForegroundColor Yellow
    Write-Host "1. Check endpoint URL (should start with https:// and end with .openai.azure.com/)"
    Write-Host "2. Verify API key is correct (no extra spaces)"
    Write-Host "3. Confirm deployment name matches what you created"
    Write-Host "4. Ensure your Azure subscription is active"
}
```

### Test 2: Test with Image (GPT-4 Vision)

```powershell
# Test vision capabilities (for image analysis)
$endpoint = "https://your-resource.openai.azure.com/"
$apiKey = "your-api-key-here"
$deployment = "gpt-4o"

$testUrl = "${endpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview"

# Using a sample image URL
$body = @{
    messages = @(
        @{
            role = "user"
            content = @(
                @{
                    type = "text"
                    text = "What do you see in this image?"
                }
                @{
                    type = "image_url"
                    image_url = @{
                        url = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/320px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                    }
                }
            )
        }
    )
    max_tokens = 100
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Testing GPT-4 Vision capabilities..." -ForegroundColor Cyan
    
    $response = Invoke-RestMethod -Uri $testUrl `
        -Method Post `
        -Headers @{
            "api-key" = $apiKey
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ Vision capabilities working!" -ForegroundColor Green
    Write-Host "Response: $($response.choices[0].message.content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Vision test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 🧪 Testing the PCF Control

### Method 1: Test Harness (Development)

```powershell
cd c:\HB\PCF\Repo\DocPulseAI\DocumentAnalyzer

# Start the test harness
npm start watch
```

This will open a browser with a test environment. You'll see input fields for all properties.

**Enter your credentials:**
- Azure OpenAI Endpoint: `https://your-resource.openai.azure.com/`
- Azure API Key: `your-key`
- Deployment Name: `gpt-4o`

Then test drag & drop functionality!

### Method 2: Deploy to Dynamics 365 Dev Environment

1. **Build the solution:**
```powershell
cd c:\HB\PCF\Repo\DocPulseAI

# Initialize solution (first time only)
pac solution init --publisher-name TestOrg --publisher-prefix test

# Add PCF reference
pac solution add-reference --path .\DocumentAnalyzer

# Build
msbuild /t:build /restore
```

2. **Import to D365:**
   - Go to https://make.powerapps.com
   - Select your DEV environment
   - Solutions → Import
   - Upload `bin\Debug\*.zip`

3. **Add to a test form:**
   - Open any entity form
   - Add the control to a text field
   - Enter your Azure credentials in properties
   - Save & Publish
   - Test with a real document!

---

## 📄 Optional: Azure Document Intelligence

This is **optional** but highly recommended for PDF text extraction.

### Quick Setup:

```powershell
$resourceGroup = "DocPulseAI-RG"
$location = "eastus"
$docIntelName = "docpulse-docintel-$(Get-Random -Minimum 1000 -Maximum 9999)"

# Create Document Intelligence resource
az cognitiveservices account create `
  --name $docIntelName `
  --resource-group $resourceGroup `
  --kind FormRecognizer `
  --sku S0 `
  --location $location `
  --yes

# Get credentials
Write-Host "`n=== DOCUMENT INTELLIGENCE ENDPOINT ===" -ForegroundColor Green
az cognitiveservices account show `
  --name $docIntelName `
  --resource-group $resourceGroup `
  --query properties.endpoint `
  --output tsv

Write-Host "`n=== DOCUMENT INTELLIGENCE KEY ===" -ForegroundColor Yellow
az cognitiveservices account keys list `
  --name $docIntelName `
  --resource-group $resourceGroup `
  --query key1 `
  --output tsv
```

---

## 💰 Cost During Testing

### Free Tier / Trial
If you're on Azure free tier or trial:
- First $200 credit
- Some services have free tiers

### Pay-As-You-Go Costs
- **Each test**: ~$0.01-0.02
- **10 test documents**: ~$0.10-0.20
- **100 test documents**: ~$1-2

Very affordable for testing! 💵

---

## ✅ Validation Checklist

Before deploying to production, verify:

- [ ] Azure OpenAI endpoint URL is correct
- [ ] API key works (test script passes)
- [ ] Deployment name matches Azure
- [ ] GPT-4o or GPT-4 Vision model deployed
- [ ] PCF control builds successfully
- [ ] Test harness shows control properly
- [ ] Can upload and process a test document
- [ ] Summary card displays correctly
- [ ] All action buttons work (Regenerate, Translate, Expand)
- [ ] Note is created in D365
- [ ] No console errors in browser

---

## 🐛 Common Issues & Solutions

### "Deployment not found"
**Solution**: Check deployment name matches exactly (case-sensitive)
```powershell
# List your deployments
az cognitiveservices account deployment list `
  --name your-resource-name `
  --resource-group DocPulseAI-RG
```

### "Access denied" or "401 Unauthorized"
**Solution**: Regenerate API key and use the new one
```powershell
az cognitiveservices account keys regenerate `
  --name your-resource-name `
  --resource-group DocPulseAI-RG `
  --key-name key1
```

### "Region not supported"
**Solution**: GPT-4 with Vision is available in:
- East US
- Sweden Central
- West Europe
- Australia East
- France Central

Check: https://learn.microsoft.com/azure/ai-services/openai/concepts/models#model-summary-table-and-region-availability

---

## 🎯 Quick Test Checklist

1. ✅ Create Azure OpenAI resource
2. ✅ Deploy GPT-4o model
3. ✅ Get endpoint & API key
4. ✅ Run PowerShell test script
5. ✅ Verify "SUCCESS" message
6. ✅ Start PCF test harness (`npm start watch`)
7. ✅ Enter credentials in test harness
8. ✅ Upload a test PDF or image
9. ✅ Verify processing completes
10. ✅ Check summary displays

---

## 📞 Need Help?

If tests fail:
1. Check Azure Portal - is service running?
2. Verify quota limits - any restrictions?
3. Check billing - is subscription active?
4. Review error messages in browser console (F12)
5. Test with curl or Postman first

---

**You're ready to test! Start with the PowerShell test script above.** 🚀
