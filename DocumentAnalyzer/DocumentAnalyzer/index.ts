import { IInputs, IOutputs } from "./generated/ManifestTypes";

/**
 * Document Analysis Result Interface
 */
interface IDocumentAnalysis {
    executiveSummary: string;
    keyPoints: string[];
    risks: IRisk[];
    nextActions: string[];
    rawText?: string;
}

interface IRisk {
    level: 'high' | 'medium' | 'low';
    description: string;
}

/**
 * PCF Control State
 */
enum ControlState {
    Initial,
    Processing,
    DisplayingSummary,
    Error
}

/**
 * AI-Powered Document Analyzer PCF Control
 * Allows users to drag/drop or upload PDF/images, creates Notes against the current record,
 * and displays AI-generated analysis with configurable Azure endpoints
 */
export class DocumentAnalyzer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _context: ComponentFramework.Context<IInputs>;
    private _container: HTMLDivElement;
    private _notifyOutputChanged: () => void;
    
    // Configuration
    private _azureEndpoint: string;
    private _azureApiKey: string;
    private _deploymentName: string;
    private _documentIntelligenceEndpoint: string;
    private _documentIntelligenceKey: string;
    private _maxFileSizeMB: number;
    private _acceptedFileTypes: string[];
    
    // State
    private _currentState: ControlState = ControlState.Initial;
    private _currentAnalysis: IDocumentAnalysis | null = null;
    private _currentFile: File | null = null;
    private _documentSummary: string = "";
    
    // UI Elements
    private _dropZone: HTMLDivElement | null = null;
    private _fileInput: HTMLInputElement | null = null;

    constructor() {
        // Empty constructor
    }

    /**
     * Initialize the control
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._context = context;
        this._container = container;
        this._notifyOutputChanged = notifyOutputChanged;
        
        // Load configuration from properties
        this.loadConfiguration();
        
        // Render initial UI
        this.renderControl();
    }

    /**
     * Load configuration from input properties
     */
    private loadConfiguration(): void {
        const inputs = this._context.parameters;
        
        this._azureEndpoint = inputs.azureEndpoint?.raw || "";
        this._azureApiKey = inputs.azureApiKey?.raw || "";
        this._deploymentName = inputs.deploymentName?.raw || "gpt-4o";
        this._documentIntelligenceEndpoint = inputs.documentIntelligenceEndpoint?.raw || "";
        this._documentIntelligenceKey = inputs.documentIntelligenceKey?.raw || "";
        this._maxFileSizeMB = inputs.maxFileSizeMB?.raw || 10;
        
        const fileTypesString = inputs.acceptedFileTypes?.raw || ".pdf,.png,.jpg,.jpeg";
        this._acceptedFileTypes = fileTypesString.split(',').map(t => t.trim().toLowerCase());
    }

    /**
     * Update view when properties change
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
        this.loadConfiguration();
        
        // Check if summary was updated externally
        const currentSummary = context.parameters.documentSummary?.raw || "";
        if (currentSummary !== this._documentSummary && this._currentState !== ControlState.Processing) {
            // Summary was updated externally, refresh UI if needed
            this.renderControl();
        }
    }

    /**
     * Main render method
     */
    private renderControl(): void {
        this._container.innerHTML = "";
        this._container.className = "doc-analyzer-container";
        
        switch (this._currentState) {
            case ControlState.Initial:
                this.renderDropZone();
                break;
            case ControlState.Processing:
                this.renderProcessingState();
                break;
            case ControlState.DisplayingSummary:
                this.renderSummaryCard();
                break;
            case ControlState.Error:
                this.renderErrorState();
                break;
        }
    }

    /**
     * Render drag-drop zone
     */
    private renderDropZone(): void {
        const dropZone = document.createElement("div");
        dropZone.className = "drop-zone";
        
        dropZone.innerHTML = `
            <div class="drop-zone-icon">📄</div>
            <div class="drop-zone-text">Drag and drop your document here</div>
            <div class="drop-zone-subtext">or click to browse</div>
            <div class="drop-zone-subtext" style="margin-top: 8px;">
                Accepted: ${this._acceptedFileTypes.join(', ')} (Max ${this._maxFileSizeMB}MB)
            </div>
        `;
        
        // Create hidden file input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.className = "file-input";
        fileInput.accept = this._acceptedFileTypes.join(',');
        fileInput.addEventListener("change", this.handleFileSelect.bind(this));
        
        // Click to browse
        dropZone.addEventListener("click", () => fileInput.click());
        
        // Drag and drop events
        dropZone.addEventListener("dragover", this.handleDragOver.bind(this));
        dropZone.addEventListener("dragleave", this.handleDragLeave.bind(this));
        dropZone.addEventListener("drop", this.handleDrop.bind(this));
        
        this._container.appendChild(dropZone);
        this._container.appendChild(fileInput);
        
        this._dropZone = dropZone;
        this._fileInput = fileInput;
    }

    /**
     * Handle drag over event
     */
    private handleDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (this._dropZone) {
            this._dropZone.classList.add("drag-over");
        }
    }

    /**
     * Handle drag leave event
     */
    private handleDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (this._dropZone) {
            this._dropZone.classList.remove("drag-over");
        }
    }

    /**
     * Handle drop event
     */
    private handleDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        
        if (this._dropZone) {
            this._dropZone.classList.remove("drag-over");
        }
        
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.processFile(files[0]);
        }
    }

    /**
     * Handle file selection from input
     */
    private handleFileSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.processFile(input.files[0]);
        }
    }

    /**
     * Process uploaded file
     */
    private async processFile(file: File): Promise<void> {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.isValid) {
            this.showError("Invalid File", validation.error || "Unknown error");
            return;
        }
        
        this._currentFile = file;
        this._currentState = ControlState.Processing;
        this.renderControl();
        
        try {
            // Step 1: Create Note attachment in Dynamics
            const noteId = await this.createNoteAttachment(file);
            
            // Step 2: Extract text from document
            const extractedText = await this.extractTextFromDocument(file);
            
            // Step 3: Analyze document with Azure OpenAI
            const analysis = await this.analyzeDocument(extractedText, file.name);
            
            // Step 4: Update state and render summary
            this._currentAnalysis = analysis;
            this._documentSummary = this.formatSummaryForField(analysis);
            this._currentState = ControlState.DisplayingSummary;
            this._notifyOutputChanged();
            this.renderControl();
            
        } catch (error) {
            console.error("Error processing document:", error);
            this.showError("Processing Error", this.getErrorMessage(error));
        }
    }

    /**
     * Validate file before processing
     */
    private validateFile(file: File): { isValid: boolean; error?: string } {
        // Check file extension
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!this._acceptedFileTypes.includes(fileExtension)) {
            return {
                isValid: false,
                error: `File type ${fileExtension} is not accepted. Please upload: ${this._acceptedFileTypes.join(', ')}`
            };
        }
        
        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > this._maxFileSizeMB) {
            return {
                isValid: false,
                error: `File size (${fileSizeMB.toFixed(2)}MB) exceeds maximum allowed size of ${this._maxFileSizeMB}MB`
            };
        }
        
        return { isValid: true };
    }

    /**
     * Create Note (annotation) attachment in Dynamics 365
     */
    private async createNoteAttachment(file: File): Promise<string> {
        const entityReference = (this._context as any).page?.entityReference;
        
        if (!entityReference) {
            throw new Error("Cannot create note: No entity reference found");
        }
        
        // Convert file to base64
        const base64 = await this.fileToBase64(file);
        const base64Content = base64.split(',')[1]; // Remove data:mime;base64, prefix
        
        // Create annotation (note) record
        const annotation: any = {
            subject: `Document Analysis: ${file.name}`,
            notetext: `Document uploaded for AI analysis on ${new Date().toLocaleString()}`,
            filename: file.name,
            documentbody: base64Content,
            mimetype: file.type
        };
        
        // Add dynamic binding property
        const bindingProperty = `objectid_${entityReference.etn}@odata.bind`;
        annotation[bindingProperty] = `/${entityReference.etn}s(${entityReference.id.replace('{', '').replace('}', '')})`;
        
        try {
            const result = await this._context.webAPI.createRecord("annotation", annotation);
            return result.id;
        } catch (error) {
            console.error("Error creating note:", error);
            throw new Error(`Failed to create attachment: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Extract text from document using Azure Document Intelligence (Form Recognizer)
     */
    private async extractTextFromDocument(file: File): Promise<string> {
        // If Document Intelligence is configured, use it for better OCR
        if (this._documentIntelligenceEndpoint && this._documentIntelligenceKey) {
            return await this.extractWithDocumentIntelligence(file);
        }
        
        // Fallback: For images, use Azure OpenAI Vision
        // For PDFs without Document Intelligence, return instructions for manual review
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        if (fileExtension === 'pdf') {
            return `[PDF Document: ${file.name}]\nNote: Configure Azure Document Intelligence endpoint for automatic text extraction from PDFs.`;
        }
        
        // For images, we'll pass them directly to GPT-4 Vision
        return "[Image document - will be analyzed using vision capabilities]";
    }

    /**
     * Extract text using Azure Document Intelligence
     */
    private async extractWithDocumentIntelligence(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const url = `${this._documentIntelligenceEndpoint}/formrecognizer/documentModels/prebuilt-read:analyze?api-version=2023-07-31`;
        
        try {
            // Submit document for analysis
            const submitResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': file.type,
                    'Ocp-Apim-Subscription-Key': this._documentIntelligenceKey
                },
                body: arrayBuffer
            });
            
            if (!submitResponse.ok) {
                throw new Error(`Document Intelligence API error: ${submitResponse.statusText}`);
            }
            
            // Get operation location from response headers
            const operationLocation = submitResponse.headers.get('Operation-Location');
            if (!operationLocation) {
                throw new Error('No operation location returned from Document Intelligence');
            }
            
            // Poll for results
            let analysisResult = await this.pollDocumentIntelligenceResults(operationLocation);
            
            // Extract text from pages
            let extractedText = '';
            if (analysisResult.analyzeResult?.content) {
                extractedText = analysisResult.analyzeResult.content;
            }
            
            return extractedText || 'No text could be extracted from the document.';
            
        } catch (error) {
            console.error('Document Intelligence extraction error:', error);
            throw new Error(`Text extraction failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Poll Document Intelligence API for results
     */
    private async pollDocumentIntelligenceResults(operationLocation: string, maxAttempts: number = 30): Promise<any> {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await this.sleep(2000); // Wait 2 seconds between polls
            
            const response = await fetch(operationLocation, {
                method: 'GET',
                headers: {
                    'Ocp-Apim-Subscription-Key': this._documentIntelligenceKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Polling error: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.status === 'succeeded') {
                return result;
            } else if (result.status === 'failed') {
                throw new Error('Document Intelligence analysis failed');
            }
            // Continue polling if status is 'running' or 'notStarted'
        }
        
        throw new Error('Document Intelligence analysis timed out');
    }

    /**
     * Analyze document using Azure OpenAI
     */
    private async analyzeDocument(extractedText: string, filename: string): Promise<IDocumentAnalysis> {
        if (!this._azureEndpoint || !this._azureApiKey) {
            throw new Error("Azure OpenAI endpoint and API key must be configured");
        }
        
        const isImage = extractedText.includes('[Image document');
        let messages: any[];
        
        if (isImage && this._currentFile) {
            // Use vision capabilities for images
            const base64Image = await this.fileToBase64(this._currentFile);
            messages = [
                {
                    role: "system",
                    content: "You are an expert document analyst. Analyze documents and provide structured insights."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: this.getAnalysisPrompt(filename)
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: base64Image
                            }
                        }
                    ]
                }
            ];
        } else {
            // Text-based analysis
            messages = [
                {
                    role: "system",
                    content: "You are an expert document analyst. Analyze documents and provide structured insights."
                },
                {
                    role: "user",
                    content: `${this.getAnalysisPrompt(filename)}\n\nDocument Content:\n${extractedText}`
                }
            ];
        }
        
        const url = `${this._azureEndpoint}/openai/deployments/${this._deploymentName}/chat/completions?api-version=2024-02-15-preview`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this._azureApiKey
                },
                body: JSON.stringify({
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000,
                    response_format: { type: "json_object" }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Azure OpenAI API error: ${response.status} - ${errorData}`);
            }
            
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (!content) {
                throw new Error('No response from Azure OpenAI');
            }
            
            // Parse JSON response
            const analysis = JSON.parse(content);
            return this.parseAnalysisResponse(analysis);
            
        } catch (error) {
            console.error('Azure OpenAI analysis error:', error);
            throw new Error(`Document analysis failed: ${this.getErrorMessage(error)}`);
        }
    }

    /**
     * Get analysis prompt for Azure OpenAI
     */
    private getAnalysisPrompt(filename: string): string {
        return `Analyze the following document "${filename}" and provide a comprehensive analysis in JSON format with the following structure:

{
  "executiveSummary": "A concise 2-3 sentence summary of the document",
  "keyPoints": ["Point 1", "Point 2", "Point 3", ...],
  "risks": [
    {"level": "high|medium|low", "description": "Risk description"},
    ...
  ],
  "nextActions": ["Action 1", "Action 2", "Action 3", ...]
}

Focus on:
- Main themes and purpose
- Critical information and decisions
- Potential risks, concerns, or red flags
- Actionable next steps
- Important dates, deadlines, or commitments

Provide 3-5 key points, identify all significant risks with appropriate severity levels, and suggest 3-5 concrete next actions.`;
    }

    /**
     * Parse analysis response from Azure OpenAI
     */
    private parseAnalysisResponse(response: any): IDocumentAnalysis {
        return {
            executiveSummary: response.executiveSummary || response.executive_summary || "No summary available",
            keyPoints: response.keyPoints || response.key_points || [],
            risks: (response.risks || []).map((r: any) => ({
                level: r.level || 'medium',
                description: r.description || r.desc || String(r)
            })),
            nextActions: response.nextActions || response.next_actions || response.actions || []
        };
    }

    /**
     * Format summary for the bound field
     */
    private formatSummaryForField(analysis: IDocumentAnalysis): string {
        let summary = `EXECUTIVE SUMMARY:\n${analysis.executiveSummary}\n\n`;
        
        if (analysis.keyPoints.length > 0) {
            summary += `KEY POINTS:\n${analysis.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
        }
        
        if (analysis.risks.length > 0) {
            summary += `RISKS IDENTIFIED:\n${analysis.risks.map((r, i) => `${i + 1}. [${r.level.toUpperCase()}] ${r.description}`).join('\n')}\n\n`;
        }
        
        if (analysis.nextActions.length > 0) {
            summary += `NEXT ACTIONS:\n${analysis.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
        }
        
        return summary;
    }

    /**
     * Render processing state
     */
    private renderProcessingState(): void {
        const processingContainer = document.createElement("div");
        processingContainer.className = "processing-container";
        
        const fileName = this._currentFile?.name || "document";
        const steps = [
            "Creating attachment...",
            "Extracting text...",
            "Analyzing content with AI...",
            "Generating insights..."
        ];
        
        processingContainer.innerHTML = `
            <div class="processing-spinner"></div>
            <div class="processing-text">Processing ${fileName}</div>
            <div class="processing-subtext">This may take a moment...</div>
        `;
        
        this._container.appendChild(processingContainer);
    }

    /**
     * Render summary card
     */
    private renderSummaryCard(): void {
        if (!this._currentAnalysis) return;
        
        const analysis = this._currentAnalysis;
        
        // Summary Card
        const card = document.createElement("div");
        card.className = "summary-card";
        
        // Header
        const header = document.createElement("div");
        header.className = "summary-card-header";
        header.innerHTML = `
            <div>
                <h2 class="summary-card-title">📄 Document Analysis</h2>
                <div class="summary-card-metadata">${this._currentFile?.name || 'Document'} • ${new Date().toLocaleString()}</div>
            </div>
        `;
        card.appendChild(header);
        
        // Body
        const body = document.createElement("div");
        body.className = "summary-card-body";
        
        // Executive Summary
        body.innerHTML += `
            <div class="summary-section">
                <div class="summary-section-title">
                    <span class="summary-section-icon">📋</span>
                    Executive Summary
                </div>
                <div class="summary-section-content">${analysis.executiveSummary}</div>
            </div>
        `;
        
        // Key Points
        if (analysis.keyPoints.length > 0) {
            const keyPointsHtml = analysis.keyPoints.map(point => 
                `<li class="summary-list-item">${point}</li>`
            ).join('');
            
            body.innerHTML += `
                <div class="summary-section">
                    <div class="summary-section-title">
                        <span class="summary-section-icon">✨</span>
                        Key Points
                    </div>
                    <ul class="summary-list">${keyPointsHtml}</ul>
                </div>
            `;
        }
        
        // Risks
        if (analysis.risks.length > 0) {
            const risksHtml = analysis.risks.map(risk => 
                `<div class="risk-item risk-${risk.level}">${risk.description}</div>`
            ).join('');
            
            body.innerHTML += `
                <div class="summary-section">
                    <div class="summary-section-title">
                        <span class="summary-section-icon">⚠️</span>
                        Risks & Concerns
                    </div>
                    <div>${risksHtml}</div>
                </div>
            `;
        }
        
        // Next Actions
        if (analysis.nextActions.length > 0) {
            const actionsHtml = analysis.nextActions.map(action => 
                `<li class="summary-list-item">${action}</li>`
            ).join('');
            
            body.innerHTML += `
                <div class="summary-section">
                    <div class="summary-section-title">
                        <span class="summary-section-icon">🎯</span>
                        Next Actions
                    </div>
                    <ul class="summary-list">${actionsHtml}</ul>
                </div>
            `;
        }
        
        card.appendChild(body);
        
        // Action Buttons
        const buttons = document.createElement("div");
        buttons.className = "action-buttons";
        
        const regenerateBtn = this.createActionButton("🔄 Regenerate", () => this.regenerateAnalysis(), "primary");
        const translateBtn = this.createActionButton("🌍 Translate", () => this.translateSummary(), "secondary");
        const expandBtn = this.createActionButton("📝 Expand", () => this.expandSummary(), "secondary");
        const newDocBtn = this.createActionButton("➕ New Document", () => this.resetToInitial(), "secondary");
        
        buttons.appendChild(regenerateBtn);
        buttons.appendChild(translateBtn);
        buttons.appendChild(expandBtn);
        buttons.appendChild(newDocBtn);
        
        card.appendChild(buttons);
        this._container.appendChild(card);
    }

    /**
     * Create action button
     */
    private createActionButton(text: string, onClick: () => void, type: 'primary' | 'secondary'): HTMLButtonElement {
        const button = document.createElement("button");
        button.className = `action-button action-button-${type}`;
        button.textContent = text;
        button.addEventListener("click", onClick);
        return button;
    }

    /**
     * Regenerate analysis
     */
    private async regenerateAnalysis(): Promise<void> {
        if (!this._currentFile) return;
        
        this._currentState = ControlState.Processing;
        this.renderControl();
        
        try {
            const extractedText = this._currentAnalysis?.rawText || 
                                 await this.extractTextFromDocument(this._currentFile);
            
            const analysis = await this.analyzeDocument(extractedText, this._currentFile.name);
            
            this._currentAnalysis = analysis;
            this._documentSummary = this.formatSummaryForField(analysis);
            this._currentState = ControlState.DisplayingSummary;
            this._notifyOutputChanged();
            this.renderControl();
            
        } catch (error) {
            this.showError("Regeneration Error", this.getErrorMessage(error));
        }
    }

    /**
     * Translate summary to another language
     */
    private async translateSummary(): Promise<void> {
        // Prompt user for target language
        const language = prompt("Enter target language (e.g., Spanish, French, German):");
        if (!language || !this._currentAnalysis) return;
        
        this._currentState = ControlState.Processing;
        this.renderControl();
        
        try {
            const translatedAnalysis = await this.translateAnalysis(this._currentAnalysis, language);
            this._currentAnalysis = translatedAnalysis;
            this._documentSummary = this.formatSummaryForField(translatedAnalysis);
            this._currentState = ControlState.DisplayingSummary;
            this._notifyOutputChanged();
            this.renderControl();
            
        } catch (error) {
            this.showError("Translation Error", this.getErrorMessage(error));
        }
    }

    /**
     * Translate analysis using Azure OpenAI
     */
    private async translateAnalysis(analysis: IDocumentAnalysis, targetLanguage: string): Promise<IDocumentAnalysis> {
        const url = `${this._azureEndpoint}/openai/deployments/${this._deploymentName}/chat/completions?api-version=2024-02-15-preview`;
        
        const prompt = `Translate the following document analysis to ${targetLanguage}. Maintain the exact same JSON structure:

${JSON.stringify(analysis, null, 2)}

Return only the translated JSON, keeping all field names in English but translating all content values.`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this._azureApiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a professional translator." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Translation failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        return this.parseAnalysisResponse(JSON.parse(content));
    }

    /**
     * Expand summary with more detail
     */
    private async expandSummary(): Promise<void> {
        if (!this._currentFile || !this._currentAnalysis) return;
        
        this._currentState = ControlState.Processing;
        this.renderControl();
        
        try {
            const extractedText = this._currentAnalysis.rawText || 
                                 await this.extractTextFromDocument(this._currentFile);
            
            const expandedAnalysis = await this.expandAnalysis(extractedText, this._currentAnalysis);
            
            this._currentAnalysis = expandedAnalysis;
            this._documentSummary = this.formatSummaryForField(expandedAnalysis);
            this._currentState = ControlState.DisplayingSummary;
            this._notifyOutputChanged();
            this.renderControl();
            
        } catch (error) {
            this.showError("Expansion Error", this.getErrorMessage(error));
        }
    }

    /**
     * Expand analysis with more details
     */
    private async expandAnalysis(extractedText: string, currentAnalysis: IDocumentAnalysis): Promise<IDocumentAnalysis> {
        const url = `${this._azureEndpoint}/openai/deployments/${this._deploymentName}/chat/completions?api-version=2024-02-15-preview`;
        
        const prompt = `Based on this document content, expand the following analysis with more detail and depth. Add more key points, identify additional risks, and suggest more specific next actions:

Current Analysis:
${JSON.stringify(currentAnalysis, null, 2)}

Document Content:
${extractedText}

Provide an expanded analysis in the same JSON format with more comprehensive insights.`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this._azureApiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are an expert document analyst providing detailed insights." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 3000,
                response_format: { type: "json_object" }
            })
        });
        
        if (!response.ok) {
            throw new Error(`Expansion failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        return this.parseAnalysisResponse(JSON.parse(content));
    }

    /**
     * Reset to initial state for new document
     */
    private resetToInitial(): void {
        this._currentState = ControlState.Initial;
        this._currentAnalysis = null;
        this._currentFile = null;
        this.renderControl();
    }

    /**
     * Show error state
     */
    private showError(title: string, message: string): void {
        this._currentState = ControlState.Error;
        this._container.innerHTML = `
            <div class="error-container">
                <div class="error-title">❌ ${title}</div>
                <div class="error-message">${message}</div>
            </div>
            <button class="action-button action-button-secondary" style="margin-top: 16px;">
                ← Back to Upload
            </button>
        `;
        
        const backButton = this._container.querySelector('button');
        backButton?.addEventListener('click', () => this.resetToInitial());
    }

    /**
     * Render error state
     */
    private renderErrorState(): void {
        // Already handled in showError
    }

    /**
     * Helper: Convert file to base64
     */
    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Helper: Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Helper: Get error message from various error types
     */
    private getErrorMessage(error: any): string {
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        if (error?.message) return error.message;
        return 'An unknown error occurred';
    }

    /**
     * Get outputs for the bound field
     */
    public getOutputs(): IOutputs {
        return {
            documentSummary: this._documentSummary
        };
    }

    /**
     * Cleanup
     */
    public destroy(): void {
        // Cleanup event listeners and resources
        this._dropZone = null;
        this._fileInput = null;
    }
}
