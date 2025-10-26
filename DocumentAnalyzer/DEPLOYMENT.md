# Deployment Guide - DocPulseAI PCF Control

## Overview

This guide walks through deploying the DocPulseAI Document Analyzer PCF control to your Dynamics 365 / Power Apps environment.

## Prerequisites Checklist

✅ **Azure Resources**
- Azure OpenAI resource created
- GPT-4 or GPT-4o model deployed
- (Optional) Azure Document Intelligence resource created

✅ **Development Tools**
- Power Apps CLI installed: `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`
- MSBuild available (Visual Studio or Build Tools)
- Node.js v16+ installed

✅ **Dynamics 365 Access**
- System Administrator or System Customizer role
- Access to Power Apps maker portal
- Permission to import solutions

---

## Deployment Steps

### Step 1: Build the PCF Control

```powershell
# Navigate to the control directory
cd c:\HB\PCF\Repo\DocPulseAI\DocumentAnalyzer

# Install dependencies (if not already done)
npm install

# Build the control
npm run build
```

**Expected Output**: `[build] Succeeded`

**Troubleshooting**:
- If build fails, check Node.js version: `node --version` (should be 16+)
- Clear node_modules and reinstall: `Remove-Item -Recurse node_modules; npm install`

---

### Step 2: Create Solution Package

#### Option A: Using Existing Solution Project

If you already have a solution in the parent directory:

```powershell
cd ..

# Add PCF control reference to existing solution
pac solution add-reference --path .\DocumentAnalyzer

# Build the solution
msbuild /t:build /restore /p:Configuration=Release
```

#### Option B: Create New Solution

```powershell
cd c:\HB\PCF\Repo\DocPulseAI

# Initialize new solution
pac solution init --publisher-name "YourOrg" --publisher-prefix "org"

# Add PCF control
pac solution add-reference --path .\DocumentAnalyzer

# Build solution
msbuild /t:build /restore /p:Configuration=Release
```

**Build Output Location**: `bin\Release\[SolutionName].zip`

**Common Issues**:
- **MSBuild not found**: Install Visual Studio Build Tools or full Visual Studio
- **Build fails**: Ensure PCF build succeeded first (Step 1)
- **Publisher prefix error**: Use lowercase, no special characters

---

### Step 3: Import Solution to Dynamics 365

#### Method 1: Power Apps Portal (Recommended for first-time)

1. **Navigate to Power Apps**
   - Go to https://make.powerapps.com
   - Select your target environment (top-right)

2. **Import Solution**
   - Click **Solutions** in left navigation
   - Click **Import solution** button
   - Click **Browse** and select your `.zip` file from `bin\Release\`
   - Click **Next**

3. **Review Import Options**
   - Review publisher information
   - Click **Import**
   - Wait for import to complete (1-5 minutes)

4. **Publish Customizations**
   - After successful import, click **Publish all customizations**
   - Wait for publish to complete

#### Method 2: PAC CLI (For automation/CI-CD)

```powershell
# Authenticate to your environment
pac auth create --url https://yourorg.crm.dynamics.com

# Import solution
pac solution import --path .\bin\Release\YourSolution.zip --async

# Check import status
pac solution list
```

**Environment URL Examples**:
- US: `https://orgname.crm.dynamics.com`
- Europe: `https://orgname.crm4.dynamics.com`
- UK: `https://orgname.crm11.dynamics.com`

---

### Step 4: Configure Environment Variables (Recommended)

Instead of hardcoding API keys, use environment variables:

1. **In Power Apps, go to your solution**
2. **Create Environment Variables**:
   
   Click **New** → **More** → **Environment variable**
   
   Create these variables:
   
   | Display Name | Name | Data Type | Current Value |
   |--------------|------|-----------|---------------|
   | DocPulse OpenAI Endpoint | `docpulse_openai_endpoint` | Text | `https://your-resource.openai.azure.com/` |
   | DocPulse OpenAI Key | `docpulse_openai_key` | Secret | `your-api-key` |
   | DocPulse Deployment | `docpulse_deployment` | Text | `gpt-4o` |
   | DocPulse DocIntel Endpoint | `docpulse_docintel_endpoint` | Text | `https://your-docintel.cognitiveservices.azure.com/` |
   | DocPulse DocIntel Key | `docpulse_docintel_key` | Secret | `your-key` |

3. **Mark sensitive variables as "Secret"** ✅

---

### Step 5: Add Control to Entity Form

1. **Open Form Designer**
   - Navigate to **Tables** (or Entities)
   - Select your entity (e.g., Account, Contact, Case, Custom Entity)
   - Click **Forms** tab
   - Open the form you want to add the control to

