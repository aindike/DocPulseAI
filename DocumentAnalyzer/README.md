# DocPulseAI - Document Analyzer PCF Control

An intelligent Dynamics 365 PCF control that enables users to drag-and-drop or upload PDF and image documents directly on forms. The control automatically:
- Creates Note (attachment) records against the current record
- Extracts text from documents using Azure Document Intelligence
- Analyzes content with Azure OpenAI (GPT-4)
- Displays beautiful, actionable summaries with executive summary, key points, risks, and next actions
- Provides Regenerate, Translate, and Expand capabilities

## Features

✨ **Drag & Drop Upload** - Intuitive file upload with drag-and-drop support  
📄 **Automatic Attachment** - Creates Notes in Dynamics 365 against the current record  
🤖 **AI-Powered Analysis** - Uses Azure OpenAI GPT-4 for intelligent document analysis  
📊 **Beautiful Summary Cards** - Executive summary, key points, risks, and next actions  
🔄 **Regenerate** - Get a fresh analysis of the document  
🌍 **Translate** - Translate summaries to any language  
📝 **Expand** - Get more detailed analysis with additional insights  
🎨 **Modern UI** - Clean, professional interface with loading states  
⚙️ **Configurable** - Set Azure endpoints and keys via control properties

## Prerequisites

1. **Azure OpenAI Service**
   - Azure OpenAI resource with GPT-4 or GPT-4o deployment
   - Endpoint URL and API key

2. **Azure Document Intelligence** (Optional but recommended)
   - For advanced OCR and text extraction from PDFs
   - Endpoint URL and API key

3. **Power Apps CLI**
   - Install: `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`

4. **Node.js** (v16 or higher)

## Azure Setup

### 1. Create Azure OpenAI Resource

```bash
# Create resource group
az group create --name DocPulseAI-RG --location eastus

# Create Azure OpenAI resource
az cognitiveservices account create \
  --name docpulse-openai \
  --resource-group DocPulseAI-RG \
  --kind OpenAI \
  --sku S0 \
  --location eastus

# Deploy GPT-4 model
az cognitiveservices account deployment create \
  --name docpulse-openai \
  --resource-group DocPulseAI-RG \
  --deployment-name gpt-4o \
  --model-name gpt-4o \
  --model-version "2024-05-13" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name Standard

# Get endpoint and key
az cognitiveservices account show \
  --name docpulse-openai \
  --resource-group DocPulseAI-RG \
  --query properties.endpoint

az cognitiveservices account keys list \
  --name docpulse-openai \
  --resource-group DocPulseAI-RG
```

### 2. Create Azure Document Intelligence Resource (Optional)

```bash
# Create Document Intelligence resource
az cognitiveservices account create \
  --name docpulse-docintel \
  --resource-group DocPulseAI-RG \
  --kind FormRecognizer \
  --sku S0 \
  --location eastus

# Get endpoint and key
az cognitiveservices account show \
  --name docpulse-docintel \
  --resource-group DocPulseAI-RG \
  --query properties.endpoint

az cognitiveservices account keys list \
  --name docpulse-docintel \
  --resource-group DocPulseAI-RG
```

## Installation & Build

### 1. Build the PCF Control

```powershell
# Navigate to the control directory
cd DocumentAnalyzer

# Restore dependencies
npm install

# Build the control
npm run build
```

### 2. Test in Test Harness (Optional)

```powershell
# Start the test harness
npm start watch
```

### 3. Package for Deployment

```powershell
# Navigate back to root
cd ..

# Create solution project (if not exists)
pac solution init --publisher-name DocPulseAI --publisher-prefix dp

# Add reference to the PCF control
pac solution add-reference --path .\DocumentAnalyzer

# Build the solution
msbuild /t:build /restore

# The solution ZIP will be in bin\Debug or bin\Release
```

## Deployment to Dynamics 365

### Method 1: Import Solution

1. Navigate to Power Apps (make.powerapps.com)
2. Go to **Solutions** → **Import**
3. Upload the generated solution ZIP file
4. Follow the import wizard
5. Publish all customizations

### Method 2: Using PAC CLI

```powershell
# Authenticate
pac auth create --url https://yourorg.crm.dynamics.com

# Push the solution
pac solution import --path .\bin\Debug\DocPulseAI.zip
```

## Configuration

### 1. Add Control to Form

1. Open your form in the form designer
2. Select a field (single line text) to bind the document summary to
3. Click **+ Component** on the field
4. Select **DocumentAnalyzer** from the list
5. Configure the properties:

### 2. Configure Control Properties

| Property | Description | Example | Required |
|----------|-------------|---------|----------|
| **Document Summary** | Bound field to store analysis | Any text field | ✅ Yes |
| **Azure OpenAI Endpoint** | Azure OpenAI endpoint URL | `https://your-resource.openai.azure.com/` | ✅ Yes |
| **Azure API Key** | Azure OpenAI API key | `your-api-key-here` | ✅ Yes |
| **Deployment Name** | Model deployment name | `gpt-4o` | ❌ No (default: gpt-4o) |
| **Document Intelligence Endpoint** | Azure Document Intelligence endpoint | `https://your-resource.cognitiveservices.azure.com/` | ❌ No |
| **Document Intelligence Key** | Azure Document Intelligence key | `your-key-here` | ❌ No |
| **Max File Size (MB)** | Maximum file size allowed | `10` | ❌ No (default: 10) |
| **Accepted File Types** | Comma-separated extensions | `.pdf,.png,.jpg,.jpeg` | ❌ No |

