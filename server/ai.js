import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { buildAgencySystemPrompt, getAgent } from './agents.js';

/* Prime Station crew preferences. These describe the STATION agents only and
   are never used for a Kaventra specialist. */
const preferred = { mkt: 'claude', sales: 'gpt', btc: 'gpt', clip: 'claude', rbx: 'claude', jarvis: 'gpt' };

export function chooseProvider(agent, requested = 'auto') {
  if (requested === 'gpt' || requested === 'claude') return requested;
  const p = preferred[agent] || 'gpt';
  const alt = p === 'gpt' ? 'claude' : 'gpt';
  return process.env[p === 'gpt' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY']
    ? p
    : process.env[alt === 'gpt' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY']
      ? alt
      : p;
}

/*
 * generate(agent, prompt, requested, agencySpecialist)
 *
 * When `agencySpecialist` is present (a Kaventra agent id, or the roster object
 * for one), that specialist IS the system prompt. The Prime Station template
 * does not run at all, so the two rosters can never blend.
 *
 * Called with no agencySpecialist, behaviour is exactly as before.
 */
export async function generate(agent, prompt, requested = 'auto', agencySpecialist = null) {
  if (agencySpecialist) {
    const id = typeof agencySpecialist === 'string'
      ? agencySpecialist
      : (agencySpecialist.id || agencySpecialist.agentId);

    const specialist = getAgent(id);
    if (!specialist) {
      throw new Error('Unknown agent "' + id + '". Add it to agents.json before assigning work to it.');
    }

    const system = buildAgencySystemPrompt(specialist.id);
    return callProvider(agent, system, prompt, requested);
  }

  return callProvider(agent, buildPrimeStationSystemPrompt(agent), prompt, requested);
}

/* One place that talks to whichever provider is configured, so the two prompt
   paths above cannot drift apart in how they call the API. */
async function callProvider(agent, system, prompt, requested) {
  const provider = chooseProvider(agent, requested);

  if (provider === 'gpt') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Add OPENAI_API_KEY to Render Environment.');
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1800
    });
    return { provider, model: r.model, text: r.choices[0]?.message?.content || '' };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Add ANTHROPIC_API_KEY to Render Environment.');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const r = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1800,
    system,
    messages: [{ role: 'user', content: prompt }]
  });
  return {
    provider,
    model: r.model,
    text: r.content.filter((x) => x.type === 'text').map((x) => x.text).join('\n')
  };
}

/* The Prime Station prompt, kept separate from the Kaventra path. */
function buildPrimeStationSystemPrompt(agent) {
  const roles = {
    mkt: 'Paul, marketing',
    sales: 'Sam, sales',
    btc: 'Matt, cautious Bitcoin market watcher and free mining-hardware opportunity researcher',
    meme: 'Dex, cautious meme-coin trading analyst',
    clip: 'Peanut, video clip planner',
    rbx: 'Gus, Roblox developer',
    dextor: 'DEXTOR, the central personal AI assistant and chief of staff for the Prime Station owner',
    jarvis: 'DEXTOR, the central personal AI assistant and chief of staff for the Prime Station owner'
  };

  const jarvis = agent === 'jarvis';

  const jarvisRules = jarvis
    ? 'You are the owner\u2019s conversational command assistant. Be calm, capable, concise, natural, and proactive. Understand ordinary language. Help plan and coordinate the existing Prime Station agents: Paul (marketing), Sam (sales), Matt (Bitcoin and hardware research), Dex (meme-coin analysis and paper trading only), Peanut (video planning), and Gus (Roblox). You can explain, reason, summarize, and prepare instructions, but do not claim to control the computer, open apps, browse live websites, send messages, publish content, or execute workflows unless a connected tool confirms it actually happened. '
    : '';

  return 'You are ' + (roles[agent] || agent) + ' in Prime Station. Produce specific, useful deliverables. '
    + jarvisRules
    + 'Gmail sending requires a connected Gmail account and a separate explicit confirmation in Prime Control. '
    + 'SMS and phone calls require Twilio configuration, the allowlisted phone number, and a separate explicit confirmation. '
    + 'Dex must state that meme coins can lose all value, flag scams and liquidity traps, and clearly label data timestamps, assumptions, and approval requirements. '
    + 'Clearly label assumptions and approval requirements.';
}