2. **Add or Select Field**
   - You need a **Single Line of Text** field to bind the summary to
   - **Option A**: Use existing text field
   - **Option B**: Create new field:
     - Click **+ New field** (or **+ Field**)
     - Display name: "Document Analysis Summary"
     - Data type: Text → Single line of text
     - Max length: 4000 (or Single line - unlimited)
     - Click **Done**

3. **Add the PCF Control**
   - Click on your text field in the form
   - In the right properties panel, click **+ Component**
   - Select **DocumentAnalyzer** from the list
   - Click **Add**

4. **Configure Control Properties**
   
   Set these properties (either with direct values or environment variable references):
   
   | Property | Value (Direct) | Value (Environment Variable) |
   |----------|----------------|------------------------------|
   | Azure OpenAI Endpoint | `https://your-resource.openai.azure.com/` | `{{docpulse_openai_endpoint}}` |
   | Azure API Key | `your-api-key` | `{{docpulse_openai_key}}` |
   | Deployment Name | `gpt-4o` | `{{docpulse_deployment}}` |
   | Document Intelligence Endpoint | `https://your-resource.cognitiveservices.azure.com/` | `{{docpulse_docintel_endpoint}}` |
   | Document Intelligence Key | `your-key` | `{{docpulse_docintel_key}}` |
   | Max File Size (MB) | `10` | (leave default) |
   | Accepted File Types | `.pdf,.png,.jpg,.jpeg` | (leave default) |

   **⚠️ Important**: Using environment variables is strongly recommended for security!

5. **Configure Field Properties**
   - In the field properties:
     - **Hide Label**: Optional (the control has its own UI)
     - **Lock field**: Unchecked (control needs write access)
     - **Visible**: Yes

6. **Save and Publish**
   - Click **Save** button
   - Click **Publish** button
   - Wait for publish to complete

---

### Step 6: Configure Entity Settings (If Not Already Enabled)

The control creates Notes (Annotations) on records. Ensure Notes are enabled:

1. **Navigate to Table Settings**
   - Go to **Tables** → Select your entity
   - Click **Properties** (or edit table settings)

2. **Enable Notes**
   - Under **Options for this table**, find:
     - ✅ **Notes** (includes attachments)
   - Click **Save**

3. **Publish Changes**

---

### Step 7: Set Security Roles

Users need permissions to:
- Read/Write the entity record
- Create/Read Annotations (Notes)

1. **Go to Security** → **Security Roles**
2. **Select user role** (e.g., Salesperson, Customer Service Rep)
3. **Ensure permissions**:
   - **Core Records** tab:
     - **Note**: Create, Read, Append (at minimum Organization level)
   - **Custom Entities** tab:
     - Your entity: Read, Write access

---

### Step 8: Test the Control

1. **Open a Record**
   - Navigate to your entity
   - Open an existing record (or create new and save)

2. **Locate the Control**
   - Scroll to the form section with your control
   - You should see the drag-drop upload zone

3. **Upload a Test Document**
   - Drag and drop a PDF or image
   - Or click to browse and select

4. **Verify Processing**
   - Watch the "Processing..." state
   - After 10-30 seconds, summary card should appear

5. **Test Actions**
   - Click **🔄 Regenerate** - Should regenerate analysis
   - Click **🌍 Translate** - Enter language (e.g., "Spanish")
   - Click **📝 Expand** - Should provide more details
   - Click **➕ New Document** - Should reset to upload

6. **Verify Data**
   - Check the bound field has the summary text
   - Check **Timeline** - Note attachment should be created
   - Open the Note to verify file is attached

---

## Post-Deployment Configuration

### Configure Default Values (Optional)

You can set default configuration in the form's OnLoad event:

```javascript
// Form OnLoad script
function setDocPulseDefaults(executionContext) {
    var formContext = executionContext.getFormContext();
    
    // Set deployment name if empty
    var deploymentControl = formContext.getControl("your_field_name");
    if (deploymentControl) {
        // Access control properties if needed
    }
}
```

### Monitor Azure Costs

1. **Set up Azure Cost Alerts**
   - Go to Azure Portal → Cost Management
   - Create budget alerts for OpenAI usage

2. **Expected Costs**:
   - GPT-4o: ~$0.01-0.03 per document
   - Document Intelligence: ~$0.001 per page
   - For 100 documents/day: ~$30-50/month

---

## Troubleshooting Deployment

### Control Doesn't Appear on Form