### 3. Security Recommendations

**⚠️ IMPORTANT: Never hardcode API keys in the control properties visible to end users!**

#### Best Practice: Use Environment Variables

1. Create **Environment Variables** in your solution:
   - Name: `DocPulseAI_OpenAI_Endpoint`
   - Name: `DocPulseAI_OpenAI_Key` (marked as secret)
   - Name: `DocPulseAI_DocIntel_Endpoint`
   - Name: `DocPulseAI_DocIntel_Key` (marked as secret)

2. Reference environment variables in form customization:
   - In the control properties, use: `{{DocPulseAI_OpenAI_Key}}`

3. Alternatively, use **Azure Key Vault** integration:
   - Store keys in Key Vault
   - Reference via secure configuration
   - Rotate keys regularly

## Usage

### Basic Workflow

1. **Upload Document**
   - Drag and drop a PDF or image onto the control
   - Or click the drop zone to browse files

2. **Processing**
   - Control creates a Note attachment
   - Extracts text from the document
   - Analyzes with Azure OpenAI
   - Displays summary card

3. **Review Summary**
   - Executive Summary: High-level overview
   - Key Points: Important information
   - Risks & Concerns: Identified risks with severity
   - Next Actions: Recommended actions

4. **Actions**
   - **🔄 Regenerate**: Get a new analysis
   - **🌍 Translate**: Convert to another language
   - **📝 Expand**: Get more detailed insights
   - **➕ New Document**: Upload another file

## Supported File Types

- **PDF** (.pdf) - Best with Document Intelligence configured
- **Images** (.png, .jpg, .jpeg) - Uses GPT-4 Vision capabilities

## Architecture

```
┌─────────────────┐
│   D365 Form     │
│  ┌───────────┐  │
│  │   PCF     │  │
│  │  Control  │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
    ┌────┴────┐
    │  WebAPI │  (Create Note)
    └────┬────┘
         │
    ┌────┴──────────────────┐
    │                       │
┌───▼────────┐   ┌─────────▼──────────┐
│   Azure    │   │    Azure OpenAI    │
│  Document  │   │   (GPT-4 Vision)   │
│Intelligence│   │                    │
│   (OCR)    │   │  - Analysis        │
└────────────┘   │  - Translation     │
                 │  - Expansion       │
                 └────────────────────┘
```

## API Usage & Costs

### Azure OpenAI
- **Model**: GPT-4o or GPT-4 Vision
- **Cost**: ~$0.01-0.03 per document analysis
- **Tokens**: Typically 1000-2000 per analysis

### Azure Document Intelligence
- **Model**: Prebuilt Read
- **Cost**: $0.001 per page for Read model
- **Processing**: 1-5 seconds per document

## Troubleshooting

### Control Doesn't Load
- Check browser console for errors
- Verify WebAPI is enabled in manifest
- Ensure control is published

### "Azure OpenAI endpoint must be configured"
- Verify endpoint URL is correct (include `https://`)
- Check API key is properly set
- Ensure deployment name matches your Azure resource

### Document Intelligence Fails
- Endpoint configuration is optional
- Control will fall back to GPT-4 Vision for images
- For PDFs without Document Intelligence, manual text review suggested

### File Upload Fails
- Check file size limits (default 10MB)
- Verify file type is in accepted list
- Ensure Notes are enabled on the entity

### "Cannot create note: No entity reference found"
- Control must be placed on an entity form (not standalone)
- Ensure form is bound to a record (not in create mode initially)

## Development

### Project Structure

```
DocumentAnalyzer/
├── DocumentAnalyzer/
│   ├── css/
│   │   └── DocumentAnalyzer.css      # Styles
│   ├── index.ts                      # Main control logic
│   └── ControlManifest.Input.xml     # Manifest definition
├── package.json
├── tsconfig.json
└── README.md
```

### Build Commands

```powershell
# Development build
npm run build

# Watch mode
npm start watch

# Clean build
npm run clean
```

### Debugging

1. Use `npm start watch` for test harness
2. Add breakpoints in browser DevTools
3. Check console logs for detailed error messages
4. Use Fiddler/Postman to test Azure API calls directly

## Customization

### Modify Analysis Prompt

Edit the `getAnalysisPrompt()` method in `index.ts` to customize the AI analysis:

```typescript
private getAnalysisPrompt(filename: string): string {
    return `Your custom analysis instructions here...`;
}
```

### Add New Actions

1. Create a new button in `renderSummaryCard()`
2. Add handler method (e.g., `exportToPdf()`)
3. Implement functionality

### Change UI Theme

Modify `DocumentAnalyzer.css` to match your organization's branding.

## Security Considerations

1. **API Key Protection**
   - Use Environment Variables
   - Never commit keys to source control
   - Rotate keys regularly

2. **Data Privacy**
   - Documents are sent to Azure services
   - Ensure compliance with data residency requirements
   - Review Azure OpenAI data handling policies

3. **User Permissions**
   - Control respects Dynamics 365 security roles
   - Users need write access to create Notes
   - Consider field-level security on summary field

## License

MIT License - Free for commercial and personal use

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Review Azure service documentation
- Check Power Apps PCF documentation

## Version History

- **1.0.0** (2025-10-26)
  - Initial release
  - Drag & drop upload
  - Azure OpenAI integration
  - Document Intelligence support
  - Regenerate, Translate, Expand features

## Credits

Built with:
- Power Apps Component Framework (PCF)
- Azure OpenAI Service
- Azure Document Intelligence
- TypeScript & Modern CSS
