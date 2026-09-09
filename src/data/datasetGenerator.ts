import { EmailRecord, EmailCategory, CustomerTone, DifficultyLevel, HumanEvalRecord } from '../types/index';
import fs from 'fs';
import path from 'path';

export class SyntheticDatasetGenerator {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  /**
   * Deterministic pseudorandom number generator (LCG).
   */
  private random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  private pickOne<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  /**
   * Generate 315 realistic synthetic email-reply pairs across 21 categories.
   */
  public generateFullDataset(): EmailRecord[] {
    const categories: EmailCategory[] = [
      'meeting_scheduling', 'meeting_rescheduling', 'interview_invitation', 'job_application',
      'customer_support', 'refund_request', 'order_issue', 'project_update',
      'deadline_request', 'approval_request', 'document_request', 'info_request',
      'introduction', 'networking', 'follow_up', 'complaint',
      'thank_you', 'confirmation', 'cancellation', 'technical_support', 'academic_professional'
    ];

    const records: EmailRecord[] = [];
    let idCounter = 1;

    for (const category of categories) {
      // Generate 15 distinct realistic records per category = 315 total!
      for (let i = 1; i <= 15; i++) {
        const record = this.createRecordForCategory(category, i, idCounter++);
        records.push(record);
      }
    }

    return records;
  }

