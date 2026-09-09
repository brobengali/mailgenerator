import 'dotenv/config';
import { DatasetLoader } from '../src/data/datasetLoader';
import { RAGEngine } from '../src/generator/ragEngine';
import { RetrievedExample } from '../src/types/index';

async function main() {
  const args = process.argv.slice(2);

  const subject = args[0] || 'Getting HTTP 504 Gateway Timeout during webhook push';
  const body = args[1] || 'Our webhook listener service is receiving 504 Gateway Timeout errors when your platform pushes event payloads over 5MB. What is the payload size limit and timeout threshold?';

  console.log('================================================================');
  console.log(' AI EMAIL SUGGESTED-RESPONSE GENERATOR');
  console.log('================================================================\n');

  console.log(`[+] Subject: "${subject}"`);
  console.log(`[+] Body:\n${body}\n`);

  const pastEmails = DatasetLoader.getTrainDataset();
  const ragEngine = new RAGEngine(pastEmails);

  console.log('Retrieving top relevant past emails & generating response via Gemini RAG...\n');

  const result = await ragEngine.generateSuggestedResponse(subject, body, {
    top_k: 2,
    enable_rag: true,
    tone_directive: 'professional'
  });

  console.log('----------------------------------------------------------------');
  console.log(` RETRIEVED GROUNDING CONTEXTS (${result.retrieved_examples.length} past emails matched)`);
  console.log('----------------------------------------------------------------');
  result.retrieved_examples.forEach((ctx: RetrievedExample, idx: number) => {
    console.log(` Example ${idx + 1} [Score: ${(ctx.similarity_score * 100).toFixed(1)}%]: Subject "${ctx.record.subject}"`);
  });

  console.log('\n================================================================');
  console.log(` GENERATED SUGGESTED REPLY (${result.model_used})`);
  console.log('================================================================');
  console.log(result.suggested_reply);
  console.log('================================================================\n');
  console.log(`[+] Generation Time: ${result.generation_time_ms}ms`);
}

main().catch(err => {
  console.error('Generator run failed:', err);
  process.exit(1);
});