**Check**:
- [ ] Solution imported successfully
- [ ] Form published after adding control
- [ ] Browser cache cleared (Ctrl+F5)
- [ ] Field is correct type (Single Line Text)
- [ ] User has permission to view the field

**Fix**:
```powershell
# Re-publish all customizations
pac solution publish
```

### "External service usage" Error

**Issue**: Control uses external Azure APIs

**Fix**:
- This is expected - the control will be marked as "Premium"
- Ensure users have appropriate licenses (Power Apps Per User/App)
- Verify external domains are allowed in environment settings

### Import Fails with "Missing Dependencies"

**Check**:
- [ ] PCF control built successfully
- [ ] Solution package is valid ZIP
- [ ] Publisher prefix matches

**Fix**: Rebuild solution from scratch:
```powershell
cd c:\HB\PCF\Repo\DocPulseAI
Remove-Item -Recurse bin, obj
msbuild /t:restore /t:rebuild /p:Configuration=Release
```

### Control Shows "Configuration Error"

**Check**:
- [ ] Azure OpenAI endpoint is valid URL (with https://)
- [ ] API key is correct
- [ ] Deployment name matches Azure resource
- [ ] Environment variables resolved correctly

**Fix**: Test Azure connection separately:
```powershell
# Test OpenAI endpoint
curl https://your-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-15-preview `
  -H "api-key: YOUR_KEY" `
  -H "Content-Type: application/json" `
  -d '{"messages":[{"role":"user","content":"test"}],"max_tokens":10}'
```

---

## CI/CD Integration

### Azure DevOps Pipeline

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'windows-latest'

steps:
- task: PowerShell@2
  displayName: 'Install Power Apps CLI'
  inputs:
    targetType: 'inline'
    script: |
      dotnet tool install --global Microsoft.PowerApps.CLI.Tool

- task: PowerShell@2
  displayName: 'Build PCF Control'
  inputs:
    targetType: 'inline'
    script: |
      cd DocumentAnalyzer
      npm install
      npm run build

- task: MSBuild@1
  displayName: 'Build Solution'
  inputs:
    solution: '**/*.sln'
    configuration: 'Release'

- task: PowerShell@2
  displayName: 'Import to Dynamics 365'
  inputs:
    targetType: 'inline'
    script: |
      pac auth create --url $(D365_URL) --applicationId $(APP_ID) --clientSecret $(CLIENT_SECRET) --tenant $(TENANT_ID)
      pac solution import --path bin/Release/*.zip --async
```

---

## Upgrade Procedure

When deploying updates:

1. **Update Version Number**
   - Edit `ControlManifest.Input.xml`
   - Increment version: `1.0.0` → `1.0.1`

2. **Rebuild Everything**
   ```powershell
   cd DocumentAnalyzer
   npm run build
   cd ..
   msbuild /t:rebuild /p:Configuration=Release
   ```

3. **Import as Upgrade**
   - In Power Apps, import solution
   - Select **Upgrade** option (not new)

4. **Apply Upgrade**
   - After import, go to Solutions
   - Click **Apply upgrade** on staged solution

---

## Rollback Procedure

If you need to rollback:

1. **Go to Solutions**
2. **Find previous version** in solution history
3. **Click "Restore"** or re-import old solution
4. **Publish customizations**

Or maintain solution versions:
- v1.0.0-production
- v1.1.0-staging
- v1.2.0-dev

---

## Support & Monitoring

### Enable Diagnostics

1. **Browser Console**: Press F12 to view errors
2. **Dynamics Diagnostics**: `&flags=DevErrors=true` in URL
3. **Azure Monitor**: Enable Application Insights for Azure OpenAI

### Health Check Script

```powershell
# Check control deployment
pac solution list
pac pcf list

# Check Azure resources
az cognitiveservices account show --name your-openai --resource-group rg-name
```

---

## Success Criteria

✅ Solution imported without errors  
✅ Control appears on form  
✅ Can upload document  
✅ Processing completes successfully  
✅ Summary displays correctly  
✅ Note created in timeline  
✅ All action buttons work  
✅ Users can access control  
✅ Azure costs within budget  

---

## Next Steps

After successful deployment:

1. **Train Users** - Provide user guide and demo
2. **Monitor Usage** - Track adoption and costs
3. **Gather Feedback** - Collect user suggestions
4. **Iterate** - Enhance based on feedback

---

## Additional Resources

- [Power Apps PCF Documentation](https://docs.microsoft.com/powerapps/developer/component-framework)
- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure Document Intelligence](https://learn.microsoft.com/azure/ai-services/document-intelligence/)

---

**Congratulations!** 🎉 Your DocPulseAI control is now deployed and ready to use!
