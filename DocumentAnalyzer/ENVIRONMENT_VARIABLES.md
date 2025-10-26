# Environment Variables Configuration Template

This file provides templates for configuring Azure credentials securely using Dynamics 365 Environment Variables.

## ⚠️ IMPORTANT SECURITY NOTICE

**NEVER commit actual API keys to source control!**

This template shows the structure only. Actual values should be:
- Stored in Azure Key Vault
- Referenced via Environment Variables in D365
- Rotated regularly
- Restricted to authorized personnel

---

## Environment Variables to Create

### 1. Azure OpenAI Endpoint

**Display Name**: `DocPulse OpenAI Endpoint`  
**Schema Name**: `docpulse_openai_endpoint`  
**Data Type**: Text  
**Default Value**: `https://your-resource.openai.azure.com/`  
**Description**: Azure OpenAI service endpoint URL

**How to get this value**:
```powershell
az cognitiveservices account show \
  --name your-openai-resource \
  --resource-group your-rg \
  --query properties.endpoint \
  --output tsv
```

---

### 2. Azure OpenAI API Key

**Display Name**: `DocPulse OpenAI API Key`  
**Schema Name**: `docpulse_openai_key`  
**Data Type**: Secret  
**Default Value**: `[Stored securely - not shown]`  
**Description**: Azure OpenAI API key for authentication

**How to get this value**:
```powershell
az cognitiveservices account keys list \
  --name your-openai-resource \
  --resource-group your-rg \
  --query key1 \
  --output tsv
```

**⚠️ Mark as "Secret" when creating in D365!**

---

### 3. Azure OpenAI Deployment Name

**Display Name**: `DocPulse Deployment Name`  
**Schema Name**: `docpulse_deployment_name`  
**Data Type**: Text  
**Default Value**: `gpt-4o`  
**Description**: Name of the deployed model in Azure OpenAI

**How to get this value**:
```powershell
az cognitiveservices account deployment list \
  --name your-openai-resource \
  --resource-group your-rg \
  --query "[].name" \
  --output tsv
```

---

### 4. Document Intelligence Endpoint (Optional)

**Display Name**: `DocPulse Document Intelligence Endpoint`  
**Schema Name**: `docpulse_docintel_endpoint`  
**Data Type**: Text  
**Default Value**: `https://your-resource.cognitiveservices.azure.com/`  
**Description**: Azure Document Intelligence (Form Recognizer) endpoint

**How to get this value**:
```powershell
az cognitiveservices account show \
  --name your-docintel-resource \
  --resource-group your-rg \
  --query properties.endpoint \
  --output tsv
```

---

### 5. Document Intelligence API Key (Optional)

**Display Name**: `DocPulse Document Intelligence Key`  
**Schema Name**: `docpulse_docintel_key`  
**Data Type**: Secret  
**Default Value**: `[Stored securely - not shown]`  
**Description**: Azure Document Intelligence API key

**How to get this value**:
```powershell
az cognitiveservices account keys list \
  --name your-docintel-resource \
  --resource-group your-rg \
  --query key1 \
  --output tsv
```

**⚠️ Mark as "Secret" when creating in D365!**

---

## Creating Environment Variables in D365

### Method 1: Power Apps Portal

1. Navigate to https://make.powerapps.com
2. Select your environment
3. Go to **Solutions** → Your solution
4. Click **New** → **More** → **Environment variable**
5. Fill in details:
   - **Display name**: (from templates above)
   - **Name**: (schema name from above)
   - **Data type**: Text or Secret
   - **Default value**: (for non-secrets)
6. For **Secret** type:
   - Check "Store securely"
   - Enter value in secure field
7. Click **Save**
8. Repeat for all variables

### Method 2: Solution XML (Advanced)

Add to your solution's `environmentvariabledefinitions` folder:

```xml
<environmentvariabledefinition>
  <displayname>DocPulse OpenAI Endpoint</displayname>
  <schemaname>docpulse_openai_endpoint</schemaname>
  <type>100000000</type> <!-- Text -->
  <defaultvalue>https://your-resource.openai.azure.com/</defaultvalue>
</environmentvariabledefinition>
```

---

## Referencing in PCF Control Configuration

In the form customization, reference environment variables using:

```
{{docpulse_openai_endpoint}}
{{docpulse_openai_key}}
{{docpulse_deployment_name}}
{{docpulse_docintel_endpoint}}
{{docpulse_docintel_key}}
```

**Example in Form Designer**:

1. Select DocumentAnalyzer control
2. In properties panel:
   - **Azure OpenAI Endpoint**: `{{docpulse_openai_endpoint}}`
   - **Azure API Key**: `{{docpulse_openai_key}}`
   - **Deployment Name**: `{{docpulse_deployment_name}}`

---

## Azure Key Vault Integration (Advanced)

For enterprise deployments, store secrets in Azure Key Vault:

### 1. Create Key Vault

```powershell
az keyvault create \
  --name docpulse-keyvault \
  --resource-group your-rg \
  --location eastus
```

### 2. Store Secrets

```powershell
# Get OpenAI key
$openaiKey = az cognitiveservices account keys list \
  --name your-openai-resource \
  --resource-group your-rg \
  --query key1 \
  --output tsv

# Store in Key Vault
az keyvault secret set \
  --vault-name docpulse-keyvault \
  --name openai-api-key \
  --value $openaiKey
```

### 3. Grant D365 Access

```powershell
# Get D365 service principal object ID
$spObjectId = "YOUR-D365-SP-OBJECT-ID"

# Grant access
az keyvault set-policy \
  --name docpulse-keyvault \
  --object-id $spObjectId \
  --secret-permissions get list
```

### 4. Reference in D365

Update environment variable values to reference Key Vault:

```
@Microsoft.KeyVault(SecretUri=https://docpulse-keyvault.vault.azure.net/secrets/openai-api-key)
```

---

## Multi-Environment Configuration

For Dev/Test/Prod environments:

### Development
```
Endpoint: https://dev-openai.openai.azure.com/
Deployment: gpt-4o-dev
```

### Testing
```
Endpoint: https://test-openai.openai.azure.com/
Deployment: gpt-4o-test
```

### Production
```
Endpoint: https://prod-openai.openai.azure.com/
Deployment: gpt-4o
```

Create separate environment variables per environment, or use environment-specific values.

---

## Configuration Validation Script

Use this PowerShell script to validate your configuration:

```powershell
# Validate Azure OpenAI Configuration
$endpoint = "https://your-resource.openai.azure.com/"
$apiKey = "your-api-key"
$deployment = "gpt-4o"

$testUrl = "$endpoint/openai/deployments/$deployment/chat/completions?api-version=2024-02-15-preview"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "test"
        }
    )
    max_tokens = 10
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $testUrl `
        -Method Post `
        -Headers @{
            "api-key" = $apiKey
            "Content-Type" = "application/json"
        } `
        -Body $body
    
    Write-Host "✅ Azure OpenAI configuration is valid!" -ForegroundColor Green
    Write-Host "Response: $($response.choices[0].message.content)"
} catch {
    Write-Host "❌ Configuration error: $_" -ForegroundColor Red
}
```

---

## Security Best Practices Checklist

- [ ] API keys stored as "Secret" type in D365
- [ ] Secrets not committed to source control
- [ ] Key Vault used for production
- [ ] Managed identity configured (if applicable)
- [ ] Regular key rotation schedule established
- [ ] Access restricted to authorized personnel
- [ ] Audit logging enabled
- [ ] Network security rules configured
- [ ] Backup of environment variable values maintained
- [ ] Disaster recovery plan documented

---

## Troubleshooting Environment Variables

### Issue: "Environment variable not found"

**Solution**:
1. Verify environment variable exists in solution
2. Check spelling matches reference (case-sensitive)
3. Publish all customizations
4. Clear browser cache

### Issue: "Invalid endpoint"

**Solution**:
1. Ensure URL starts with `https://`
2. No trailing slashes in endpoint URL
3. Verify Azure resource is running
4. Check Azure subscription is active

### Issue: "Authentication failed"

**Solution**:
1. Verify API key is correct (no extra spaces)
2. Check key hasn't expired or been rotated
3. Ensure secret type variable is marked as "Store securely"
4. Regenerate key if needed

---

## Rotation Schedule

Recommend rotating keys every:

- **Development**: 90 days
- **Testing**: 60 days  
- **Production**: 30-60 days

**Rotation Process**:
1. Generate new key in Azure Portal (Key 2)
2. Update environment variable with new key
3. Test functionality
4. Regenerate old key (Key 1)
5. Update backup documentation

---

## Backup & Documentation

Maintain secure documentation of:

- Azure resource names and locations
- Environment variable schema names
- Key rotation dates and responsible parties
- Recovery procedures
- Contact information for Azure admins

**Store in**: Secure location (NOT in code repository)

---

## Example: Complete Setup Script

```powershell
# Complete Azure Setup and Environment Variable Creation
# Run this ONCE during initial setup

# Variables
$resourceGroup = "DocPulseAI-RG"
$location = "eastus"
$openaiName = "docpulse-openai"
$docintelName = "docpulse-docintel"

# Create Resource Group
az group create --name $resourceGroup --location $location

# Create Azure OpenAI
az cognitiveservices account create `
  --name $openaiName `
  --resource-group $resourceGroup `
  --kind OpenAI `
  --sku S0 `
  --location $location

# Deploy GPT-4o
az cognitiveservices account deployment create `
  --name $openaiName `
  --resource-group $resourceGroup `
  --deployment-name gpt-4o `
  --model-name gpt-4o `
  --model-version "2024-05-13" `
  --model-format OpenAI `
  --sku-capacity 10 `
  --sku-name Standard

# Create Document Intelligence
az cognitiveservices account create `
  --name $docintelName `
  --resource-group $resourceGroup `
  --kind FormRecognizer `
  --sku S0 `
  --location $location

# Get Credentials
Write-Host "`n=== AZURE OPENAI CONFIGURATION ===" -ForegroundColor Cyan
$openaiEndpoint = az cognitiveservices account show `
  --name $openaiName `
  --resource-group $resourceGroup `
  --query properties.endpoint `
  --output tsv
Write-Host "Endpoint: $openaiEndpoint"

$openaiKey = az cognitiveservices account keys list `
  --name $openaiName `
  --resource-group $resourceGroup `
  --query key1 `
  --output tsv
Write-Host "API Key: $openaiKey" -ForegroundColor Yellow

Write-Host "`n=== DOCUMENT INTELLIGENCE CONFIGURATION ===" -ForegroundColor Cyan
$docintelEndpoint = az cognitiveservices account show `
  --name $docintelName `
  --resource-group $resourceGroup `
  --query properties.endpoint `
  --output tsv
Write-Host "Endpoint: $docintelEndpoint"

$docintelKey = az cognitiveservices account keys list `
  --name $docintelName `
  --resource-group $resourceGroup `
  --query key1 `
  --output tsv
Write-Host "API Key: $docintelKey" -ForegroundColor Yellow

Write-Host "`n⚠️  STORE THESE VALUES SECURELY!" -ForegroundColor Red
Write-Host "Next steps:"
Write-Host "1. Create Environment Variables in D365 with these values"
Write-Host "2. Configure PCF control to reference environment variables"
Write-Host "3. Test the configuration"
```

---

**Remember**: Security is everyone's responsibility. Protect these credentials! 🔐