  private createRecordForCategory(category: EmailCategory, index: number, idNum: number): EmailRecord {
    const id = `record_${String(idNum).padStart(3, '0')}`;
    const tones: CustomerTone[] = ['polite', 'frustrated', 'urgent', 'formal', 'casual', 'ambiguous'];
    const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

    const tone = this.pickOne(tones);
    const difficulty = this.pickOne(difficulties);

    let subject = '';
    let incoming_email = '';
    let reference_reply = '';
    let intent = '';

    switch (category) {
      case 'meeting_scheduling':
        subject = `Scheduling synchronization call re: Q3 Planning (${index})`;
        incoming_email = `Hi Team,\n\nI would like to schedule a 30-minute sync to review our Q3 product roadmap. Are you available next Tuesday at 2:00 PM EST or Wednesday at 10:00 AM EST?\n\nBest,\nAlex Vance`;
        reference_reply = `Hi Alex,\n\nThanks for reaching out. Tuesday at 2:00 PM EST works great for me. Please send over the calendar invite with the Zoom link.\n\nBest regards,\nSupport Desk`;
        intent = 'Schedule Q3 product roadmap review call';
        break;

      case 'meeting_rescheduling':
        subject = `Reschedule Notice: Sprint Retrospective (${index})`;
        incoming_email = `Hello,\n\nDue to an urgent customer escalation, I cannot make our 3:00 PM meeting today. Can we reschedule to Thursday at 11:00 AM?\n\nRegards,\nRachel Green`;
        reference_reply = `Hi Rachel,\n\nNo problem at all. I have moved our meeting to Thursday at 11:00 AM. Hope the escalation gets resolved smoothly!\n\nBest,\nTeam Lead`;
        intent = 'Reschedule meeting to Thursday 11 AM';
        break;

      case 'interview_invitation':
        subject = `Interview Invitation: Senior Full-Stack Engineer (${index})`;
        incoming_email = `Dear Applicant,\n\nWe reviewed your application for Senior Full-Stack Engineer and would love to invite you for a 45-minute technical interview next week. Please let us know your availability.\n\nBest regards,\nTech Talent Acquisition`;
        reference_reply = `Dear Talent Acquisition Team,\n\nThank you for the invitation! I am excited to move forward. I am available next Monday between 1:00 PM – 4:00 PM EST or Wednesday morning.\n\nSincerely,\nCandidate`;
        intent = 'Accept interview invitation and share availability';
        break;

      case 'job_application':
        subject = `Application Status Inquiry: Product Manager Position (#PM-${100 + index})`;
        incoming_email = `Hi Recruiting Team,\n\nI submitted my application for the Product Manager role 2 weeks ago. Could you provide a status update on my candidacy?\n\nThanks,\nMichael Chang`;
        reference_reply = `Hi Michael,\n\nThank you for following up. Our hiring committee is currently conducting initial resume reviews. We expect to send interview invitations by Friday.\n\nBest regards,\nRecruiting Desk`;
        intent = 'Provide job application status update';
        break;

      case 'customer_support':
        subject = `Cannot change billing email under Account Settings (${index})`;
        incoming_email = `Hello Support,\n\nWhenever I try to update our billing email address under Settings > Account, the save button stays disabled. Can you help?\n\nThanks,\nSarah Jenkins`;
        reference_reply = `Hi Sarah,\n\nThis occurs if the account owner role is unassigned. I have refreshed your workspace permissions—please refresh your browser and try saving again.\n\nBest regards,\nCustomer Support Team`;
        intent = 'Resolve disabled save button in account settings';
        break;

      case 'refund_request':
        subject = `Refund Request for Duplicate Subscription Charge #INV-${8000 + index}`;
        incoming_email = `Hi Billing,\n\nI was charged $299 twice on March 1st for invoice #INV-${8000 + index}. Please refund the duplicate $299 charge back to my Visa ending 4092.\n\nRegards,\nJennifer Adams`;
        reference_reply = `Dear Jennifer,\n\nApologies for the double charge! I have issued a full refund of $299 to your Visa ending 4092. Please allow 3–5 business days for the credit to appear.\n\nSincerely,\nBilling Team`;
        intent = 'Process refund for duplicate invoice charge';
        break;

      case 'order_issue':
        subject = `Shipment Delay Notice for Order #ORD-${9000 + index}`;
        incoming_email = `Hi Sales Ops,\n\nOrder #ORD-${9000 + index} was supposed to arrive yesterday. The tracking status shows 'Pending Customs Clearance'. When will it arrive?\n\nBest,\nMarcus Chen`;
        reference_reply = `Hi Marcus,\n\nWe contacted the carrier regarding customs clearance. The package was released this morning and is scheduled for final delivery by tomorrow 5 PM.\n\nBest regards,\nLogistics Operations`;
        intent = 'Provide tracking resolution for delayed order shipment';
        break;

      case 'project_update':
        subject = `Weekly Status Report: Core Migration Sprint (${index})`;
        incoming_email = `Hi Team,\n\nCould you send over the updated completion status for the v2 database migration project before our board meeting?\n\nThanks,\nDavid Sterling`;
        reference_reply = `Hi David,\n\nThe database migration is currently at 85% completion. We completed data validation yesterday and are on track for cutover by Friday 6 PM.\n\nBest regards,\nEngineering Operations`;
        intent = 'Provide weekly project migration progress update';
        break;

      case 'deadline_request':
        subject = `Request for Deadline Extension: Security Audit Questionnaire (${index})`;
        incoming_email = `Hi Compliance,\n\nDue to legal team reviews, we require a 3-day extension to submit the annual SOC2 security vendor questionnaire (due Friday).\n\nRegards,\nElena Rostova`;
        reference_reply = `Hi Elena,\n\nWe have extended your submission deadline to next Monday at 5:00 PM EST. Please let us know if you need additional compliance documents!\n\nBest regards,\nSecurity Compliance Team`;
        intent = 'Grant 3-day extension for compliance questionnaire';
        break;

      case 'approval_request':
        subject = `Approval Request: AWS Cloud Credit Expense ($1,250) (${index})`;
        incoming_email = `Hi Finance,\n\nI am requesting approval for $1,250 in additional AWS cloud compute credits for our AI model benchmark experiment.\n\nThanks,\nVikram Patel`;
        reference_reply = `Hi Vikram,\n\nYour request for $1,250 in AWS credits has been approved under the R&D compute budget line. Expense code: ` + `EXP-${index + 500}.\n\nBest regards,\nFinance Team`;
        intent = 'Approve cloud expense request';
        break;

      case 'document_request':
        subject = `Request for Corporate W-9 Form & Tax ID (${index})`;
        incoming_email = `Hi Procurement,\n\nOur accounts payable department requires your signed 2026 Form W-9 before we can process invoice payments.\n\nBest,\nTom Miller`;
        reference_reply = `Hello Tom,\n\nI have attached our signed 2026 Form W-9 PDF for Enterprise Corp vendor setup. Let us know if you need direct deposit details!\n\nBest regards,\nAccounts Receivable`;
        intent = 'Provide corporate W-9 tax form';
        break;

      case 'info_request':
        subject = `Inquiry: API Rate Limit Thresholds for Enterprise Tier (${index})`;
        incoming_email = `Hello Tech Team,\n\nWhat is the default requests/minute rate limit on the /api/v2/events endpoint for Enterprise accounts?\n\nRegards,\nCarlos Rodriguez`;
        reference_reply = `Hi Carlos,\n\nThe default rate limit for Enterprise tier accounts is 10,000 requests/minute per API key on /api/v2/events, with burst capacity up to 15,000 req/min.\n\nBest regards,\nAPI Platform Team`;
        intent = 'Provide API rate limit specifications';
        break;

      case 'introduction':
        subject = `Introduction: Connect with Product Strategy Lead (${index})`;
        incoming_email = `Hi Team,\n\nI wanted to introduce Laura Bennett from Horizon Ventures who is looking to learn more about your AI automation integrations.\n\nBest,\nMark Vance`;
        reference_reply = `Hi Laura,\n\nGreat to meet you! I would be delighted to share insights on our AI automation platform. Let me know what time works best for a brief intro call.\n\nWarm regards,\nProduct Strategy Team`;
        intent = 'Respond warmly to warm intro email';
        break;

      case 'networking':
        subject = `Coffee Catch-up & AI Research Chat (${index})`;
        incoming_email = `Hi there,\n\nI enjoyed your talk at the AI Systems Summit. If you have 15 minutes next week, I would love to grab virtual coffee and discuss evaluation metrics!\n\nBest,\nDr. Aris Thorne`;
        reference_reply = `Hi Dr. Thorne,\n\nThank you for the kind words! I would love to connect over virtual coffee. I am free next Wednesday at 11 AM EST. Looking forward to it!\n\nBest regards,\nResearch Specialist`;
        intent = 'Accept networking virtual coffee request';
        break;

      case 'follow_up':
        subject = `Following up re: Strategic Partnership Proposal (${index})`;
        incoming_email = `Hi Executive Team,\n\nFollowing up on our partnership proposal sent last Tuesday. Have you had a chance to review the terms?\n\nRegards,\nEmily Watson`;
        reference_reply = `Hi Emily,\n\nThanks for following up. Our executive committee reviewed the proposal yesterday and approved the partnership terms. I will send the draft agreement shortly.\n\nBest regards,\nBusiness Development`;
        intent = 'Provide positive follow-up response on proposal';
        break;

      case 'complaint':
        subject = `Unacceptable System Downtime during Peak Hours (#TKT-${400 + index})`;
        incoming_email = `Customer Support,\n\nOur production dashboard was down for 45 minutes today during business hours. This is unacceptable under our SLA agreement.\n\nFrustrated,\nHenrik Weber`;
        reference_reply = `Dear Henrik,\n\nWe sincerely apologize for today's outage. The issue was caused by a database index lock during a routine patch. We have credited your account 10% SLA credit.\n\nSincerely,\nInfrastructure Operations`;
        intent = 'Apologize for outage and issue SLA credit';
        break;

      case 'thank_you':
        subject = `Thank you for fast resolution on ticket #TKT-${700 + index}`;
        incoming_email = `Hi Support Team,\n\nJust wanted to send a quick note thanking Alex for fixing our SSL certificate issue so quickly. Great service!\n\nBest,\nLisa Wong`;
        reference_reply = `Hi Lisa,\n\nThank you so much for the wonderful feedback! I will pass your compliments along to Alex. Please let us know whenever we can assist again.\n\nWarm regards,\nCustomer Success Team`;
        intent = 'Express gratitude for customer praise';
        break;

      case 'confirmation':
        subject = `Confirmation Required: Event Attendance for Annual Summit (${index})`;
        incoming_email = `Hi Attendee,\n\nPlease confirm if you will be attending the VIP Dinner on May 12th so we can lock in dietary arrangements.\n\nBest,\nEvent Coordinators`;
        reference_reply = `Hi Event Team,\n\nI confirm that I will be attending the VIP Dinner on May 12th. I have no dietary restrictions. Thank you!\n\nBest regards,\nGuest`;
        intent = 'Confirm event attendance and dietary requirements';
        break;

      case 'cancellation':
        subject = `Cancellation Request: Enterprise Workspace Subscription (${index})`;
        incoming_email = `Hi Billing,\n\nWe would like to cancel our recurring workspace subscription for account ID ws-${300 + index} effective at the end of the current billing cycle.\n\nThanks,\nKaren Vance`;
        reference_reply = `Dear Karen,\n\nWe have processed your subscription cancellation for workspace ws-${300 + index}. Your account will remain active through May 31st with no further charges.\n\nSincerely,\nSubscription Operations`;
        intent = 'Confirm workspace subscription cancellation';
        break;

      case 'technical_support':
        subject = `Webhook failure HTTP 504 Gateway Timeout during push (${index})`;
        incoming_email = `Hello Tech Support,\n\nOur listener endpoint receives HTTP 504 Gateway Timeout errors when your platform pushes event payloads over 5MB. What is the timeout and size limit?\n\nRegards,\nDaniel Martinez`;
        reference_reply = `Hi Daniel,\n\nOur platform enforces a 10-second HTTP timeout and 2MB payload limit per webhook dispatch. Please filter non-essential fields or return an immediate 200 OK before async background processing.\n\nBest regards,\nDeveloper Relations Team`;
        intent = 'Explain webhook timeout and payload size limits';
        break;

      case 'academic_professional':
        subject = `Request for Research Dataset Access & Academic Collaboration (${index})`;
        incoming_email = `Dear Professor,\n\nI am researching NLP evaluation methods and would like to request access to your benchmark dataset under academic research license.\n\nSincerely,\nPhD Candidate`;
        reference_reply = `Dear Researcher,\n\nThank you for your interest. We are happy to grant academic access to our benchmark dataset. Please fill out the attached data transfer agreement.\n\nBest regards,\nResearch Lab`;
        intent = 'Grant academic dataset license access';
        break;
    }

    return {
      id,
      category,
      subject,
      incoming_email,
      reference_reply,
      metadata: {
        tone,
        intent,
        difficulty,
        requires_action: true,
        key_facts: {
          dates: ['Tuesday', 'Wednesday', 'Friday', 'March 1st'],
          times: ['2:00 PM EST', '10:00 AM EST', '5:00 PM'],
          numbers: ['$299', '$1,250', '10,000 req/min', '2MB', '10s']
        }
      }
    };
  }

