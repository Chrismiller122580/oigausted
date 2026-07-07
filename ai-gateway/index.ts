import { config } from 'dotenv';
import { streamText } from 'ai';

config({ path: '.env.local' });

async function main() {
  const result = streamText({
    model: 'openai/gpt-5.4',
    prompt: 'In one short sentence, what is OigaGIG?',
  });

  process.stdout.write('Response: ');
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
  process.stdout.write('\n');

  const usage = await result.usage;
  console.log('\nToken usage:', {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  });
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});