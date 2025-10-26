# 🚀 DocPulseAI Deployment Guide

> **Complete guide for deploying the DocPulseAI PCF control to Dynamics 365 environments**

This guide covers everything from initial setup to production deployment, including security best practices, ALM strategies, and troubleshooting.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Part 1: Azure Setup](#-part-1-azure-setup)
- [Part 2: Development Environment](#-part-2-development-environment)
- [Part 3: Building the Control](#-part-3-building-the-control)
- [Part 4: Deployment to Dynamics 365](#-part-4-deployment-to-dynamics-365)
- [Part 5: Security Configuration](#-part-5-security-configuration)
- [Part 6: Testing & Validation](#-part-6-testing--validation)
- [Part 7: Production Deployment](#-part-7-production-deployment)
- [Part 8: CI/CD Pipeline Setup](#-part-8-cicd-pipeline-setup)
- [Troubleshooting](#-troubleshooting)
- [Appendix](#-appendix)

---

## ✅ Prerequisites

### Required Accounts & Access

- **Microsoft 365 Account** with Dynamics 365 access
- **Azure Subscription** (for Azure OpenAI)
- **System Administrator** or **System Customizer** role in Dynamics 365
- **Power Platform Admin** access (for solution deployment)

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 18.x or higher | Development runtime |
| **npm** | 9.x or higher | Package management |
| **PowerApps CLI (pac)** | Latest | PCF tooling |
| **Visual Studio Code** | Latest | Code editor (recommended) |
| **Git** | Latest | Version control |

### Install PowerApps CLI

```powershell
# Method 1: Via dotnet tool (Recommended)
dotnet tool install --global Microsoft.PowerApps.CLI.Tool

# Method 2: Via standalone installer
# Download from: https://aka.ms/PowerAppsCLI

# Verify installation
pac --version
```

### Install Node.js

```powershell
# Download from: https://nodejs.org/
# Choose LTS (Long Term Support) version

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show v9.x.x or higher
```

---

## 🔧 Part 1: Azure Setup

### Step 1.1: Create Azure OpenAI Resource

1. **Login to Azure Portal**
   - Navigate to [portal.azure.com](https://portal.azure.com)
   - Sign in with Azure credentials

2. **Create Resource**
   ```
   Home → Create a resource → Search "Azure OpenAI"
   → Select "Azure OpenAI" → Click "Create"
   ```

3. **Configure Resource**
   - **Subscription:** Select your subscription
   - **Resource Group:** Create new (e.g., `rg-docpulseai-prod`)
   - **Region:** Choose available region (e.g., `East US`, `West Europe`)
   - **Name:** Unique name (e.g., `openai-docpulseai-prod`)
   - **Pricing Tier:** Standard S0

4. **Review and Create**
   - Click "Review + create"
   - Wait for deployment (2-3 minutes)

### Step 1.2: Deploy GPT-4 Vision Model

1. **Navigate to Azure OpenAI Studio**
   ```
   Resource → Overview → Click "Go to Azure OpenAI Studio"
   ```

2. **Create Deployment**
   ```
   Deployments → + Create new deployment
   ```

3. **Configure Deployment**
   - **Model:** `gpt-4` (select vision-capable version)
   - **Model Version:** `vision-preview` or `turbo-2024-04-09`
   - **Deployment Name:** `gpt-4o` (remember this name!)
   - **Capacity:** Start with 10K tokens/min, scale as needed

4. **Note Configuration Details**
   ```
   Endpoint: https://[resource-name].openai.azure.com/
   Deployment: gpt-4o
   API Version: 2024-02-15-preview (or latest)
   ```

### Step 1.3: Get API Keys

1. **Get API Key**
   ```
   Azure Portal → Your OpenAI Resource
   → Keys and Endpoint → Show Keys
   → Copy "KEY 1"
   ```

2. **Store Securely**
   - **Do NOT commit to source control**
   - Store in password manager
   - Use environment variables for deployment

### Step 1.4: (Optional) Azure Document Intelligence

For enhanced OCR capabilities:

1. **Create Document Intelligence Resource**
   ```
   Create a resource → AI + Machine Learning
   → Document Intelligence → Create
   ```

2. **Configure**
   - **Resource Group:** Same as OpenAI
   - **Region:** Same as OpenAI (recommended)
   - **Name:** `di-docpulseai-prod`
   - **Pricing:** F0 (Free) for testing, S0 for production

3. **Note Endpoint and Key**

---

## 💻 Part 2: Development Environment

### Step 2.1: Clone Repository

```powershell
# Navigate to your projects folder
cd C:\Projects

# Clone the repository
git clone https://github.com/aindike/DocPulseAI.git

# Navigate to project
cd DocPulseAI\DocumentAnalyzer
```

### Step 2.2: Install Dependencies

```powershell
# Install Node.js packages
npm install

# Verify installation
npm list --depth=0
```

Expected output:
```
pcf-project@1.0.0
├── @eslint/js@9.25.1
├── @microsoft/eslint-plugin-power-apps@0.2.51
├── @types/node@18.19.86
├── @types/powerapps-component-framework@1.3.16
├── eslint-plugin-promise@7.1.0
├── globals@15.15.0
├── pcf-scripts@1.x.x
├── pcf-start@1.x.x
├── typescript@5.8.3
└── typescript-eslint@8.31.0
```

### Step 2.3: Configure Development Environment

1. **Authenticate with Power Platform**
   ```powershell
   # Authenticate
   pac auth create --url https://[your-org].crm.dynamics.com

   # List authenticated profiles
   pac auth list

   # Select active profile
   pac auth select --index 1
   ```

2. **Verify PCF Project**
   ```powershell
   # Should show no errors
   pac pcf version
   ```

---

## 🏗️ Part 3: Building the Control

### Step 3.1: Build for Development

```powershell
# Clean previous builds
npm run clean

# Build the control
npm run build
```

Expected output:
```
> pcf-project@1.0.0 build
> pcf-scripts build

Building PCF control...
✓ TypeScript compilation successful
✓ Bundle generation successful
✓ CSS processing complete
Build completed: out/controls/DocumentAnalyzer/
```

### Step 3.2: Test Locally (Optional)

```powershell
# Start test harness
npm start

# Browser will open at http://localhost:8181
```

Test harness allows you to:
- Test file upload functionality
- Test UI rendering
- Debug without deploying to Dynamics 365
- **Note:** AI features require actual Dynamics 365 context

### Step 3.3: Build for Production

```powershell
# Production build with optimizations
npm run build -- --mode production
```

---

## 📦 Part 4: Deployment to Dynamics 365

### Step 4.1: Create Solution

#### Option A: Using pac CLI (Recommended)

```powershell
# Navigate to solution folder
cd DocumentAnalyzerSolution

# Initialize solution if not exists
pac solution init --publisher-name "YourCompany" --publisher-prefix "new"

# Add PCF control reference
pac solution add-reference --path ..\

# Build solution
msbuild /t:build /restore
```

#### Option B: Manual Solution Creation

1. **Login to Power Apps**
   - Navigate to [make.powerapps.com](https://make.powerapps.com)
   - Select your environment

2. **Create Solution**
   ```
   Solutions → + New solution
   ```
   - **Display Name:** DocPulseAI
   - **Name:** DocPulseAI
   - **Publisher:** Create new or select existing
     - **Display Name:** Your Company
     - **Name:** yourcompany
     - **Prefix:** new (or your prefix)
   - **Version:** 1.0.0.0

3. **Add Control to Solution**
   ```
   Open Solution → Add existing → More → Code components
   → + New → Upload new component
   ```

### Step 4.2: Package Solution

```powershell
# Build solution package
cd DocumentAnalyzerSolution
msbuild /t:build /restore /p:Configuration=Release

# Solution zip will be created at:
# bin\Release\DocumentAnalyzerSolution.zip
```

### Step 4.3: Import to Target Environment

1. **Navigate to Power Apps**
   - [make.powerapps.com](https://make.powerapps.com)
   - Select **target environment** (DEV/TEST/PROD)

2. **Import Solution**
   ```
   Solutions → Import → Browse
   → Select DocumentAnalyzerSolution.zip
   → Next
   ```

3. **Configure Connections** (if prompted)
   - No connections needed (direct Azure API)

4. **Import**
   - Click "Import"
   - Wait 2-5 minutes for completion
   - Verify: "Solution imported successfully"

### Step 4.4: Add to Form

1. **Open Your Entity Form**
   ```
   Solutions → Your Solution → Tables
   → Select Table (e.g., Account, Contact, Custom Entity)
   → Forms → Select form to edit
   ```

2. **Add Field for Summary Storage**
   - If not exists, create new field:
     - **Display Name:** Document Summary
     - **Name:** new_documentsummary
     - **Data Type:** Single Line of Text
     - **Max Length:** 4000 (or use Multiple Lines for longer)

3. **Add Control**
   ```
   Form Designer → Add field → Select "Document Summary"
   → Properties panel → Components → + Add component
   → Select "DocumentAnalyzer" → Add
   ```

4. **Configure Properties**

   | Property | Value | Example |
   |----------|-------|---------|
   | documentSummary | Bound to field | new_documentsummary |
   | azureEndpoint | Azure endpoint | `https://[resource].openai.azure.com/` |
   | azureApiKey | **Use Environment Variable** | `${docpulseai_azure_apikey}` |
   | deploymentName | Model name | `gpt-4o` |
   | maxFileSizeMB | Size limit | `10` |
   | acceptedFileTypes | File types | `.pdf,.png,.jpg,.jpeg` |

   ⚠️ **IMPORTANT:** Use Environment Variables for API keys (see Part 5)

5. **Save and Publish**
   ```
   Save → Publish
   ```

---

## 🔐 Part 5: Security Configuration

### Step 5.1: Create Environment Variables

**Why Environment Variables?**
- ✅ Secure credential management
- ✅ Easy environment-specific configuration
- ✅ No hardcoded secrets
- ✅ Centralized management

#### Create Variables

1. **Navigate to Environment Variables**
   ```
   make.powerapps.com → Solutions → Your Solution
   → + New → More → Environment variable
   ```

2. **Create API Key Variable**
   - **Display Name:** DocPulseAI Azure API Key
   - **Name:** `docpulseai_azure_apikey`
   - **Data Type:** Secret
   - **Current Value:** Paste your Azure OpenAI API Key
   - **Description:** Azure OpenAI API Key for document analysis

3. **Create Endpoint Variable**
   - **Display Name:** DocPulseAI Azure Endpoint
   - **Name:** `docpulseai_azure_endpoint`
   - **Data Type:** Text
   - **Current Value:** `https://[your-resource].openai.azure.com/`

4. **Create Deployment Name Variable**
   - **Display Name:** DocPulseAI Deployment Name
   - **Name:** `docpulseai_deployment_name`
   - **Data Type:** Text
   - **Current Value:** `gpt-4o`

### Step 5.2: Reference in Control

Update control properties to reference variables:

```
azureEndpoint: ${docpulseai_azure_endpoint}
azureApiKey: ${docpulseai_azure_apikey}
deploymentName: ${docpulseai_deployment_name}
```

### Step 5.3: Azure Key Vault Integration (Enterprise)

For enhanced security, integrate with Azure Key Vault:

1. **Create Key Vault**
   ```powershell
   az keyvault create \
     --name kv-docpulseai-prod \
     --resource-group rg-docpulseai-prod \
     --location eastus
   ```

2. **Store Secret**
   ```powershell
   az keyvault secret set \
     --vault-name kv-docpulseai-prod \
     --name azure-openai-key \
     --value "your-api-key"
   ```

3. **Configure Managed Identity**
   - Enable system-assigned managed identity for your environment
   - Grant Key Vault access to managed identity

4. **Reference in Power Platform**
   - Use Azure Key Vault connector
   - Retrieve secrets at runtime

### Step 5.4: Security Roles & Permissions

Users need permissions on:

1. **Note Entity**
   - Create, Read permissions
   - Organization scope

2. **Attachment Entity**
   - Create, Read permissions

3. **Your Entity** (where control is used)
   - Read, Write on document summary field

**Configure Roles:**
```
Settings → Security → Security Roles
→ Select role → Core Records tab
→ Note: Create, Read (Organization)
→ Save
```

---

## ✅ Part 6: Testing & Validation

### Step 6.1: Functional Testing

#### Test 1: File Upload
1. Open form with control
2. Drag & drop a PDF file
3. **Verify:** File uploads, "Processing..." appears
4. **Verify:** Note attachment created in timeline

#### Test 2: AI Analysis
1. Wait for processing to complete
2. **Verify:** Executive summary appears
3. **Verify:** Key points listed
4. **Verify:** Risks color-coded correctly
5. **Verify:** Action items displayed

#### Test 3: Regenerate
1. Click "Regenerate Analysis" button
2. **Verify:** New analysis generated
3. **Verify:** Summary field updated

#### Test 4: Translation
1. Click "Translate" button
2. Select language (e.g., Spanish)
3. **Verify:** Summary translated correctly

#### Test 5: Error Handling
1. Upload file exceeding size limit
2. **Verify:** Error message displayed
3. Upload unsupported file type
4. **Verify:** Error message displayed

### Step 6.2: Performance Testing

```powershell
# Test with various file sizes
# Measure processing times

Small PDF (1-2 pages): 5-10 seconds
Medium PDF (5-10 pages): 10-20 seconds
Large PDF (20+ pages): 20-40 seconds
```

### Step 6.3: Browser Compatibility

Test in:
- ✅ Microsoft Edge (Chromium)
- ✅ Google Chrome
- ✅ Safari (Mac/iOS)
- ✅ Firefox

### Step 6.4: Mobile Testing

Test responsive design:
- ✅ Mobile browser (iOS/Android)
- ✅ Power Apps mobile app
- ✅ Dynamics 365 mobile app

---

## 🏭 Part 7: Production Deployment

### Step 7.1: Environment Strategy

Recommended environments:

```
DEV → TEST → UAT → PROD
```

| Environment | Purpose | Data |
|-------------|---------|------|
| **DEV** | Development & debugging | Sample data |
| **TEST** | Integration testing | Anonymized data |
| **UAT** | User acceptance testing | Production-like data |
| **PROD** | Production | Real data |

### Step 7.2: Export Managed Solution

1. **In DEV Environment**
   ```
   Solutions → DocPulseAI → Export
   → Managed → Export
   ```

2. **Download Package**
   - Save as: `DocPulseAI_1_0_0_0_managed.zip`

### Step 7.3: Import to Production

1. **Backup Production Environment**
   ```
   Power Platform Admin Center → Environments
   → Select PROD → Backups → Create backup
   ```

2. **Import Managed Solution**
   ```
   make.powerapps.com → Select PROD environment
   → Solutions → Import → Select package
   ```

3. **Configure Environment Variables**
   - Set production Azure endpoints
   - Set production API keys
   - Verify all values

4. **Test in Production**
   - Run smoke tests
   - Verify AI functionality
   - Check performance

### Step 7.4: Rollback Plan

If issues occur:

1. **Restore Backup**
   ```
   Admin Center → Backups → Restore
   ```

2. **Or Delete Solution**
   ```
   Solutions → DocPulseAI → Delete
   ```

3. **Or Roll Back to Previous Version**
   ```
   Solution History → Restore previous version
   ```

---

## 🔄 Part 8: CI/CD Pipeline Setup

### Step 8.1: Azure DevOps Pipeline

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
    - main
    - develop

pool:
  vmImage: 'windows-latest'

variables:
  solution: 'DocumentAnalyzerSolution'
  buildPlatform: 'Any CPU'
  buildConfiguration: 'Release'

steps:
# Install PowerApps CLI
- task: PowerPlatformToolInstaller@2
  displayName: 'Install Power Platform Tools'
  inputs:
    DefaultVersion: true

# Install Node.js
- task: NodeTool@0
  displayName: 'Install Node.js'
  inputs:
    versionSpec: '18.x'

# Restore npm packages
- script: |
    cd DocumentAnalyzer
    npm install
  displayName: 'npm install'

# Build PCF control
- script: |
    cd DocumentAnalyzer
    npm run build
  displayName: 'Build PCF Control'

# Restore NuGet packages
- task: NuGetToolInstaller@1
  displayName: 'Install NuGet'

- task: NuGetCommand@2
  displayName: 'Restore NuGet Packages'
  inputs:
    restoreSolution: '$(solution)/$(solution).cdsproj'

# Build solution
- task: MSBuild@1
  displayName: 'Build Solution'
  inputs:
    solution: '$(solution)/$(solution).cdsproj'
    platform: '$(buildPlatform)'
    configuration: '$(buildConfiguration)'
    msbuildArguments: '/t:build /restore'

# Publish artifacts
- task: PublishBuildArtifacts@1
  displayName: 'Publish Solution Artifact'
  inputs:
    PathtoPublish: '$(solution)/bin/$(buildConfiguration)'
    ArtifactName: 'solutions'
```

### Step 8.2: GitHub Actions Pipeline

Create `.github/workflows/build-deploy.yml`:

```yaml
name: Build and Deploy PCF Control

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '6.0.x'
    
    - name: Install PowerApps CLI
      run: dotnet tool install --global Microsoft.PowerApps.CLI.Tool
    
    - name: Install npm dependencies
      working-directory: DocumentAnalyzer
      run: npm install
    
    - name: Build PCF Control
      working-directory: DocumentAnalyzer
      run: npm run build
    
    - name: Build Solution
      working-directory: DocumentAnalyzerSolution
      run: msbuild /t:build /restore /p:Configuration=Release
    
    - name: Upload Solution Artifact
      uses: actions/upload-artifact@v3
      with:
        name: solution
        path: DocumentAnalyzerSolution/bin/Release/*.zip

  deploy-dev:
    needs: build
    runs-on: windows-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Download Solution
      uses: actions/download-artifact@v3
      with:
        name: solution
    
    - name: Install PowerApps CLI
      run: dotnet tool install --global Microsoft.PowerApps.CLI.Tool
    
    - name: Deploy to DEV
      run: |
        pac auth create --url ${{ secrets.DEV_ENVIRONMENT_URL }} --username ${{ secrets.DEV_USERNAME }} --password ${{ secrets.DEV_PASSWORD }}
        pac solution import --path *.zip
      env:
        DEV_ENVIRONMENT_URL: ${{ secrets.DEV_ENVIRONMENT_URL }}
```

### Step 8.3: Automated Testing

Create test script `tests/integration.test.ps1`:

```powershell
# Integration tests for DocPulseAI
param(
    [Parameter(Mandatory=$true)]
    [string]$EnvironmentUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$SolutionName = "DocPulseAI"
)

# Test 1: Solution exists
Write-Host "Testing solution deployment..." -ForegroundColor Yellow
pac auth create --url $EnvironmentUrl
$solutions = pac solution list | ConvertFrom-Json
$docPulseAI = $solutions | Where-Object { $_.UniqueName -eq $SolutionName }

if ($docPulseAI) {
    Write-Host "✓ Solution deployed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Solution not found" -ForegroundColor Red
    exit 1
}

# Test 2: Environment variables configured
Write-Host "Testing environment variables..." -ForegroundColor Yellow
# Add tests...

Write-Host "All tests passed!" -ForegroundColor Green
```

---

## 🐛 Troubleshooting

### Common Deployment Issues

#### Issue: "Publisher prefix mismatch"

**Symptom:** Error during solution import

**Solution:**
```powershell
# Recreate solution with correct prefix
pac solution init --publisher-name "YourCompany" --publisher-prefix "xyz"
```

#### Issue: "Control not appearing in component list"

**Symptom:** Can't find DocumentAnalyzer in form designer

**Solutions:**
1. Verify solution imported successfully
2. Refresh browser cache (Ctrl+F5)
3. Re-publish all customizations
4. Check if control enabled for entity:
   ```
   Settings → Customizations → Customize the System
   → Entities → Your Entity → Controls
   → Add Control
   ```

#### Issue: "Azure configuration not set" error

**Symptom:** Error message when uploading file

**Solutions:**
1. Verify Environment Variables created
2. Check variable syntax: `${variable_name}`
3. Ensure variables populated with values
4. Re-publish form after configuration changes

#### Issue: "Failed to create note attachment"

**Symptom:** File uploads but no Note created

**Solutions:**
1. Check user permissions on Note entity
2. Verify Notes enabled for entity:
   ```
   Settings → Customizations → Entities
   → Your Entity → Communication & Collaboration
   → Enable "Notes" → Save and Publish
   ```

#### Issue: "AI analysis timeout"

**Symptom:** Processing never completes

**Solutions:**
1. Check Azure OpenAI quota limits
2. Verify deployment name spelling
3. Test API key manually:
   ```powershell
   curl https://[resource].openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview `
     -H "api-key: YOUR_KEY" `
     -H "Content-Type: application/json" `
     -d '{"messages":[{"role":"user","content":"test"}],"max_tokens":100}'
   ```

#### Issue: "File size exceeds limit"

**Symptom:** Large files rejected

**Solutions:**
1. Increase `maxFileSizeMB` property
2. Compress PDF files
3. Check Dynamics 365 attachment limits (default: 5MB-10MB)
4. Increase max file size in System Settings:
   ```
   Settings → Administration → System Settings
   → Email tab → Set maximum file size
   ```

### Logging & Diagnostics

Enable browser console logging:

1. Open browser DevTools (F12)
2. Navigate to Console tab
3. Filter by `[DocPulseAI]`
4. Look for error messages and API responses

Enable network tracing:

1. DevTools → Network tab
2. Upload file to trigger analysis
3. Look for requests to:
   - `api.crm.dynamics.com` (Note creation)
   - `openai.azure.com` (AI analysis)
4. Check response status codes and bodies

---

## 📚 Appendix

### A. PowerShell Helper Scripts

#### Deploy to Multiple Environments

```powershell
# deploy-all.ps1
param(
    [string]$SolutionPath = ".\DocumentAnalyzerSolution\bin\Release\DocumentAnalyzerSolution.zip"
)

$environments = @(
    @{ Name="DEV"; Url="https://dev.crm.dynamics.com" },
    @{ Name="TEST"; Url="https://test.crm.dynamics.com" },
    @{ Name="UAT"; Url="https://uat.crm.dynamics.com" }
)

foreach ($env in $environments) {
    Write-Host "Deploying to $($env.Name)..." -ForegroundColor Cyan
    
    pac auth create --url $env.Url
    pac solution import --path $SolutionPath --async
    
    Write-Host "✓ $($env.Name) deployment started" -ForegroundColor Green
}
```

#### Export Solution with Version

```powershell
# export-solution.ps1
param(
    [string]$SolutionName = "DocPulseAI",
    [string]$Version = "1.0.0.0"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$filename = "$SolutionName`_$($Version.Replace('.','_'))_$timestamp`_managed.zip"

pac solution export `
    --name $SolutionName `
    --managed true `
    --path ".\exports\$filename"

Write-Host "Solution exported: $filename" -ForegroundColor Green
```

### B. Environment Variable Templates

#### Production Config

```json
{
  "environmentVariables": [
    {
      "schemaName": "docpulseai_azure_endpoint",
      "value": "https://prod-openai-eastus.openai.azure.com/"
    },
    {
      "schemaName": "docpulseai_deployment_name",
      "value": "gpt-4o"
    },
    {
      "schemaName": "docpulseai_max_file_size",
      "value": "10"
    }
  ]
}
```

#### Development Config

```json
{
  "environmentVariables": [
    {
      "schemaName": "docpulseai_azure_endpoint",
      "value": "https://dev-openai-eastus.openai.azure.com/"
    },
    {
      "schemaName": "docpulseai_deployment_name",
      "value": "gpt-4o-dev"
    },
    {
      "schemaName": "docpulseai_max_file_size",
      "value": "5"
    }
  ]
}
```

### C. Useful Commands Reference

```powershell
# Authentication
pac auth create --url https://org.crm.dynamics.com
pac auth list
pac auth select --index 1
pac auth clear

# Solution Management
pac solution list
pac solution export --name MySolution --path .\export.zip
pac solution import --path .\solution.zip
pac solution delete --name MySolution

# PCF Control
pac pcf init --namespace MyNamespace --name MyControl --template field
pac pcf version
pac pcf push --publisher-prefix new

# Environment
pac env list
pac env select --index 1
pac env who

# Build
npm run build
npm run clean
npm run rebuild
msbuild /t:build /restore
```

### D. Azure OpenAI Cost Estimation

| Model | Input Cost (per 1K tokens) | Output Cost (per 1K tokens) | Typical Document |
|-------|---------------------------|----------------------------|------------------|
| GPT-4 Turbo Vision | $0.01 | $0.03 | $0.05 - $0.15 |
| GPT-4o | $0.005 | $0.015 | $0.025 - $0.08 |

**Monthly estimates (100 documents/day):**
- GPT-4o: ~$150-$240/month
- GPT-4 Turbo: ~$300-$450/month

### E. Security Checklist

- [ ] API keys stored in Environment Variables (Secret type)
- [ ] No hardcoded credentials in source code
- [ ] Azure Key Vault configured for production
- [ ] Security roles assigned correctly
- [ ] Field-level security configured
- [ ] Audit logging enabled
- [ ] HTTPS enforced for all API calls
- [ ] IP restrictions configured in Azure (if required)
- [ ] Managed identity configured
- [ ] Regular key rotation scheduled

### F. Performance Optimization

```typescript
// Compress images before sending to API
async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Resize if larger than 2048px
            const maxSize = 2048;
            let width = img.width;
            let height = img.height;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height / width) * maxSize;
                    width = maxSize;
                } else {
                    width = (width / height) * maxSize;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
                (blob) => resolve(blob!),
                'image/jpeg',
                0.85 // 85% quality
            );
        };
        img.src = URL.createObjectURL(file);
    });
}
```

### G. Multi-Language Support

Supported translation languages:

```typescript
const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'sv', name: 'Swedish' }
];
```

---

## 🎓 Additional Resources

- **Power Apps PCF Documentation:** [docs.microsoft.com/powerapps/developer/component-framework](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/overview)
- **Azure OpenAI Service:** [learn.microsoft.com/azure/cognitive-services/openai](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- **Power Platform ALM:** [docs.microsoft.com/power-platform/alm](https://docs.microsoft.com/en-us/power-platform/alm/)
- **pac CLI Reference:** [docs.microsoft.com/powerapps/developer/cli/reference](https://docs.microsoft.com/en-us/powerapps/developer/data-platform/powerapps-cli)

---

## 📞 Support & Contact

Need help with deployment?

- **GitHub Issues:** [github.com/aindike/DocPulseAI/issues](https://github.com/aindike/DocPulseAI/issues)
- **Email Support:** support@docpulseai.com
- **Documentation:** [github.com/aindike/DocPulseAI/wiki](https://github.com/aindike/DocPulseAI/wiki)

---

<div align="center">

**Successfully deployed DocPulseAI? [⭐ Star the repo](https://github.com/aindike/DocPulseAI)!**

</div>
