import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, it } from 'vitest';

const subconsciousDir = fileURLToPath(new URL('../subconscious/', import.meta.url));
const remindSource = readFileSync(`${subconsciousDir}/remind.ts`, 'utf8');
const requestStateSource = readFileSync(`${subconsciousDir}/remind-request-state.ts`, 'utf8');

function expectArchitecture(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

it('native transport: multiple questions are never attributed through one reminder run', () => {
  expectArchitecture(
    !requestStateSource.includes('associateRun(') && !requestStateSource.includes('pendingForRun('),
    'registry/run attribution still owns question completion instead of direct correlated signals',
  );
});

it('native transport: terminal replies are sent directly before reminder run finish', () => {
  const replyTool = remindSource.slice(
    remindSource.indexOf('function createReplyTool'),
    remindSource.indexOf('function createReminderAgent'),
  );
  expectArchitecture(
    replyTool.includes('.sendSignal('),
    'missing direct signal: reply_to_memory_question still settles the registry instead of signaling the source conversation',
  );
});

it('native transport: active source delivery uses the bound source Agent', () => {
  expectArchitecture(
    remindSource.includes('sourceAgent.sendSignal('),
    'wrong Agent identity: terminal delivery is not bound to the source Agent instance',
  );
});

it('native transport: idle source delivery can wake through the bound source Agent', () => {
  expectArchitecture(
    remindSource.includes('ifIdle: { streamOptions:'),
    'missing direct signal idle wake: source delivery does not provide the source Agent idle-thread wake contract',
  );
});

it('native transport: source conversation consumes a correlated reactive signal end to end', () => {
  expectArchitecture(
    remindSource.includes('id: `remind-answer:${correlationId}:terminal`') && remindSource.includes("type: 'reactive'"),
    'missing direct signal contract: deterministic correlated terminal signal id is absent',
  );
});

it('native transport: passive reminders and questions enter through the same conversation API', () => {
  expectArchitecture(
    !remindSource.includes('.queueMessage('),
    'wrong Agent ingress: passive reminder work still uses queueMessage instead of reminder Agent sendMessage',
  );
});

it('native transport: reply tooling is scoped to current question input rather than every reminder Agent', () => {
  const agentFactory = remindSource.slice(
    remindSource.indexOf('function createReminderAgent'),
    remindSource.indexOf('interface ReminderLaneTurnArgs'),
  );
  expect(
    agentFactory,
    'wrong Agent identity: reply tool is still statically installed on passive reminder Agents',
  ).not.toContain('reply_to_memory_question');
});
