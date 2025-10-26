# Quick Start Guide - DocPulseAI

## 🚀 5-Minute Setup

### Step 1: Get Azure Credentials

You need **Azure OpenAI** credentials:

1. Go to [Azure Portal](https://portal.azure.com)
2. Find your Azure OpenAI resource
3. Copy:
   - **Endpoint**: `Keys and Endpoint` → Endpoint (e.g., `https://your-resource.openai.azure.com/`)
   - **API Key**: `Keys and Endpoint` → Key 1
   - **Deployment**: Your model deployment name (e.g., `gpt-4o`)

### Step 2: Build the Control

```powershell
# From the DocumentAnalyzer folder
cd c:\HB\PCF\Repo\DocPulseAI\DocumentAnalyzer

# Install dependencies (if not done)
npm install

# Build the control
npm run build
```

### Step 3: Create Solution Package

```powershell
# Go back to root
cd ..

# Initialize solution (first time only)
pac solution init --publisher-name YourCompany --publisher-prefix prefix

# Add the PCF control
pac solution add-reference --path .\DocumentAnalyzer

# Build solution
msbuild /t:build /restore
```

The solution package will be created in `bin\Debug\` folder.

### Step 4: Import to Dynamics 365

1. Go to https://make.powerapps.com
2. Select your environment
3. Go to **Solutions** → **Import solution**
4. Upload the `.zip` file from `bin\Debug\`
5. Click **Next** → **Import**
6. Wait for import to complete
7. **Publish all customizations**

### Step 5: Add to Form

1. Open your entity form (e.g., Account, Contact, Case)
2. Add a new field or use an existing **Single Line Text** field (e.g., "Document Summary")
3. Click on the field → **+ Component**
4. Select **DocumentAnalyzer**
5. Configure properties:
   - **Azure OpenAI Endpoint**: Your endpoint URL
   - **Azure API Key**: Your API key
   - **Deployment Name**: Your deployment name (e.g., `gpt-4o`)
6. **Save** and **Publish** the form

### Step 6: Test It!

1. Open a record with the form
2. You'll see the upload zone
3. Drag and drop a PDF or image
4. Wait for processing (10-30 seconds)
5. View the beautiful summary!

---

## 🔧 Advanced Configuration

### Use Environment Variables (Recommended)

Instead of hardcoding API keys in the form:

1. **Create Environment Variables**:
   - Go to **Solutions** → Your solution → **New** → **More** → **Environment variable**
   - Create variables:
     - `DocPulse_OpenAI_Endpoint`
     - `DocPulse_OpenAI_Key`
     - `DocPulse_Deployment`

2. **Reference in Form**:
   - In control properties, use: `{{DocPulse_OpenAI_Key}}`

### Add Document Intelligence (Optional)

For better PDF text extraction:

1. Create Azure Document Intelligence resource
2. Get endpoint and key
3. Add to control properties:
   - **Document Intelligence Endpoint**
   - **Document Intelligence Key**

---

## 📋 Configuration Checklist

- [ ] Azure OpenAI resource created
- [ ] GPT-4 or GPT-4o deployment created
- [ ] Endpoint and key copied
- [ ] PCF control built successfully
- [ ] Solution imported to D365
- [ ] Control added to form
- [ ] Properties configured
- [ ] Form published
- [ ] Tested with a document

---

## ❗ Common Issues

### "Processing failed"
- **Check**: API key is correct
- **Check**: Endpoint URL includes `https://`
- **Check**: Deployment name matches Azure

### "Cannot create note"
- **Check**: You're on a saved record (not create form)
- **Check**: Notes are enabled on the entity
- **Check**: User has create permission on Notes

### Control doesn't appear
- **Check**: Solution is published
- **Check**: Form is published
- **Check**: Browser cache cleared

---

## 🎯 Testing Checklist

Test with different documents:

- [ ] PDF file (< 10MB)
- [ ] PNG image
- [ ] JPG image
- [ ] Click **Regenerate** button
- [ ] Click **Translate** button (enter language)
- [ ] Click **Expand** button
- [ ] Upload new document
- [ ] Check Note is created in Timeline

---

## 📱 Support

Need help? Check:
1. README.md for full documentation
2. Browser console for error messages
3. Azure OpenAI service health
4. Dynamics 365 solution health

---

## 🎉 You're Done!

Your Dynamics 365 forms now have AI-powered document analysis! 

Upload a document and watch the magic happen ✨
