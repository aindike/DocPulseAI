# 📚 DocPulseAI - AI-Powered Document Analyzer

[![PCF Control](https://img.shields.io/badge/PCF-Control-blue.svg)](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/overview)
[![Azure OpenAI](https://img.shields.io/badge/Azure-OpenAI-orange.svg)](https://azure.microsoft.com/en-us/services/cognitive-services/openai-service/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

> **Transform document management in Dynamics 365 with AI-powered analysis!**

DocPulseAI is a production-ready PowerApps Component Framework (PCF) control that enables intelligent document analysis directly within Dynamics 365 forms. Upload documents, automatically create attachments, and leverage Azure OpenAI (GPT-4 Vision) to extract insights, identify risks, and generate actionable summaries—all without Power Automate.

---

## 🎯 Key Features

### 📤 **Intelligent Document Upload**
- **Drag & Drop Interface** - Intuitive file upload with visual feedback
- **Multi-Format Support** - PDF, PNG, JPG, JPEG files
- **Automatic Note Creation** - Files automatically attached to current Dynamics 365 record
- **Configurable Size Limits** - Control maximum file size (default: 10MB)

### 🤖 **AI-Powered Analysis**
- **Azure OpenAI Integration** - Direct GPT-4 Vision API calls (no Power Automate required)
- **Executive Summaries** - Concise document overviews
- **Key Points Extraction** - Automatic identification of critical information
- **Risk Assessment** - Color-coded risk identification (High/Medium/Low)
- **Action Items** - Automated next-steps recommendations

### 🔄 **Advanced AI Operations**
- **Regenerate Analysis** - Re-process with fresh AI insights
- **Multi-Language Translation** - Translate summaries to 15+ languages
- **Detail Expansion** - Get in-depth analysis on demand
- **Confidence Scoring** - Optional AI confidence metrics

### ⚙️ **Enterprise-Ready Configuration**
- **Direct Azure Integration** - Configure endpoints without middleware
- **Environment Variables Support** - Secure credential management
- **Azure Document Intelligence** - Optional OCR enhancement
- **Customizable File Types** - Control accepted formats
- **Form Designer Integration** - Easy configuration via Power Apps

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dynamics 365 Form                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           DocPulseAI PCF Control                      │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │ Drop Zone   │→│ File Handler │→│ Note API   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  │         ↓                                  ↓          │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │        AI Analysis Engine                   │    │  │
│  │  │  - Base64 Encoding                          │    │  │
│  │  │  - Azure OpenAI API                         │    │  │
│  │  │  - Result Parsing                           │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │         ↓                                            │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │     Summary Display                         │    │  │
│  │  │  - Executive Summary                        │    │  │
│  │  │  - Key Points                               │    │  │
│  │  │  - Risk Assessment                          │    │  │
│  │  │  - Action Items                             │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────────────────────────┐
        │      Azure Services                  │
        │  ┌────────────────────────────────┐  │
        │  │   Azure OpenAI (GPT-4 Vision)  │  │
        │  │   - Vision Analysis            │  │
        │  │   - Text Processing            │  │
        │  │   - Translation                │  │
        │  └────────────────────────────────┘  │
        │  ┌────────────────────────────────┐  │
        │  │  Document Intelligence (Opt.)  │  │
        │  │   - OCR Enhancement            │  │
        │  │   - Text Extraction            │  │
        │  └────────────────────────────────┘  │
        └─────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- **Dynamics 365 Environment** (Power Apps/Model-Driven Apps)
- **Azure OpenAI Service** with GPT-4 Vision deployment
- **Node.js** (v18 or higher)
- **PowerApps CLI** (pac CLI)
- **Visual Studio Code** (recommended)

### Installation

1. **Clone the Repository**
   ```powershell
   git clone https://github.com/aindike/DocPulseAI.git
   cd DocPulseAI\DocumentAnalyzer
   ```

2. **Install Dependencies**
   ```powershell
   npm install
   ```

3. **Build the Control**
   ```powershell
   npm run build
   ```

4. **Deploy to Dynamics 365**
   
   See the comprehensive [DEPLOYMENT.md](DEPLOYMENT.md) guide for detailed deployment steps.

---

## 📋 Configuration

### Required Properties

| Property | Description | Example |
|----------|-------------|---------|
| **documentSummary** | Bound field to store analysis results | Single Line Text field |
| **azureEndpoint** | Azure OpenAI endpoint URL | `https://your-resource.openai.azure.com/` |
| **azureApiKey** | Azure OpenAI API key | Use Environment Variable reference |
| **deploymentName** | GPT-4 deployment name | `gpt-4o` or `gpt-4-vision` |

### Optional Properties

| Property | Description | Default |
|----------|-------------|---------|
| **documentIntelligenceEndpoint** | Azure Document Intelligence URL | - |
| **documentIntelligenceKey** | Document Intelligence API key | - |
| **maxFileSizeMB** | Maximum file size in MB | `10` |
| **acceptedFileTypes** | Comma-separated file extensions | `.pdf,.png,.jpg,.jpeg` |

### Environment Variables Setup

For production deployments, use Environment Variables for secure credential management:

1. Navigate to **Power Apps** → **Solutions** → **Environment Variables**
2. Create new Environment Variables:
   - `docpulseai_azure_endpoint`
   - `docpulseai_azure_apikey`
   - `docpulseai_deployment_name`
3. Reference in control properties: `${docpulseai_azure_endpoint}`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed security configuration.

---

## 💻 Usage

### In Dynamics 365 Forms

1. **Add Control to Form**
   - Open form designer
   - Add Single Line Text field
   - Replace default control with "DocPulseAI.DocumentAnalyzer"
   - Configure Azure properties

2. **Upload Documents**
   - Drag & drop files onto the control
   - Or click "Choose File" button
   - Files automatically attach to record as Notes

3. **View AI Analysis**
   - Analysis appears automatically after upload
   - Expand sections for detailed insights
   - Use action buttons (Regenerate, Translate, Expand)

### Example Analysis Output

```
📄 Executive Summary
────────────────────
This contract outlines a 3-year service agreement between Contoso Corp
and Fabrikam Inc., valued at $2.5M annually...

🔑 Key Points
────────────────────
• Annual revenue: $2.5M
• Term: 36 months (Jan 2025 - Dec 2027)
• Auto-renewal clause included
• 30-day termination notice required

⚠️ Risks Identified
────────────────────
🔴 HIGH: Unlimited liability clause in Section 5.2
🟡 MEDIUM: Payment terms exceed industry standard (Net-60)

✅ Next Actions
────────────────────
1. Legal review of liability terms
2. Negotiate payment terms to Net-30
3. Schedule kick-off meeting
```

---

## 🔧 Development

### Project Structure

```
DocumentAnalyzer/
├── DocumentAnalyzer/
│   ├── index.ts                 # Main control logic (952 lines)
│   ├── ControlManifest.Input.xml  # PCF manifest
│   ├── css/
│   │   └── DocumentAnalyzer.css   # Styling
│   └── generated/
│       └── ManifestTypes.d.ts     # Auto-generated types
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs          # Linting rules
└── DocumentAnalyzer.pcfproj   # Project file
```

### Build Commands

```powershell
# Build the control
npm run build

# Build and watch for changes
npm run start:watch

# Clean build artifacts
npm run clean

# Rebuild from scratch
npm run rebuild

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Local Testing

```powershell
# Start test harness
npm start

# Navigate to http://localhost:8181
```

---

## 🔐 Security Considerations

### API Key Management

⚠️ **NEVER hardcode API keys in control properties!**

**Recommended Approaches:**

1. **Environment Variables** (Recommended for Production)
   ```
   Property Value: ${docpulseai_azure_apikey}
   ```

2. **Azure Key Vault** (Enterprise)
   - Store keys in Azure Key Vault
   - Reference via managed identities
   - Rotate keys automatically

3. **Custom APIs** (Advanced)
   - Create custom API connector
   - Use OAuth 2.0 authentication
   - Proxy requests through secure endpoint

### Data Privacy

- Document data is **NOT stored** by the control
- Files are attached as Dynamics 365 Notes
- AI requests are sent directly to Azure (encrypted in transit)
- No third-party services involved
- Compliant with GDPR/HIPAA when using Azure Government

### Network Security

- All API calls use HTTPS/TLS 1.2+
- Supports Azure Private Endpoints
- Compatible with firewall rules
- Domains whitelisted in manifest:
  - `*.openai.azure.com`
  - `*.cognitiveservices.azure.com`

---

## 🌐 Supported Languages

The control supports translation to:

- English, Spanish, French, German, Italian
- Portuguese, Dutch, Russian, Chinese (Simplified/Traditional)
- Japanese, Korean, Arabic, Hindi, Swedish

---

## 📊 Performance

### Typical Processing Times

| Document Type | Size | Analysis Time |
|--------------|------|---------------|
| Simple PDF | 1-2 pages | 5-10 seconds |
| Complex Contract | 10-20 pages | 15-30 seconds |
| Image (PNG/JPG) | < 5MB | 8-15 seconds |

### Optimization Tips

1. **File Size** - Compress large PDFs before upload
2. **Image Quality** - Use 150-300 DPI for OCR
3. **Concurrent Requests** - Control handles one analysis at a time
4. **Caching** - Results stored in bound field for instant retrieval

---

## 🐛 Troubleshooting

### Common Issues

**❌ "Azure configuration not set"**
- **Solution:** Ensure Azure endpoint and API key are configured
- **Check:** Control properties in form designer

**❌ "Failed to create note attachment"**
- **Solution:** Verify user has create permissions on Notes entity
- **Check:** Security roles and field-level security

**❌ "File size exceeds limit"**
- **Solution:** Compress file or increase `maxFileSizeMB` property
- **Default:** 10MB

**❌ "AI analysis failed"**
- **Solution:** Verify Azure OpenAI deployment is active
- **Check:** API key validity, deployment name spelling, quota limits

**❌ "Invalid file type"**
- **Solution:** Ensure file extension matches `acceptedFileTypes`
- **Supported:** .pdf, .png, .jpg, .jpeg

### Debug Mode

Enable browser console logging:
1. Press `F12` in browser
2. Look for `[DocPulseAI]` prefixed messages
3. Check Network tab for API responses

---

## 🚢 Production Deployment

For comprehensive deployment instructions, including:
- Solution packaging
- ALM (Application Lifecycle Management)
- CI/CD pipelines
- Multi-environment strategies
- Monitoring and logging

**See the detailed [DEPLOYMENT.md](DEPLOYMENT.md) guide.**

---

## 📈 Roadmap

### Version 1.1 (Planned)
- [ ] Batch document processing
- [ ] Custom prompt templates
- [ ] Historical analysis tracking
- [ ] Export to PDF/Word

### Version 1.2 (Future)
- [ ] Multi-model support (Claude, Gemini)
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboard
- [ ] Mobile optimization

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`feature/amazing-feature`)
3. **Commit your changes** with clear messages
4. **Push to the branch**
5. **Open a Pull Request**

### Code Standards

- TypeScript with strict mode
- ESLint configuration provided
- Maintain existing code style
- Add comments for complex logic
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Microsoft Power Apps** team for PCF framework
- **Azure OpenAI** for GPT-4 Vision capabilities
- **Dynamics 365** community for inspiration and feedback

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/aindike/DocPulseAI/issues)
- **Discussions:** [GitHub Discussions](https://github.com/aindike/DocPulseAI/discussions)
- **Email:** support@docpulseai.com

---

## 📚 Additional Resources

- [PowerApps Component Framework Documentation](https://docs.microsoft.com/en-us/powerapps/developer/component-framework/overview)
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Dynamics 365 Developer Guide](https://docs.microsoft.com/en-us/dynamics365/)

---

<div align="center">

**Made with ❤️ by the DocPulseAI Team**

[⭐ Star this repo](https://github.com/aindike/DocPulseAI) | [🐛 Report Bug](https://github.com/aindike/DocPulseAI/issues) | [💡 Request Feature](https://github.com/aindike/DocPulseAI/issues)

</div>
