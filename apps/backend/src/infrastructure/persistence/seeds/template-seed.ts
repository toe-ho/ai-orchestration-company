/** Seed data for the 3 built-in company templates */

export interface AgentConfig {
  name: string;
  role: string;
  title: string;
  adapterType: string;
  adapterConfig: Record<string, unknown>;
  runtimeConfig: Record<string, unknown>;
  /** index into agentConfigs array that this agent reports to, or null for top */
  reportsToIndex: number | null;
}

export interface TemplateSeedEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  goalTemplate: string;
  isPublic: boolean;
  agentConfigs: AgentConfig[];
}

export const TEMPLATE_SEEDS: TemplateSeedEntry[] = [
  {
    id: 'ai-saas-startup',
    name: 'AI SaaS Startup',
    description: 'A lean startup team focused on building and shipping AI-powered software products.',
    category: 'tech',
    goalTemplate: 'Build and launch a successful AI SaaS product',
    isPublic: true,
    agentConfigs: [
      {
        name: 'CEO',
        role: 'ceo',
        title: 'Chief Executive Officer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the CEO. Focus on strategic planning, product vision, and business decisions.' },
        reportsToIndex: null,
      },
      {
        name: 'CTO',
        role: 'cto',
        title: 'Chief Technology Officer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the CTO. Focus on technical architecture, engineering decisions, and code quality.' },
        reportsToIndex: 0,
      },
      {
        name: 'Engineer Alpha',
        role: 'engineer',
        title: 'Software Engineer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a software engineer. Focus on implementing features, writing clean code, and fixing bugs.' },
        reportsToIndex: 1,
      },
      {
        name: 'Engineer Beta',
        role: 'engineer',
        title: 'Software Engineer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a software engineer. Focus on implementing features, writing clean code, and fixing bugs.' },
        reportsToIndex: 1,
      },
      {
        name: 'Designer',
        role: 'designer',
        title: 'UI/UX Designer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a UI/UX designer. Focus on user experience, interface design, and design systems.' },
        reportsToIndex: 0,
      },
    ],
  },
  {
    id: 'marketing-agency',
    name: 'Marketing Agency',
    description: 'A results-driven marketing team that handles strategy, content, design, and project coordination.',
    category: 'marketing',
    goalTemplate: 'Grow brand awareness and drive customer acquisition',
    isPublic: true,
    agentConfigs: [
      {
        name: 'CEO',
        role: 'ceo',
        title: 'Chief Executive Officer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the CEO. Focus on agency strategy, client relationships, and business growth.' },
        reportsToIndex: null,
      },
      {
        name: 'Marketer',
        role: 'marketer',
        title: 'Marketing Lead',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the marketing lead. Focus on content strategy, campaigns, SEO, and growth.' },
        reportsToIndex: 0,
      },
      {
        name: 'Designer',
        role: 'designer',
        title: 'Creative Designer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the creative designer. Focus on visual assets, branding, and creative direction.' },
        reportsToIndex: 0,
      },
      {
        name: 'PM',
        role: 'pm',
        title: 'Project Manager',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the project manager. Focus on coordination, timelines, and delivery.' },
        reportsToIndex: 0,
      },
    ],
  },
  {
    id: 'development-shop',
    name: 'Development Shop',
    description: 'A professional dev team specializing in full-stack development and quality assurance.',
    category: 'tech',
    goalTemplate: 'Deliver high-quality software on time and within budget',
    isPublic: true,
    agentConfigs: [
      {
        name: 'CTO',
        role: 'cto',
        title: 'Chief Technology Officer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are the CTO. Focus on technical architecture, code review, and engineering excellence.' },
        reportsToIndex: null,
      },
      {
        name: 'Engineer Alpha',
        role: 'engineer',
        title: 'Full-Stack Engineer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a full-stack engineer. Build features across frontend and backend.' },
        reportsToIndex: 0,
      },
      {
        name: 'Engineer Beta',
        role: 'engineer',
        title: 'Full-Stack Engineer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a full-stack engineer. Build features across frontend and backend.' },
        reportsToIndex: 0,
      },
      {
        name: 'Engineer Gamma',
        role: 'engineer',
        title: 'Full-Stack Engineer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a full-stack engineer. Build features across frontend and backend.' },
        reportsToIndex: 0,
      },
      {
        name: 'QA Engineer',
        role: 'qa',
        title: 'QA Engineer',
        adapterType: 'claude',
        adapterConfig: {},
        runtimeConfig: { systemPrompt: 'You are a QA engineer. Write tests, find bugs, and ensure quality standards.' },
        reportsToIndex: 0,
      },
    ],
  },
];
