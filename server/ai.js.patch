/**
 * Patch for server/ai.js — route Kaventra tasks through the agency roster
 * instead of the Prime Station crew.
 *
 * THE BUG THIS FIXES
 * ------------------
 * generate(agent, prompt, requested, agencySpecialist) currently builds ONE
 * system prompt that hardcodes the Prime Station world ("You are Paul, marketing,
 * in Prime Station") and then APPENDS the Kaventra specialist block onto it:
 *
 *     KAVENTRA SPECIALIST ROLE: Maya — Marketing Director (Marketing & Growth).
 *
 * So a Kaventra task tells the model it is Paul, then tells it it is Maya, then
 * hands it a roster of six agents who are not in Kaventra. Worse, roles['maya']
 * is undefined, so an id from agents.json falls through to the literal string
 * "You are maya in Prime Station".
 *
 * THE FIX
 * -------
 * When a Kaventra specialist is present, that is the WHOLE system prompt. The
 * Prime Station template never runs. The two rosters can no longer blend.
 *
 * HOW TO APPLY
 * ------------
 * 1. Copy server/agents.js into the repo.
 * 2. In server/ai.js, add the import shown below.
 * 3. Replace the body of `generate` with the version here.
 * 4. Leave `chooseProvider` alone — its key-presence fallback is correct.
 */

// --- 1. Add to the top of server/ai.js -------------------------------------
import { buildAgencySystemPrompt, getAgent } from './agents.js';

// --- 2. Replace generate() -------------------------------------------------
//
// Signature is unchanged so every existing call site keeps working:
//
//   generate(agent, prompt, requested, agencySpecialist)
//
// but `agencySpecialist` may now be either an object (the old shape) or a plain
// agent id string (the new, preferred shape — the id is looked up in
// agents.json so the roster has exactly one definition).

export async function generate(agent, prompt, requested = 'auto', agencySpecialist = null) {
  const useAgency = Boolean(agencySpecialist);

  if (useAgency) {
    // Resolve an object or an id to a canonical roster entry.
    const id = typeof agencySpecialist === 'string'
      ? agencySpecialist
      : agencySpecialist.id;

    const specialist = getAgent(id);

    if (!specialist) {
      throw new Error(
        `Unknown agent "${id}". Add it to agents.json before assigning work to it.`
      );
    }

    // A Kaventra task is prompted as that specialist and nothing else.
    const system = buildAgencySystemPrompt(specialist.id);
    return callProvider(agent, system, prompt, requested);
  }

  // --- Prime Station path: unchanged behaviour -----------------------------
  const system = buildPrimeStationSystemPrompt(agent);
  return callProvider(agent, system, prompt, requested);
}

/**
 * Single place that talks to whichever provider is configured. Extracted so the
 * two prompt paths above cannot drift apart in how they call the API.
 */
async function callProvider(agent, system, prompt, requested) {
  const provider = chooseProvider(agent, requested);

  if (provider === 'gpt') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Add OPENAI_API_KEY to Render Environment.');
    }
    const OpenAI = (await import('openai')).default;
    const c = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const r = await c.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1800
    });
    return {
      provider,
      model: r.model,
      text: r.choices[0]?.message?.content || ''
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Add ANTHROPIC_API_KEY to Render Environment.');
  }
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const c = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const r = await c.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 1800,
    system,
    messages: [{ role: 'user', content: prompt }]
  });
  return {
    provider,
    model: r.model,
    text: r.content
      .filter((x) => x.type === 'text')
      .map((x) => x.text)
      .join('\n')
  };
}

/**
 * The Prime Station prompt, lifted out of generate() verbatim and kept separate.
 * Keep `preferred` and `roles` here — they describe the station crew and must
 * not be reachable from a Kaventra task.
 */
function buildPrimeStationSystemPrompt(agent) {
  const roles = {
    mkt: 'Paul, marketing',
    sales: 'Sam, sales',
    btc: 'Matt, cautious Bitcoin market watcher and free mining-hardware opportunity researcher',
    meme: 'Dex, cautious meme-coin trading analyst',
    clip: 'Peanut, video clip planner',
    rbx: 'Gus, Roblox developer',
    jarvis: 'DEXTOR, the central personal AI assistant and chief of staff for the Prime Station owner'
  };

  const jarvis = agent === 'jarvis';

  return `You are ${roles[agent] || agent} in Prime Station. Produce specific, useful deliverables. ${
    jarvis
      ? 'You are the owner\u2019s conversational command assistant. Be calm, capable, concise, natural, and proactive. Understand ordinary language. Help plan and coordinate the existing Prime Station agents: Paul (marketing), Sam (sales), Matt (Bitcoin and hardware research), Dex (meme-coin analysis and paper trading only), Peanut (video planning), and Gus (Roblox). You can explain, reason, summarize, and prepare instructions, but do not claim to control the computer, open apps, browse live websites, send messages, publish content, or execute workflows unless a connected tool confirms it actually happened.'
      : ''
  } Gmail sending requires a connected Gmail account and a separate explicit confirmation in Prime Control. SMS and phone calls require Twilio configuration, the allowlisted phone number, and a separate explicit confirmation. Dex must state that meme coins can lose all value, flag scams and liquidity traps, and clearly label data timestamps, assumptions, and approval requirements. Clearly label assumptions and approval requirements.`;
}