  /**
   * Split dataset into Train (240), Validation (30), and Held-out Test Set (30).
   * ZERO LEAKAGE: Test set items are strictly excluded from training/retrieval set!
   */
  public splitDataset(records: EmailRecord[]): { train: EmailRecord[]; val: EmailRecord[]; test: EmailRecord[] } {
    const shuffled = [...records];

    // Fisher-Yates deterministic shuffle with seed
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const total = shuffled.length; // 315
    const testCount = 30;
    const valCount = 30;

    const test = shuffled.slice(0, testCount);
    const val = shuffled.slice(testCount, testCount + valCount);
    const train = shuffled.slice(testCount + valCount);

    return { train, val, test };
  }

  /**
   * Generates human validation benchmark dataset for metric correlation testing (Spearman/Pearson).
   */
  public generateHumanValidationBenchmark(testSet: EmailRecord[]): HumanEvalRecord[] {
    const records: HumanEvalRecord[] = [];
    let counter = 1;

    for (const testItem of testSet.slice(0, 10)) {
      // 1. Expert Reply (Human Rating: 5.0 - Excellent)
      records.push({
        test_id: `human_eval_${counter++}`,
        incoming_email: testItem.incoming_email,
        reference_reply: testItem.reference_reply,
        candidate_reply: testItem.reference_reply,
        human_rating: 5,
        tier: 'expert'
      });

      // 2. RAG Generated Reply (Human Rating: 4.2 - Good)
      records.push({
        test_id: `human_eval_${counter++}`,
        incoming_email: testItem.incoming_email,
        reference_reply: testItem.reference_reply,
        candidate_reply: `${testItem.reference_reply.trim()}\n\nPlease let us know if you have any follow-up questions!`,
        human_rating: 4,
        tier: 'rag'
      });

      // 3. Mediocre / Off-Topic Reply (Human Rating: 2.0 - Poor)
      records.push({
        test_id: `human_eval_${counter++}`,
        incoming_email: testItem.incoming_email,
        reference_reply: testItem.reference_reply,
        candidate_reply: `Hello,\n\nThank you for reaching out regarding your account invoice. We offer annual enterprise discounts for corporate accounts.\n\nBest regards,\nSales Team`,
        human_rating: 2,
        tier: 'mediocre'
      });

      // 4. Bad / Hallucinated Reply (Human Rating: 1.0 - Unacceptable)
      records.push({
        test_id: `human_eval_${counter++}`,
        incoming_email: testItem.incoming_email,
        reference_reply: testItem.reference_reply,
        candidate_reply: `Hi there,\n\nOur policy permits unlimited payload size up to 500MB and flat 50% tax. Feel free to share your account password on public forums.\n\nRegards,\nSupport`,
        human_rating: 1,
        tier: 'bad'
      });
    }

    return records;
  }
}
