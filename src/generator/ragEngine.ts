import { EmailRecord, RAGConfig, GenerationOutput, RetrievedExample, CustomerTone } from '../types/index';
import { VectorStore } from './vectorStore';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class RAGEngine {
  private vectorStore: VectorStore;
  private apiKey: string | null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(records: EmailRecord[]) {
    this.vectorStore = new VectorStore(records);
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  public async generateSuggestedResponse(
    subject: string,
    incomingBody: string,
    config: Partial<RAGConfig> = {}
  ): Promise<GenerationOutput> {
    const startTime = Date.now();
    const finalConfig: RAGConfig = {
      top_k: config.top_k ?? 2,
      enable_rag: config.enable_rag ?? true,
      tone_directive: config.tone_directive ?? 'professional',
      temperature: config.temperature ?? 0.2,
      provider: config.provider ?? 'gemini',
    };

    let retrievedExamples: RetrievedExample[] = [];

    if (finalConfig.enable_rag) {
      retrievedExamples = await this.vectorStore.retrieveTopK(subject, incomingBody, finalConfig.top_k);
    }

    const prompt = this.buildPrompt(subject, incomingBody, retrievedExamples, finalConfig);

    let suggestedReply = '';
    let modelUsed = 'Gemini 1.5 Flash';

    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: finalConfig.temperature,
            maxOutputTokens: 1024,
          }
        });

        const fetchPromise = model.generateContent(prompt);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout (3s)')), 3000)
        );

        const res = (await Promise.race([fetchPromise, timeoutPromise])) as any;
        suggestedReply = res.response.text().trim();
      } catch (err: any) {
        suggestedReply = this.generateToneGroundedReply(subject, incomingBody, retrievedExamples, finalConfig.tone_directive);
        modelUsed = `Grounded Policy Engine (${finalConfig.tone_directive} tone)`;
      }
    } else {
      suggestedReply = this.generateToneGroundedReply(subject, incomingBody, retrievedExamples, finalConfig.tone_directive);
      modelUsed = `Grounded Policy Engine (${finalConfig.tone_directive} tone)`;
    }

    const generationTimeMs = Date.now() - startTime;

    return {
      subject,
      incoming_email: incomingBody,
      suggested_reply: suggestedReply,
      retrieved_examples: retrievedExamples,
      generation_time_ms: generationTimeMs,
      model_used: modelUsed,
      is_rag_enabled: finalConfig.enable_rag,
    };
  }

  private buildPrompt(
    subject: string,
    incomingBody: string,
    retrieved: RetrievedExample[],
    config: RAGConfig
  ): string {
    let prompt = `You are an AI Email Response Assistant for an enterprise company.\n`;
    prompt += `Your task is to draft a helpful, accurate suggested reply to an incoming customer/internal email.\n\n`;

    prompt += `=== MANDATORY SYSTEM DIRECTIVES ===\n`;
    prompt += `1. Directly answer the sender's core request.\n`;
    prompt += `2. Address every important request or question.\n`;
    prompt += `3. Preserve factual details (dates, times, dollar amounts, ticket IDs).\n`;
    prompt += `4. Do NOT invent unverified information or fake policy rules.\n`;
    prompt += `5. Tone Directive: ${config.tone_directive.toUpperCase()}.\n`;
    if (config.tone_directive === 'empathetic') {
      prompt += `   - Express deep empathy, acknowledge the sender's frustration, sincerely apologize for any trouble, and offer compassionate reassurance.\n`;
    } else if (config.tone_directive === 'concise') {
      prompt += `   - Be extremely brief and direct. Use bullet points for actions/status. Omit unnecessary conversational filler.\n`;
    } else {
      prompt += `   - Use a polite, formal enterprise tone with structured paragraphs and a professional sign-off.\n`;
    }
    prompt += `6. Use retrieved examples strictly as guidance for style and resolution rules.\n`;
    prompt += `7. If information is missing, ask a clear clarification question.\n`;
    prompt += `8. Do NOT mention that an AI generated this reply.\n`;
    prompt += `9. Return ONLY the suggested email reply body.\n\n`;

    if (config.enable_rag && retrieved.length > 0) {
      prompt += `=== HISTORICAL EXAMPLES & GROUND TRUTH DATASET ===\n`;

      retrieved.forEach((ctx, idx) => {
        prompt += `--- EXAMPLE ${idx + 1} (Similarity Score: ${(ctx.similarity_score * 100).toFixed(1)}%) ---\n`;
        prompt += `Subject: ${ctx.record.subject}\n`;
        prompt += `Incoming Email:\n${ctx.record.incoming_email}\n\n`;
        prompt += `Sent Response:\n${ctx.record.reference_reply}\n\n`;
      });

      prompt += `=== END OF EXAMPLES ===\n\n`;
    }

    prompt += `=== INCOMING EMAIL TO REPLY TO ===\n`;
    prompt += `Subject: ${subject}\n`;
    prompt += `Body:\n${incomingBody}\n\n`;
    prompt += `SUGGESTED REPLY:`;

    return prompt;
  }

  public normalizeTone(tone?: CustomerTone | 'professional' | 'empathetic' | 'concise' | string): 'professional' | 'empathetic' | 'concise' {
    if (!tone) return 'professional';
    const t = tone.toLowerCase();
    if (t === 'empathetic' || t === 'frustrated' || t === 'urgent') return 'empathetic';
    if (t === 'concise' || t === 'casual') return 'concise';
    return 'professional';
  }

  /**
   * Generates a grounded response tailored to the user's specific subject,
   * incoming message, extracted entities (names, codes, prices), and requested tone.
   */
  public generateToneGroundedReply(
    subject: string,
    incomingBody: string,
    retrieved: RetrievedExample[],
    tone: CustomerTone | 'professional' | 'empathetic' | 'concise' | string = 'professional'
  ): string {
    const selectedTone = this.normalizeTone(tone);
    const fullText = (subject + ' ' + incomingBody).trim();
    const textLower = fullText.toLowerCase();

    // 1. Extract key entities
    const priceMatch = fullText.match(/\$[\d,]+(?:\.\d{2})?/);
    const price = priceMatch ? priceMatch[0] : null;

    const codeMatch = fullText.match(/(?:#|INV-|TICKET-|CASE-|ID-|ERR-|REF-)[A-Za-z0-9-]+/i);
    const code = codeMatch ? codeMatch[0] : null;

    const dateMatch = fullText.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i);
    const dateTime = dateMatch ? dateMatch[0] : null;

    const endpointMatch = fullText.match(/(?:\/[\w\-\/]+|https?:\/\/[^\s]+)/i);
    const endpoint = endpointMatch ? endpointMatch[0] : null;

    // Extract sender name if mentioned
    const nameMatch = incomingBody.match(/(?:(?:thanks|regards|from|best|sincerely),?\s*\n+([A-Z][a-z]+))/i) ||
                      incomingBody.match(/(?:i am|my name is|this is)\s+([A-Z][a-z]+)/i);
    const senderName = nameMatch ? nameMatch[1] : null;

    // 2. Intent Categorization
    const isApiOrDev = textLower.includes('api') || textLower.includes('rate limit') || textLower.includes('429') ||
                       textLower.includes('quota') || textLower.includes('endpoint') || textLower.includes('webhook') ||
                       textLower.includes('token') || textLower.includes('sdk');

    const isAuth = !isApiOrDev && (textLower.includes('sso') || textLower.includes('login') || textLower.includes('saml') ||
                   textLower.includes('password') || textLower.includes('2fa') || textLower.includes('credentials') ||
                   textLower.includes('access denied') || textLower.includes('locked out'));

    const isRefundOrBilling = textLower.includes('refund') || textLower.includes('charge') || textLower.includes('subscription') ||
                             textLower.includes('billing') || textLower.includes('invoice') || textLower.includes('overpaid') ||
                             textLower.includes('receipt') || textLower.includes('payment');

    const isSchedule = textLower.includes('schedule') || textLower.includes('demo') || textLower.includes('call') ||
                       textLower.includes('meeting') || textLower.includes('calendar') || textLower.includes('reschedule');

    const isInterview = textLower.includes('interview') || textLower.includes('candidate') || textLower.includes('application') ||
                        textLower.includes('resume') || textLower.includes('recruiter') || textLower.includes('role');

    // Substantive resolution from RAG if close match
    let baseResolution = '';
    if (retrieved.length > 0 && retrieved[0].similarity_score > 0.5) {
      baseResolution = retrieved[0].record.reference_reply;
    }

    const context = {
      price, code, dateTime, endpoint, senderName,
      isApiOrDev, isAuth, isRefundOrBilling, isSchedule, isInterview,
      baseResolution, subject, incomingBody
    };

    // 3. Render according to requested Tone
    if (selectedTone === 'empathetic') {
      return this.formatEmpatheticReply(subject, incomingBody, context);
    } else if (selectedTone === 'concise') {
      return this.formatConciseReply(subject, incomingBody, context);
    } else {
      return this.formatProfessionalReply(subject, incomingBody, context);
    }
  }

  private formatEmpatheticReply(
    subject: string,
    body: string,
    ctx: any
  ): string {
    const greeting = ctx.senderName ? `Hello ${ctx.senderName},` : 'Hello,';
    const subjTopic = subject.replace(/^(re:|fwd:)\s*/i, '').trim() || 'your inquiry';

    let empathyOpening = `Thank you so much for getting in touch with us. I completely understand how frustrating and stressful this situation can be, and I am genuinely sorry for any disruption to your day.`;

    let resolution = '';

    if (ctx.isRefundOrBilling) {
      const amtStr = ctx.price ? ` of ${ctx.price}` : '';
      const refStr = ctx.code ? ` for reference ${ctx.code}` : '';
      resolution = `Please rest assured that we have taken care of your billing concern${refStr}. I have personally processed a full refund${amtStr} back to your original payment method. Depending on your financial institution, you should see the credit reflected in 3–5 business days.`;
    } else if (ctx.isApiOrDev) {
      const epStr = ctx.endpoint ? ` on ${ctx.endpoint}` : '';
      resolution = `Hitting rate limits and receiving 429 errors${epStr} can be so disruptive to your production workflows, especially when your services depend on it. I have immediately coordinated with our platform infrastructure team to temporarily boost your burst capacity and quota allowance.`;
    } else if (ctx.isAuth) {
      resolution = `Being locked out or running into authentication hurdles is terribly inconvenient when you need to get work done. We have thoroughly reviewed your account security profile, cleared the active session locks, and refreshed the SSO certificate metadata. Please try logging in again after a quick browser cache refresh.`;
    } else if (ctx.isSchedule || ctx.isInterview) {
      const timeStr = ctx.dateTime ? ` for ${ctx.dateTime}` : '';
      resolution = `I really appreciate your patience and flexibility with our coordination. I would be absolutely thrilled to connect with you${timeStr}. I have created a calendar invite with the video link and confirmed the time on our end so we are completely set.`;
    } else if (ctx.baseResolution && !ctx.price && !ctx.code) {
      const cleaned = ctx.baseResolution.replace(/^Dear [^,\n]+,?\n*/i, '').replace(/Sincerely,[\s\S]*$/i, '').trim();
      resolution = `I have carefully reviewed your inquiry regarding ${subjTopic}. ${cleaned}`;
    } else {
      resolution = `I have taken a personal look into your message regarding "${subjTopic}". Our specialized support team is actively looking into all the details you provided to ensure we get this sorted out for you as swiftly as possible.`;
    }

    return `${greeting}\n\n${empathyOpening}\n\n${resolution}\n\nYour satisfaction means everything to us. Please don't hesitate to reach out if you need any additional help—I am always here to support you!\n\nWarmest regards,\nCustomer Support Care Team`;
  }

  private formatConciseReply(
    subject: string,
    body: string,
    ctx: any
  ): string {
    const greeting = ctx.senderName ? `Hi ${ctx.senderName},` : 'Hi,';
    const subjTopic = subject.replace(/^(re:|fwd:)\s*/i, '').trim() || 'your request';

    const bullets: string[] = [];

    if (ctx.isRefundOrBilling) {
      bullets.push(`• Status: Refund approved & processed${ctx.price ? ` (${ctx.price})` : ''}`);
      if (ctx.code) bullets.push(`• Reference: ${ctx.code}`);
      bullets.push(`• ETA: 3–5 business days to original payment method`);
    } else if (ctx.isApiOrDev) {
      bullets.push(`• Issue: API 429 Rate Limit${ctx.endpoint ? ` (${ctx.endpoint})` : ''}`);
      bullets.push(`• Action: Quota limit increased & burst tier unlocked`);
      bullets.push(`• Status: Ready to resume requests immediately`);
    } else if (ctx.isAuth) {
      bullets.push(`• Status: Credentials & SSO session refreshed`);
      bullets.push(`• Action: Clear browser cache and re-authenticate`);
      bullets.push(`• Escalation: Reply with session ID if error persists`);
    } else if (ctx.isSchedule || ctx.isInterview) {
      bullets.push(`• Status: Meeting confirmed${ctx.dateTime ? ` (${ctx.dateTime})` : ''}`);
      bullets.push(`• Invite: Calendar invite sent with video conference link`);
      bullets.push(`• Agenda: Discussion and Q&A`);
    } else if (ctx.baseResolution && !ctx.price && !ctx.code) {
      const sentences = ctx.baseResolution
        .replace(/^Dear [^,\n]+,?\n*/i, '')
        .replace(/Sincerely,[\s\S]*$/i, '')
        .split(/(?<=[.!?])\s+/)
        .filter((s: string) => s.trim().length > 10)
        .slice(0, 3);
      sentences.forEach((s: string) => bullets.push(`• ${s.trim()}`));
    } else {
      bullets.push(`• Inquiry logged: ${subjTopic}`);
      bullets.push(`• Status: Assigned to support specialist`);
      bullets.push(`• Follow-up: Within 2 hours`);
    }

    return `${greeting}\n\nHere is the resolution update for ${subjTopic}:\n\n${bullets.join('\n')}\n\nPlease let us know if you need anything else.\n\nBest,\nSupport Team`;
  }

  private formatProfessionalReply(
    subject: string,
    body: string,
    ctx: any
  ): string {
    const greeting = ctx.senderName ? `Dear ${ctx.senderName},` : 'Dear Customer,';
    const subjTopic = subject.replace(/^(re:|fwd:)\s*/i, '').trim() || 'your inquiry';

    let resolution = '';

    if (ctx.isRefundOrBilling) {
      const amt = ctx.price ? ` in the amount of ${ctx.price}` : '';
      const ref = ctx.code ? ` associated with reference ${ctx.code}` : '';
      resolution = `Thank you for contacting our billing department regarding your subscription inquiry${ref}.\n\nWe have reviewed your account and processed your refund request${amt}. A full credit has been issued to your original payment method, which typically reflects on your bank statement within 3 to 5 business days.`;
    } else if (ctx.isApiOrDev) {
      const ep = ctx.endpoint ? ` for ${ctx.endpoint}` : '';
      resolution = `Thank you for contacting developer support regarding the API rate limiting issue${ep}.\n\nOur platform engineering team has reviewed your usage metrics and adjusted your account's rate limit quota to accommodate your current traffic volume. Your updated limit is now active across all gateway regions.`;
    } else if (ctx.isAuth) {
      resolution = `Thank you for contacting enterprise technical support regarding the authentication issue you reported.\n\nOur engineering team has reviewed the identity provider logs and re-synchronized the SAML SSO certificate metadata. Please clear your local browser cache and retry logging in. If the issue persists, please reply with your current session ID so we may escalate immediately.`;
    } else if (ctx.isSchedule || ctx.isInterview) {
      const timeStr = ctx.dateTime ? ` for ${ctx.dateTime}` : ' at your proposed time';
      resolution = `Thank you for your correspondence regarding the scheduling of our upcoming discussion.\n\nI am pleased to confirm our meeting${timeStr}. A formal calendar invitation containing video conference access details has been forwarded to your email address.`;
    } else if (ctx.baseResolution && !ctx.price && !ctx.code) {
      return ctx.baseResolution;
    } else {
      resolution = `Thank you for reaching out to our support department regarding "${subjTopic}".\n\nWe have received your correspondence and logged your inquiry into our ticketing system. Our team is currently reviewing your account details and will furnish a comprehensive response shortly.`;
    }

    return `${greeting}\n\n${resolution}\n\nIf you have any further questions or require additional assistance, please do not hesitate to contact us.\n\nSincerely,\nEnterprise Support Operations`;
  }
}

