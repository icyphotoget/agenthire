/**
 * AgentHire — Job Dispatcher
 * ============================================================
 * Supabase Edge Function (Deno runtime) that:
 *   1. Validates the incoming task request
 *   2. Decrypts the client's API key from the DB
 *   3. Spawns an isolated sandbox (via E2B or Docker) with the
 *      agent's manifest injected
 *   4. Streams the agent run and writes results back to Supabase
 *   5. Enforces token budgets and hard timeouts
 *
 * Deploy: supabase functions deploy job-dispatcher
 * ============================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3';
import OpenAI from 'https://esm.sh/openai@4.47.1';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const MAX_TASK_DURATION_MS = 5 * 60 * 1000; // 5 minutes hard ceiling
const MAX_TOOL_CALLS = 50; // prevent infinite tool loops
const ENCRYPTION_KEY = Deno.env.get('AES_ENCRYPTION_KEY')!; // 32-byte hex
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Service-role client — bypasses RLS for internal writes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface DispatchRequest {
  contract_id: string;
  input_payload: Record<string, unknown>;
  webhook_url?: string;
}

interface ContractRow {
  id: string;
  agent_id: string;
  client_id: string;
  vendor_id: string;
  client_provider: 'openai' | 'anthropic';
  client_key_enc: string;
  max_tokens_per_day: number;
  tokens_used_today: number;
  allowed_tools: string[] | null;
  environment_vars: Record<string, string>;
  status: string;
  agents: AgentRow;
}

interface AgentRow {
  id: string;
  name: string;
  system_prompt: string;
  tools: ToolDefinition[];
  model_id: string;
  max_context_tokens: number;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface TaskResult {
  output_payload: Record<string, unknown>;
  tool_calls: unknown[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  duration_ms: number;
}

// ─────────────────────────────────────────────
// Crypto helpers  (AES-GCM, 256-bit)
// ─────────────────────────────────────────────
async function decryptApiKey(ciphertextB64: string): Promise<string> {
  const raw = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const keyBytes = Uint8Array.from(Buffer.from(ENCRYPTION_KEY, 'hex'));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data,
  );
  return new TextDecoder().decode(decrypted);
}

async function encryptApiKey(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyBytes = Uint8Array.from(Buffer.from(ENCRYPTION_KEY, 'hex'));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    enc.encode(plaintext),
  );
  const merged = new Uint8Array(12 + ciphertext.byteLength);
  merged.set(iv, 0);
  merged.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...merged));
}

// ─────────────────────────────────────────────
// Guard: enforce daily token budget
// ─────────────────────────────────────────────
function assertTokenBudget(contract: ContractRow): void {
  const remaining = contract.max_tokens_per_day - contract.tokens_used_today;
  if (remaining <= 0) {
    throw new Error(
      `Daily token budget exhausted for contract ${contract.id}. ` +
        `Limit: ${contract.max_tokens_per_day.toLocaleString()} tokens.`,
    );
  }
}

// ─────────────────────────────────────────────
// Tool filtering: only expose tools the client approved
// ─────────────────────────────────────────────
function filterTools(
  agentTools: ToolDefinition[],
  allowedTools: string[] | null,
): ToolDefinition[] {
  if (!allowedTools || allowedTools.length === 0) return agentTools;
  return agentTools.filter((t) => allowedTools.includes(t.name));
}

// ─────────────────────────────────────────────
// LLM Runner — Anthropic (Claude)
// ─────────────────────────────────────────────
async function runWithAnthropic(
  apiKey: string,
  agent: AgentRow,
  tools: ToolDefinition[],
  inputPayload: Record<string, unknown>,
): Promise<TaskResult> {
  const client = new Anthropic({ apiKey });
  const startTime = Date.now();
  const toolCalls: unknown[] = [];
  let promptTokens = 0;
  let completionTokens = 0;

  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters,
  }));

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: JSON.stringify(inputPayload) },
  ];

  let iterCount = 0;
  let finalText = '';

  while (iterCount < MAX_TOOL_CALLS) {
    iterCount++;
    const response = await client.messages.create({
      model: agent.model_id,
      max_tokens: Math.min(4096, agent.max_context_tokens),
      system: agent.system_prompt,
      tools: anthropicTools as Anthropic.Tool[],
      messages,
    });

    promptTokens += response.usage.input_tokens;
    completionTokens += response.usage.output_tokens;

    if (response.stop_reason === 'end_turn') {
      finalText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as Anthropic.TextBlock).text)
        .join('');
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b) => b.type === 'tool_use',
      ) as Anthropic.ToolUseBlock[];

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUseBlocks) {
        const toolResult = await executeTool(
          tu.name,
          tu.input as Record<string, unknown>,
        );
        toolCalls.push({
          tool: tu.name,
          input: tu.input,
          output: toolResult,
          duration_ms: Date.now() - startTime,
        });
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: JSON.stringify(toolResult),
        });
      }

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }

  const totalTokens = promptTokens + completionTokens;
  return {
    output_payload: { text: finalText, iterations: iterCount },
    tool_calls: toolCalls,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost_usd: calculateCost(
      'anthropic',
      agent.model_id,
      promptTokens,
      completionTokens,
    ),
    duration_ms: Date.now() - startTime,
  };
}

// ─────────────────────────────────────────────
// LLM Runner — OpenAI
// ─────────────────────────────────────────────
async function runWithOpenAI(
  apiKey: string,
  agent: AgentRow,
  tools: ToolDefinition[],
  inputPayload: Record<string, unknown>,
): Promise<TaskResult> {
  const client = new OpenAI({ apiKey });
  const startTime = Date.now();
  const toolCalls: unknown[] = [];
  let promptTokens = 0;
  let completionTokens = 0;

  const openaiTools: OpenAI.Chat.ChatCompletionTool[] = tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: agent.system_prompt },
    { role: 'user', content: JSON.stringify(inputPayload) },
  ];

  let iterCount = 0;
  let finalText = '';

  while (iterCount < MAX_TOOL_CALLS) {
    iterCount++;
    const response = await client.chat.completions.create({
      model: agent.model_id,
      messages,
      tools: openaiTools.length > 0 ? openaiTools : undefined,
      tool_choice: openaiTools.length > 0 ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    promptTokens += response.usage?.prompt_tokens ?? 0;
    completionTokens += response.usage?.completion_tokens ?? 0;

    if (
      choice.finish_reason === 'stop' ||
      !choice.message.tool_calls?.length
    ) {
      finalText = choice.message.content ?? '';
      break;
    }

    messages.push(choice.message);

    const results: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];
    for (const tc of choice.message.tool_calls!) {
      const args = JSON.parse(tc.function.arguments);
      const result = await executeTool(tc.function.name, args);
      toolCalls.push({
        tool: tc.function.name,
        input: args,
        output: result,
        duration_ms: Date.now() - startTime,
      });
      results.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
    messages.push(...results);
  }

  const totalTokens = promptTokens + completionTokens;
  return {
    output_payload: { text: finalText, iterations: iterCount },
    tool_calls: toolCalls,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    cost_usd: calculateCost(
      'openai',
      agent.model_id,
      promptTokens,
      completionTokens,
    ),
    duration_ms: Date.now() - startTime,
  };
}

// ─────────────────────────────────────────────
// Sandboxed Tool Execution
// ─────────────────────────────────────────────
const ALLOWED_TOOL_NAMES = new Set([
  'web_search',
  'read_document',
  'write_document',
  'send_email',
  'query_database',
  'create_calendar_event',
  'code_interpreter',
  'http_request',
]);

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (!ALLOWED_TOOL_NAMES.has(toolName)) {
    return { error: `Tool '${toolName}' is not in the allowlist.` };
  }
  // In production: dispatch to E2B sandbox microservice
  console.log(`[TOOL] Executing: ${toolName}`, args);
  return { status: 'ok', tool: toolName, mock: true };
}

// ─────────────────────────────────────────────
// Cost calculation (per 1M tokens)
// ─────────────────────────────────────────────
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

function calculateCost(
  _provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const prices = PRICING[model] ?? { input: 3.0, output: 15.0 };
  return (
    (promptTokens / 1_000_000) * prices.input +
    (completionTokens / 1_000_000) * prices.output
  );
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  // ── 1. Auth gate ──────────────────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const { data: authData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  // ── 2. Parse request ──────────────────────────────────────
  let body: DispatchRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
    });
  }
  const { contract_id, input_payload } = body;
  if (!contract_id || !input_payload) {
    return new Response(
      JSON.stringify({
        error: 'contract_id and input_payload are required',
      }),
      { status: 400 },
    );
  }

  // ── 3. Fetch & validate contract ─────────────────────────
  const { data: contract, error: contractErr } = await supabase
    .from('contracts')
    .select('*, agents(*)')
    .eq('id', contract_id)
    .single<ContractRow>();

  if (contractErr || !contract) {
    return new Response(JSON.stringify({ error: 'Contract not found' }), {
      status: 404,
    });
  }
  if (contract.status !== 'active') {
    return new Response(
      JSON.stringify({ error: `Contract is ${contract.status}` }),
      { status: 403 },
    );
  }

  // ── 4. Token budget check ─────────────────────────────────
  try {
    assertTokenBudget(contract);
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 429,
    });
  }

  // ── 5. Create task record (queued) ────────────────────────
  const { data: taskRow, error: taskErr } = await supabase
    .from('tasks')
    .insert({
      contract_id,
      agent_id: contract.agent_id,
      client_id: contract.client_id,
      status: 'queued',
      input_payload,
    })
    .select()
    .single();

  if (taskErr || !taskRow) {
    return new Response(JSON.stringify({ error: 'Failed to create task' }), {
      status: 500,
    });
  }

  // ── 6. Mark task as running ───────────────────────────────
  await supabase
    .from('tasks')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('id', taskRow.id);

  // ── 7. Decrypt client API key ─────────────────────────────
  let apiKey: string;
  try {
    apiKey = await decryptApiKey(contract.client_key_enc);
  } catch {
    await supabase
      .from('tasks')
      .update({
        status: 'failed',
        error_message: 'Key decryption failed',
      })
      .eq('id', taskRow.id);
    return new Response(
      JSON.stringify({ error: 'Failed to decrypt API key' }),
      { status: 500 },
    );
  }

  // ── 8. Filter tools per contract allowlist ────────────────
  const agent = contract.agents;
  const filteredTools = filterTools(agent.tools, contract.allowed_tools);

  // ── 9. Dispatch with hard timeout ─────────────────────────
  let result: TaskResult;
  const timeoutSignal = AbortSignal.timeout(MAX_TASK_DURATION_MS);

  try {
    const runPromise =
      contract.client_provider === 'anthropic'
        ? runWithAnthropic(apiKey, agent, filteredTools, input_payload)
        : runWithOpenAI(apiKey, agent, filteredTools, input_payload);

    result = await Promise.race([
      runPromise,
      new Promise<never>((_, reject) =>
        timeoutSignal.addEventListener('abort', () =>
          reject(
            new Error(
              `Task exceeded ${MAX_TASK_DURATION_MS / 1000}s timeout`,
            ),
          ),
        ),
      ),
    ]);
  } catch (e) {
    const errMsg = (e as Error).message;
    await supabase
      .from('tasks')
      .update({
        status: 'failed',
        error_message: errMsg,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskRow.id);
    return new Response(JSON.stringify({ error: errMsg, task_id: taskRow.id }), {
      status: 500,
    });
  }

  // ── 10. Persist results ───────────────────────────────────
  await supabase
    .from('tasks')
    .update({
      status: 'completed',
      output_payload: result.output_payload,
      tool_calls: result.tool_calls,
      prompt_tokens: result.prompt_tokens,
      completion_tokens: result.completion_tokens,
      total_tokens: result.total_tokens,
      cost_usd: result.cost_usd,
      duration_ms: result.duration_ms,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskRow.id);

  // ── 11. Update contract counters (atomic) ─────────────────
  await supabase.rpc('increment_contract_tokens', {
    p_contract_id: contract_id,
    p_tokens: result.total_tokens,
  });

  // ── 12. Call webhook if configured ───────────────────────
  const webhookUrl = body.webhook_url;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AgentHire-Task-ID': taskRow.id,
      },
      body: JSON.stringify({
        task_id: taskRow.id,
        status: 'completed',
        result: result.output_payload,
      }),
    }).catch(console.error);
  }

  // ── 13. Return ────────────────────────────────────────────
  return new Response(
    JSON.stringify({
      task_id: taskRow.id,
      status: 'completed',
      output: result.output_payload,
      usage: {
        prompt_tokens: result.prompt_tokens,
        completion_tokens: result.completion_tokens,
        total_tokens: result.total_tokens,
        cost_usd: result.cost_usd,
        duration_ms: result.duration_ms,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
