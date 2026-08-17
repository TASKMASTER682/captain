// SEO schema definitions for blogs.
// Auto-fields (title, slug, description) come from the blog itself.
// Manual fields differ per schema — admin fills them in the editor.

export const SEO_SCHEMA_TYPES = ['BlogPosting', 'Article', 'FAQPage', 'HowTo', 'Course', 'Quiz'] as const;
export type SeoSchemaType = (typeof SEO_SCHEMA_TYPES)[number];

export interface SeoFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'repeatable' | 'select';
  options?: string[];
  repeat?: { key: string; label: string; placeholder?: string; type?: 'text' | 'textarea' }[];
  hint?: string;
}

export interface SeoSchemaDef {
  type: SeoSchemaType;
  label: string;
  description: string;
  fields: SeoFieldDef[];
}

export const SEO_SCHEMAS: SeoSchemaDef[] = [
  {
    type: 'BlogPosting',
    label: 'BlogPosting',
    description: 'Standard blog article — best for most posts.',
    fields: [],
  },
  {
    type: 'Article',
    label: 'Article',
    description: 'News / in-depth article (Google treats similar to BlogPosting).',
    fields: [],
  },
  {
    type: 'FAQPage',
    label: 'FAQPage',
    description: 'Adds Q&A boxes in Google search results (rich result eligibility).',
    fields: [
      {
        key: 'faq',
        label: 'FAQ Questions',
        type: 'repeatable',
        hint: 'Add question + answer pairs. Answers will be visible in Google results.',
        repeat: [
          { key: 'question', label: 'Question', placeholder: 'e.g. What is the SSC CGL exam pattern?', type: 'textarea' },
          { key: 'answer', label: 'Answer', placeholder: 'Write the answer here...', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'HowTo',
    label: 'HowTo',
    description: 'Step-by-step guide. Can show rich step results in Google.',
    fields: [
      {
        key: 'name',
        label: 'How-to Name',
        type: 'text',
        placeholder: 'e.g. How to prepare for SSC CGL in 3 months',
      },
      {
        key: 'totalTime',
        label: 'Total Time (optional)',
        type: 'text',
        placeholder: 'e.g. PT3M (3 minutes), PT1H (1 hour)',
      },
      {
        key: 'steps',
        label: 'Steps',
        type: 'repeatable',
        hint: 'Add the ordered steps of the guide.',
        repeat: [
          { key: 'name', label: 'Step Name', placeholder: 'e.g. Understand the syllabus', type: 'text' },
          { key: 'text', label: 'Step Detail', placeholder: 'Explain this step...', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'Course',
    label: 'Course',
    description: 'For blogs that represent or promote a course / test series.',
    fields: [
      {
        key: 'courseName',
        label: 'Course Name',
        type: 'text',
        placeholder: 'e.g. SSC CGL Complete Test Series 2026',
      },
      {
        key: 'providerName',
        label: 'Provider',
        type: 'text',
        placeholder: 'e.g. ExamOS',
      },
      {
        key: 'description',
        label: 'Course Description',
        type: 'textarea',
        placeholder: 'Short description of the course...',
      },
    ],
  },
  {
    type: 'Quiz',
    label: 'Quiz',
    description: 'For practice-question blogs. Requires a question list.',
    fields: [
      {
        key: 'quizName',
        label: 'Quiz Name',
        type: 'text',
        placeholder: 'e.g. Number System Quiz for SSC CGL',
      },
      {
        key: 'questions',
        label: 'Questions',
        type: 'repeatable',
        hint: 'Add each question with its correct answer.',
        repeat: [
          { key: 'text', label: 'Question', type: 'textarea' },
          { key: 'answer', label: 'Correct Answer', type: 'textarea' },
        ],
      },
    ],
  },
];

export function getSeoSchemaDef(type?: string): SeoSchemaDef {
  return SEO_SCHEMAS.find((s) => s.type === type) || SEO_SCHEMAS[0];
}
