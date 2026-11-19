/**
 * Kaventra AI — agent roster, loaded from agents.json.
 *
 * This is the single source of truth for who exists, what department they sit
 * in, and what they are permitted to do. The server must not hardcode a second
 * roster anywhere: every agent id that arrives on a request is validated
 * against this module.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function locateRoster() {
  const candidates = [
    process.env.AGENTS_PATH,
    path.join(here, '..', 'agents.json'),
    path.join(here, 'agents.json'),
    path.join(process.cwd(), 'agents.json')
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('agents.json not found. Expected it beside the server/ directory.');
}

let roster;
try {
  roster = JSON.parse(fs.readFileSync(locateRoster(), 'utf8'));
} catch (err) {
  throw new Error(`Could not load agents.json: ${err.message}`);
}

export const AGENCY = roster.agency || 'Kaventra AI';
export const DEPARTMENTS = Array.isArray(roster.departments) ? roster.departments : [];
export const AGENTS = Array.isArray(roster.agents) ? roster.agents : [];
export const AUTONOMY = roster.autonomy || 'approval_required_for_external_or_irreversible_actions';

/** Actions that may never be taken without an explicit owner approval on the exact artifact. */
export const APPROVAL_ACTIONS = [
  'external_send',
  'publish',
  'ad_launch',
  'spend',
  'sign_contracts',
  'production_changes'
];

const byId = new Map(AGENTS.map((agent) => [String(agent.id).toLowerCase(), agent]));

export function isValidAgent(id) {
  return byId.has(String(id || '').toLowerCase());
}

export function getAgent(id) {
  return byId.get(String(id || '').toLowerCase()) || null;
}

export function listAgents() {
  return AGENTS.map(({ id, name, title, department, mission }) => ({
    id,
    name,
    title,
    department,
    mission
  }));
}

export function agentsByDepartment() {
  return DEPARTMENTS.map((dept) => ({
    id: dept.id,
    name: dept.name,
    lead: dept.lead,
    services: dept.services || [],
    members: AGENTS.filter((a) => a.department === dept.name).map((a) => ({
      id: a.id,
      name: a.name,
      title: a.title
    }))
  }));
}

/**
 * Whether an agent holds a given permission. Absent or false denies.
 * This is deliberately deny-by-default: a role added to agents.json without a
 * permissions block can research and draft, and nothing more.
 */
export function can(agentId, action) {
  const agent = getAgent(agentId);
  if (!agent) return false;
  const perms = agent.permissions || {};
  return perms[action] === true;
}

/** Every permission this agent does NOT hold, for surfacing in the UI. */
export function deniedActions(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return APPROVAL_ACTIONS;
  const perms = agent.permissions || {};
  return APPROVAL_ACTIONS.filter((action) => perms[action] !== true);
}

/**
 * Build the system prompt for one Kaventra specialist.
 *
 * This replaces the old behaviour of appending an agency role onto the Prime
 * Station system prompt, which told the model it was one agent and then handed
 * it a different agent's mission. A Kaventra specialist is prompted as that
 * specialist and nothing else.
 */
export function buildAgencySystemPrompt(agentId) {
  const agent = getAgent(agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const perms = agent.permissions || {};
  const denied = deniedActions(agent.id);

  const qualityRules = Array.isArray(agent.qualityRules) ? agent.qualityRules : [];

  return [
    `You are ${agent.name}, ${agent.title} at ${AGENCY} (${agent.department}).`,
    '',
    `MISSION: ${agent.mission || ''}`,
    '',
    `STANDARD OUTPUT: ${agent.standardDeliverables || 'Return a usable draft.'}`,
    '',
    'QUALITY RULES:',
    ...qualityRules.map((rule) => `- ${rule}`),
    '',
    'AUTHORITY:',
    perms.research === true ? '- You may research and analyse.' : '- You may not research.',
    perms.draft === true ? '- You may draft work for internal review.' : '- You may not draft.',
    perms.internal_tasks === true
      ? '- You may create internal tasks for other specialists.'
      : '- You may not create tasks for others.',
    `- You may NOT perform these actions: ${denied.join(', ') || 'none'}.`,
    '- Client-facing messages, publishing, ad launches, spending, contracts and production changes all require the owner to approve the exact artifact first.',
    '- Never claim an external action was taken. Never invent metrics, clients, case studies, credentials or completed work.',
    '',
    'If a request needs an action you are not permitted to take, produce the draft plus a short note stating exactly which approval is required.',
    'Your output is a draft for the owner to review. Do not address the client directly unless the output is explicitly an email draft, in which case label it as a draft.'
  ].join('\n');
}

export default {
  AGENCY,
  DEPARTMENTS,
  AGENTS,
  AUTONOMY,
  APPROVAL_ACTIONS,
  isValidAgent,
  getAgent,
  listAgents,
  agentsByDepartment,
  can,
  deniedActions,
  buildAgencySystemPrompt
};
