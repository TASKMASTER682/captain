// API client for ExamOS with automatic mock fallback if the backend is offline
const API_BASE = 'http://localhost:5000/api';

// Simple JWT state storage in localStorage
let cachedToken = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
let currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;

export const setAuthToken = (token: string, user: any) => {
  cachedToken = token;
  currentUser = user;
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const clearAuth = () => {
  cachedToken = '';
  currentUser = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getAuthUser = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user');
    if (stored) {
      currentUser = JSON.parse(stored);
      return currentUser;
    }
  }
  return currentUser;
};

async function request(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (cachedToken) {
    headers.set('Authorization', `Bearer ${cachedToken}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const isAuthEndpoint = endpoint.startsWith('/auth/');

  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      // For auth endpoints: never fall back to mock if backend responded
      if (isAuthEndpoint) {
        throw new Error(errData.message || 'Authentication failed.');
      }
      // For non-auth endpoints: on auth errors, switch to mock mode
      if (res.status === 401 || res.status === 403) {
        return getMockFallback(endpoint, options);
      }
      // For 404s on non-auth endpoints, fall back to mock (endpoint not implemented on backend)
      if (res.status === 404) {
        return getMockFallback(endpoint, options);
      }
      throw new Error(errData.message || 'API request failed.');
    }
    return await res.json();
  } catch (err: any) {
    // Network error — backend unreachable for THIS request, use mock fallback.
    // Do NOT permanently switch to mock-only mode: the backend may recover,
    // and a stale flag makes the UI show mock data instead of live DB data.
    if (err?.message?.includes('fetch') || err?.message?.includes('NetworkError') || err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_CONNECTION_REFUSED')) {
      return getMockFallback(endpoint, options);
    }
    throw err;
  }
}

// Mock database for frontend demo continuity
const MOCK_QUESTIONS = [
  {
    _id: 'q1',
    body: 'An article is sold for ₹600 at a loss of 20%. At what price should it be sold to gain 15%?',
    options: [
      { key: 'A', text: '₹862.50' },
      { key: 'B', text: '₹850.00' },
      { key: 'C', text: '₹825.00' },
      { key: 'D', text: '₹880.00' }
    ],
    correctAnswer: ['A'],
    type: 'Single Correct',
    subject: 'Quantitative Aptitude',
    topic: 'Profit and Loss',
    difficulty: 'Medium',
    explanation: 'Cost Price (CP) = 600 / 0.8 = ₹750.\nSelling Price (SP) for 15% gain = 750 * 1.15 = ₹862.50.',
    marks: 2,
    negativeMarks: 0.5,
  },
  {
    _id: 'q2',
    body: 'Which of the following numbers are prime numbers?',
    options: [
      { key: 'A', text: '2' },
      { key: 'B', text: '4' },
      { key: 'C', text: '9' },
      { key: 'D', text: '13' }
    ],
    correctAnswer: ['A', 'D'],
    type: 'Multiple Correct',
    subject: 'Quantitative Aptitude',
    topic: 'Number System',
    difficulty: 'Easy',
    explanation: '2 and 13 have no divisors other than 1 and themselves. 4 (2*2) and 9 (3*3) are composite numbers.',
    marks: 2,
    negativeMarks: 0.5,
  },
  {
    _id: 'q3',
    body: 'Points A and B are 100 km apart on a highway. One car starts from A and another from B at the same time. If they travel in the same direction at different speeds, they meet in 5 hours. If they travel towards each other, they meet in 1 hour. What is the speed of the faster car (in km/h)?',
    options: [],
    correctAnswer: ['60'],
    type: 'Numerical',
    subject: 'Quantitative Aptitude',
    topic: 'Time, Speed and Distance',
    difficulty: 'Hard',
    explanation: 'Let speeds be x and y (x > y).\nSame direction: 5(x - y) = 100 => x - y = 20.\nOpposite direction: 1(x + y) = 100 => x + y = 100.\nAdding both: 2x = 120 => x = 60 km/h.',
    marks: 2,
    negativeMarks: 0,
  },
  {
    _id: 'q4',
    body: 'Assertion (A): The inner lining of the small intestine has numerous finger-like projections called villi.\nReason (R): Villi increase the surface area for absorption of digested food.',
    options: [
      { key: 'A', text: 'Both A and R are true and R is the correct explanation of A' },
      { key: 'B', text: 'Both A and R are true but R is not the correct explanation of A' },
      { key: 'C', text: 'A is true but R is false' },
      { key: 'D', text: 'A is false but R is true' }
    ],
    correctAnswer: ['A'],
    type: 'Assertion Reason',
    subject: 'General Science',
    topic: 'Biology - Digestion',
    difficulty: 'Medium',
    explanation: 'Villi indeed increase surface area, aiding rapid absorption. Both statements are scientifically true and related.',
    marks: 2,
    negativeMarks: 0.5,
  },
  {
    _id: 'q5',
    body: 'The Supreme Court of India is a Court of Record.',
    options: [
      { key: 'A', text: 'True' },
      { key: 'B', text: 'False' }
    ],
    correctAnswer: ['A'],
    type: 'True False',
    subject: 'General Awareness',
    topic: 'Indian Polity',
    difficulty: 'Easy',
    explanation: 'Under Article 129 of the Constitution of India, the Supreme Court is declared a Court of Record, meaning its judgments are recorded for testimony and authority.',
    marks: 2,
    negativeMarks: 0.5,
  }
];

const MOCK_TESTS = () => {
  const exam1 = _mockExams.find((e: any) => e._id === 'ex-1') || { _id: 'ex-1', name: 'SSC CGL' };
  const ts1 = _mockTestSeries.find((t: any) => t._id === 'ts-1') || { _id: 'ts-1', title: 'Tier 1 Mock Series' };
  return [
    {
      _id: 'test-8',
      title: 'SSC CGL Tier-1: Premium Mock Test 8',
      description: 'Comprehensive mock examination matching the actual SSC CGL pattern. Section locking is disabled.',
      duration: 60,
      passingMarks: 40,
      attemptLimit: 3,
      calculatorAllowed: false,
      fullscreenRequired: true,
      examId: { _id: exam1._id, name: exam1.name },
      testSeriesId: { _id: ts1._id, title: ts1.title },
      sections: [
        {
          _id: 'sec-1',
          name: 'Quantitative Aptitude',
          duration: 30,
          questions: MOCK_QUESTIONS.slice(0, 3),
          negativeMarking: true,
          marksPerQuestion: 2,
          negativeMarksPerQuestion: 0.5
        },
        {
          _id: 'sec-2',
          name: 'General Awareness',
          duration: 30,
          questions: MOCK_QUESTIONS.slice(3),
          negativeMarking: true,
          marksPerQuestion: 2,
          negativeMarksPerQuestion: 0.5
        }
      ]
    }
  ];
};

// Mutable copy for mock CRUD (persisted to localStorage)
let _mockTests: any[] | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('_m_tests');
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return null;
})();
let _mockQuestions: any[] | null = (() => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('_m_questions');
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return null;
})();

const MOCK_STAGED = [
  {
    _id: 'st-1',
    body: 'If cos θ + sin θ = √2 cos θ, then what is the value of cos θ - sin θ?',
    options: [
      { key: 'A', text: '√2 sin θ' },
      { key: 'B', text: '√2 cos θ' },
      { key: 'C', text: '1/√2 sin θ' },
      { key: 'D', text: 'None of these' }
    ],
    correctAnswer: ['A'],
    type: 'Single Correct',
    subject: 'Quantitative Aptitude',
    topic: 'Trigonometry',
    difficulty: 'Hard',
    validationErrors: [],
    importStatus: 'Pending Review',
    fileSourceName: 'Maths_Trigo_PYQ.docx'
  },
  {
    _id: 'st-2',
    body: 'Who is known as the Father of the Indian Constitution?',
    options: [
      { key: 'A', text: 'Mahatma Gandhi' },
      { key: 'B', text: 'Dr. B.R. Ambedkar' }
    ],
    correctAnswer: [], // Missing answer triggers warning
    type: 'Single Correct',
    subject: 'General Awareness',
    topic: '', // Missing topic triggers warning
    validationErrors: ['Missing correct answer key.', 'Missing topic classification tag.'],
    importStatus: 'Failed Validation',
    fileSourceName: 'Polity_History.csv'
  }
];

const MOCK_REVISIONS = [
  {
    _id: 'rev-1',
    questionId: MOCK_QUESTIONS[0],
    stage: 2,
    dueDate: new Date(Date.now() - 3600000), // past due
  },
  {
    _id: 'rev-2',
    questionId: MOCK_QUESTIONS[2],
    stage: 1,
    dueDate: new Date(Date.now() - 7200000),
  }
];

const MOCK_RECOMMENDATIONS = [
  {
    type: 'Topic Practice',
    title: 'Improve Accuracy: Profit and Loss',
    description: 'Your accuracy in Profit and Loss is 40%. Focus on fundamentals by launching a targeted practice session.',
    action: '/practice?subject=Quantitative Aptitude&topic=Profit and Loss',
  },
  {
    type: 'Speed Boost',
    title: 'Optimize Timing: Number System',
    description: 'You are spending an average of 115s per question in Number System. Try timed practices to improve pacing.',
    action: '/practice?subject=Quantitative Aptitude&topic=Number System',
  }
];

const MOCK_USERS = [
  { _id: 'usr-1', name: 'Super Admin', email: 'admin@examos.com', role: 'Super Admin', active: true, createdAt: '2026-01-01' },
  { _id: 'usr-2', name: 'Demo Candidate', email: 'student@examos.com', role: 'User', active: true, createdAt: '2026-01-15' },
];

// Persisted mock data — loaded from localStorage or defaults
const _loadPersisted = <T>(key: string, fallback: T[]): T[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch {}
  }
  return [...fallback];
};

const _DEFAULT_AGENCIES = [
  { _id: 'ag-1', name: 'Staff Selection Commission', code: 'SSC', description: 'Central recruiting body in India', active: true },
  { _id: 'ag-2', name: 'Union Public Service Commission', code: 'UPSC', description: 'Civil services recruitment', active: true },
];

const _DEFAULT_EXAMS = [
  { _id: 'ex-1', agencyId: { _id: 'ag-1', name: 'Staff Selection Commission', code: 'SSC' }, name: 'Combined Graduate Level Exam', code: 'SSC-CGL', active: true },
  { _id: 'ex-2', agencyId: { _id: 'ag-2', name: 'Union Public Service Commission', code: 'UPSC' }, name: 'Civil Services Prelims', code: 'UPSC-CSP', active: true },
];

const _DEFAULT_TEST_SERIES = [
  { _id: 'ts-1', examId: { _id: 'ex-1', name: 'Combined Graduate Level Exam', code: 'SSC-CGL' }, title: 'Tier 1 Premium Mock Series', description: 'Full-length Mock Exams for SSC CGL Tier 1', price: 0, tags: ['SSC', 'CGL', 'Tier-1'], active: true },
  { _id: 'ts-2', examId: { _id: 'ex-2', name: 'Civil Services Prelims', code: 'UPSC-CSP' }, title: 'GS Prelims Test Series', description: 'Complete GS coverage for UPSC Prelims', price: 499, tags: ['UPSC', 'GS', 'Prelims'], active: true },
  { _id: 'ts-3', examId: { _id: 'ex-1', name: 'Combined Graduate Level Exam', code: 'SSC-CGL' }, title: 'Advance Maths Practice Series', description: 'Focused maths practice for SSC CGL Tier 2', price: 299, tags: ['SSC', 'CGL', 'Maths'], active: true },
  { _id: 'ts-4', examId: { _id: 'ex-2', name: 'Civil Services Prelims', code: 'UPSC-CSP' }, title: 'CSAT Mock Test Series', description: 'CSAT paper 2 practice with answer keys', price: 0, tags: ['UPSC', 'CSAT', 'Prelims'], active: true },
  { _id: 'ts-5', examId: { _id: 'ex-1', name: 'Combined Graduate Level Exam', code: 'SSC-CGL' }, title: 'English Language Booster', description: 'English comprehension and grammar tests', price: 0, tags: ['SSC', 'CGL', 'English'], active: true },
  { _id: 'ts-6', examId: { _id: 'ex-2', name: 'Civil Services Prelims', code: 'UPSC-CSP' }, title: 'Current Affairs 2026 Quiz Series', description: 'Monthly current affairs quizzes for UPSC', price: 199, tags: ['UPSC', 'Current Affairs'], active: true },
];

let _mockAgencies: any[] = _loadPersisted('_m_agencies', _DEFAULT_AGENCIES);
let _mockExams: any[] = _loadPersisted('_m_exams', _DEFAULT_EXAMS);
let _mockTestSeries: any[] = _loadPersisted('_m_test_series', _DEFAULT_TEST_SERIES);

const _persistMockData = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('_m_agencies', JSON.stringify(_mockAgencies));
    localStorage.setItem('_m_exams', JSON.stringify(_mockExams));
    localStorage.setItem('_m_test_series', JSON.stringify(_mockTestSeries));
    if (_mockTests) localStorage.setItem('_m_tests', JSON.stringify(_mockTests));
    if (_mockQuestions) localStorage.setItem('_m_questions', JSON.stringify(_mockQuestions));
  }
};

// In-memory active attempt session variables
let activeAttemptSession: any = null;

// In-memory enrollment store (persisted to localStorage)
let _mockEnrollments: { userId: string; testSeriesId: string; enrolledAt: string }[] = (() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('_m_enrollments');
    return stored ? JSON.parse(stored) : [];
  }
  return [];
})();

const _saveEnrollments = () => {
  if (typeof window !== 'undefined') localStorage.setItem('_m_enrollments', JSON.stringify(_mockEnrollments));
};

function getMockFallback(endpoint: string, options: RequestInit): any {
  const method = options.method || 'GET';

  // Login
  if (endpoint === '/auth/login' && method === 'POST') {
    const { email, password } = JSON.parse(options.body as string);
    if (!email || !password) {
      return { success: false, message: 'Email and password are required.' };
    }
    // Find in mock users OR match any registered user in localStorage
    let user = MOCK_USERS.find((u: any) => u.email === email);
    if (!user) {
      const stored = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
      if (stored && stored.email === email) user = stored;
    }
    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }
    return { success: true, data: { user, token: 'mock-jwt-token' } };
  }

  // Register
  if (endpoint === '/auth/register' && method === 'POST') {
    const { name, email, password, role, agencies, exams } = JSON.parse(options.body as string);
    if (!name || !email || !password) {
      return { success: false, message: 'Name, email, and password are required.' };
    }
    // Check for existing user
    const exists = MOCK_USERS.find((u: any) => u.email === email);
    if (exists) {
      return { success: false, message: 'A user with this email already exists.' };
    }
    const mockUser: any = {
      _id: 'usr-new-' + Date.now(),
      name,
      email,
      role: role === 'Super Admin' ? 'Super Admin' : 'User',
      active: true,
      createdAt: new Date().toISOString(),
      agencies: agencies || [],
      exams: exams || [],
    };
    MOCK_USERS.push(mockUser);
    currentUser = mockUser;
    if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(mockUser));
    return { success: true, data: { user: mockUser, token: 'mock-jwt-token' } };
  }

  // Update preferences
  if (endpoint === '/auth/preferences' && method === 'PATCH') {
    const body = JSON.parse(options.body as string);
    const stored = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const user = currentUser || stored || { _id: 'usr-1', name: 'Demo', role: 'User', agencies: [], exams: [] };
    if (Array.isArray(body.agencies)) user.agencies = body.agencies;
    if (Array.isArray(body.exams)) user.exams = body.exams;
    currentUser = user;
    if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(user));
    return { success: true, data: { user } };
  }

  // Agencies
  if (endpoint === '/agencies' && method === 'GET') {
    const url = new URL(endpoint, 'http://mock');
    const agencyId = url.searchParams.get('agencyId');
    return { success: true, data: agencyId ? _mockAgencies.filter((a: any) => a._id === agencyId) : _mockAgencies };
  }
  if (endpoint.startsWith('/agencies/') && method === 'GET') {
    const id = endpoint.split('/')[2].split('?')[0];
    const found = _mockAgencies.find((a: any) => a._id === id);
    return { success: true, data: found || _mockAgencies[0] };
  }
  if (endpoint.startsWith('/agencies/') && method === 'PUT') {
    const updates = JSON.parse(options.body as string);
    const idx = _mockAgencies.findIndex((a: any) => a._id === endpoint.split('/')[2]);
    if (idx !== -1) { _mockAgencies[idx] = { ..._mockAgencies[idx], ...updates }; }
    _persistMockData();
    return { success: true, data: _mockAgencies[idx] || _mockAgencies[0] };
  }
  if (endpoint === '/agencies' && method === 'POST') {
    const data = JSON.parse(options.body as string);
    const created = { _id: 'ag-new-' + Date.now(), ...data, active: true };
    _mockAgencies.push(created);
    _persistMockData();
    return { success: true, data: created };
  }
  if (endpoint.startsWith('/agencies/') && method === 'DELETE') {
    const id = endpoint.split('/')[2];
    const idx = _mockAgencies.findIndex((a: any) => a._id === id);
    if (idx !== -1) _mockAgencies.splice(idx, 1);
    _persistMockData();
    return { success: true, message: 'Deleted' };
  }

  // Exams
  if (endpoint === '/exams' && method === 'GET') {
    const url = new URL(endpoint, 'http://mock');
    const agencyId = url.searchParams.get('agencyId');
    let data = _mockExams;
    if (agencyId) data = _mockExams.filter((e: any) => e.agencyId._id === agencyId);
    return { success: true, data };
  }
  if (endpoint.startsWith('/exams/') && method === 'GET') {
    const id = endpoint.split('/')[2].split('?')[0];
    const found = _mockExams.find((e: any) => e._id === id);
    return { success: true, data: found || _mockExams[0] };
  }
  if (endpoint === '/exams' && method === 'POST') {
    const data = JSON.parse(options.body as string);
    const agency = _mockAgencies.find((a: any) => a._id === data.agencyId);
    const created = { _id: 'ex-new-' + Date.now(), ...data, agencyId: agency || data.agencyId, active: true };
    _mockExams.push(created);
    _persistMockData();
    return { success: true, data: created };
  }
  if (endpoint.startsWith('/exams/') && method === 'PUT') {
    const updates = JSON.parse(options.body as string);
    const id = endpoint.split('/')[2];
    const idx = _mockExams.findIndex((e: any) => e._id === id);
    if (updates.agencyId && typeof updates.agencyId === 'string') {
      const agency = _mockAgencies.find((a: any) => a._id === updates.agencyId);
      updates.agencyId = agency || updates.agencyId;
    }
    if (idx !== -1) { _mockExams[idx] = { ..._mockExams[idx], ...updates }; }
    _persistMockData();
    return { success: true, data: _mockExams[idx] || _mockExams[0] };
  }
  if (endpoint.startsWith('/exams/') && method === 'DELETE') {
    const id = endpoint.split('/')[2];
    const idx = _mockExams.findIndex((e: any) => e._id === id);
    if (idx !== -1) _mockExams.splice(idx, 1);
    _persistMockData();
    return { success: true, message: 'Deleted' };
  }

  // Test Series
  if (endpoint === '/test-series' && method === 'GET') return { success: true, data: _mockTestSeries };
  // Search — MUST be before :id catch-all
  if (endpoint.startsWith('/test-series/search') && method === 'GET') {
    const url = new URL(endpoint, 'http://mock');
    const q = url.searchParams.get('q') || '';
    if (!q.trim()) return { success: true, data: _mockTestSeries };
    const s = q.toLowerCase();
    const results = _mockTestSeries.filter((ts: any) =>
      ts.title.toLowerCase().includes(s) ||
      ts.description?.toLowerCase().includes(s) ||
      ts.tags?.some((t: string) => t.toLowerCase().includes(s)) ||
      ts.examId?.name?.toLowerCase().includes(s)
    );
    return { success: true, data: results };
  }
  if (endpoint.startsWith('/test-series/') && method === 'GET') {
    const id = endpoint.split('/')[2].split('?')[0];
    const found = _mockTestSeries.find((t: any) => t._id === id);
    return { success: true, data: found || _mockTestSeries[0] };
  }
  if (endpoint === '/test-series' && method === 'POST') {
    const data = JSON.parse(options.body as string);
    const exam = _mockExams.find((e: any) => e._id === data.examId);
    const created = { _id: 'ts-new-' + Date.now(), ...data, examId: exam || data.examId, active: true };
    _mockTestSeries.push(created);
    _persistMockData();
    return { success: true, data: created };
  }
  if (endpoint.startsWith('/test-series/') && method === 'PUT') {
    const updates = JSON.parse(options.body as string);
    const id = endpoint.split('/')[2];
    const idx = _mockTestSeries.findIndex((t: any) => t._id === id);
    if (updates.examId && typeof updates.examId === 'string') {
      const exam = _mockExams.find((e: any) => e._id === updates.examId);
      updates.examId = exam || updates.examId;
    }
    if (idx !== -1) { _mockTestSeries[idx] = { ..._mockTestSeries[idx], ...updates }; }
    _persistMockData();
    return { success: true, data: _mockTestSeries[idx] || _mockTestSeries[0] };
  }
  if (endpoint.startsWith('/test-series/') && method === 'DELETE') {
    const id = endpoint.split('/')[2];
    const idx = _mockTestSeries.findIndex((t: any) => t._id === id);
    if (idx !== -1) _mockTestSeries.splice(idx, 1);
    _persistMockData();
    return { success: true, message: 'Deleted' };
  }

  // Enrollments
  const _getUserId = () => {
    const u = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    return u?._id || 'usr-new';
  };

  if (endpoint === '/enrollments/me' && method === 'GET') {
    const uid = _getUserId();
    const myEnrollments = _mockEnrollments.filter((e: any) => e.userId === uid);
    const populated = myEnrollments.map((e: any) => {
      const ts = _mockTestSeries.find((t: any) => t._id === e.testSeriesId);
      return { ...e, testSeriesId: ts || null };
    });
    return { success: true, data: populated };
  }
  if (endpoint.match(/^\/enrollments\/enroll\/.+/) && method === 'POST') {
    const tsId = endpoint.split('/').pop();
    const uid = _getUserId();
    if (!tsId) return { success: false, message: 'Missing test series ID' };
    const exists = _mockEnrollments.find((e: any) => e.userId === uid && e.testSeriesId === tsId);
    if (exists) return { success: true, message: 'Already enrolled' };
    _mockEnrollments.push({ userId: uid, testSeriesId: tsId, enrolledAt: new Date().toISOString() });
    _saveEnrollments();
    return { success: true, data: { userId: uid, testSeriesId: tsId } };
  }
  if (endpoint.match(/^\/enrollments\/unenroll\/.+/) && method === 'DELETE') {
    const tsId = endpoint.split('/').pop();
    const uid = _getUserId();
    if (!tsId) return { success: false, message: 'Missing test series ID' };
    _mockEnrollments = _mockEnrollments.filter((e: any) => !(e.userId === uid && e.testSeriesId === tsId));
    _saveEnrollments();
    return { success: true, message: 'Unenrolled' };
  }
  if (endpoint.match(/^\/enrollments\/check\/.+/) && method === 'GET') {
    const tsId = endpoint.split('/').pop();
    const uid = _getUserId();
    if (!tsId) return { success: true, enrolled: false };
    const enrolled = _mockEnrollments.some((e: any) => e.userId === uid && e.testSeriesId === tsId);
    return { success: true, enrolled };
  }

  // Users (admin)
  if (endpoint.startsWith('/users') && method === 'GET') {
    const qIdx = endpoint.indexOf('?');
    const params = qIdx !== -1 ? Object.fromEntries(new URLSearchParams(endpoint.slice(qIdx))) : {};
    let filtered = MOCK_USERS;
    if (params.role) filtered = filtered.filter((u: any) => u.role === params.role);
    return { success: true, data: filtered };
  }
  if (endpoint.startsWith('/users/') && method === 'PUT') {
    const id = endpoint.split('/')[2];
    const updates = JSON.parse(options.body as string);
    const idx = MOCK_USERS.findIndex((u: any) => u._id === id);
    if (idx !== -1) MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updates };
    return { success: true, data: MOCK_USERS[idx] || MOCK_USERS[0] };
  }
  if (endpoint.startsWith('/users/') && method === 'DELETE') {
    const id = endpoint.split('/')[2];
    const idx = MOCK_USERS.findIndex((u: any) => u._id === id);
    if (idx !== -1) MOCK_USERS.splice(idx, 1);
    return { success: true, message: 'User deleted.' };
  }

  // User Profile
  if (endpoint === '/auth/me') {
    return {
      success: true,
      data: {
        user: currentUser || { id: 'usr-demo', name: 'Demo Candidate', email: 'candidate@examos.com', role: 'User', primaryAgency: 'ag-1', primaryExam: 'ex-1' }
      }
    };
  }

  // List Tests
  if (endpoint.startsWith('/tests') && method === 'GET' && !endpoint.match(/^\/tests\//)) {
    const qIdx = endpoint.indexOf('?');
    const params = qIdx !== -1 ? Object.fromEntries(new URLSearchParams(endpoint.slice(qIdx))) : {};
    if (!_mockTests) _mockTests = MOCK_TESTS();
    let data = _mockTests;
    if (params.examId) {
      data = data.filter(t => t.examId?._id === params.examId);
    }
    if (params.testSeriesId) {
      data = data.filter(t => t.testSeriesId?._id === params.testSeriesId);
    }
    return { success: true, data };
  }

  // Create Test
  if (endpoint === '/tests' && method === 'POST') {
    const body = JSON.parse(options.body as string);
    if (!_mockTests) _mockTests = MOCK_TESTS();
    const exam = _mockExams.find((e: any) => e._id === body.examId);
    const ts = _mockTestSeries.find((t: any) => t._id === body.testSeriesId);
    const created = {
      _id: 'test-' + Date.now(),
      ...body,
      examId: exam ? { _id: exam._id, name: exam.name } : body.examId,
      testSeriesId: ts ? { _id: ts._id, title: ts.title } : body.testSeriesId,
      sections: (body.sections || []).map((s: any) => ({
        ...s,
        _id: 'sec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        questions: s.questions ? s.questions.map((q: any) => typeof q === 'string' ? { _id: q, body: 'Question ' + q } : q) : [],
      })),
    };
    _mockTests.push(created);
    _persistMockData();
    return { success: true, data: created };
  }

  // Get Test detail
  if (endpoint.startsWith('/tests/') && method === 'GET' && !endpoint.includes('?')) {
    const id = endpoint.split('/')[2].split('?')[0];
    if (!_mockTests) _mockTests = MOCK_TESTS();
    const found = _mockTests.find(t => t._id === id);
    return { success: true, data: found || MOCK_TESTS()[0] };
  }

  // Update Test
  if (endpoint.startsWith('/tests/') && method === 'PUT') {
    const id = endpoint.split('/')[2];
    const body = JSON.parse(options.body as string);
    if (!_mockTests) _mockTests = MOCK_TESTS();
    const idx = _mockTests.findIndex(t => t._id === id);
    if (idx !== -1) {
      _mockTests[idx] = { ..._mockTests[idx], ...body, _id: id };
    }
    _persistMockData();
    return { success: true, data: _mockTests[idx] || _mockTests[0] };
  }

  // Delete Test
  if (method === 'DELETE') {
    const delMatch = endpoint.match(/^\/tests\/(.+?)(?:\?.*)?$/);
    if (delMatch) {
      const id = delMatch[1];
      const deleteQs = endpoint.includes('deleteQuestions=true');
      if (!_mockTests) _mockTests = MOCK_TESTS();
      if (deleteQs) {
        const test = _mockTests.find((t: any) => t._id === id);
        if (test) {
          const qIds = new Set((test.sections || []).flatMap((s: any) => (s.questions || []).map((q: any) => typeof q === 'string' ? q : q?._id)));
          if (!_mockQuestions) _mockQuestions = [...MOCK_QUESTIONS];
          _mockQuestions = _mockQuestions.filter((q: any) => !qIds.has(q._id));
        }
      }
      _mockTests = _mockTests.filter((t: any) => t._id !== id);
      _persistMockData();
      return { success: true, message: 'Test deleted successfully.' };
    }
  }

  // Start attempt
  if (endpoint === '/attempts/start' && method === 'POST') {
    const mt = MOCK_TESTS()[0];
    const answers = MOCK_QUESTIONS.map(q => ({
      questionId: q,
      sectionId: mt.sections[0]._id || 'sec-1',
      selectedAnswer: [],
      status: 'Not Visited',
      timeSpent: 0,
    }));
    activeAttemptSession = {
      _id: 'attempt-demo-1',
      studentId: 'usr-demo',
      testId: mt,
      status: 'In Progress',
      remainingSeconds: mt.duration * 60,
      answers,
      activeSectionIndex: 0,
      sectionTimeLeft: (mt.sections || []).map((s: any) => s.duration > 0 ? s.duration * 60 : 0),
    };
    return { success: true, data: activeAttemptSession };
  }

  // Save Progress
  if (endpoint.includes('/save') && method === 'PUT') {
    const { answers, remainingSeconds, activeSectionIndex, sectionTimeLeft } = JSON.parse(options.body as string);
    if (activeAttemptSession) {
      activeAttemptSession.answers = activeAttemptSession.answers.map((a: any) => {
        const matching = answers.find((na: any) => na.questionId === a.questionId._id);
        return matching ? { ...a, ...matching } : a;
      });
      activeAttemptSession.remainingSeconds = remainingSeconds;
      activeAttemptSession.activeSectionIndex = activeSectionIndex;
      if (sectionTimeLeft) activeAttemptSession.sectionTimeLeft = sectionTimeLeft;
    }
    return { success: true, message: 'Progress saved successfully.' };
  }

  // Submit test
  if (endpoint.includes('/submit') && method === 'POST') {
    if (activeAttemptSession) {
      activeAttemptSession.status = 'Submitted';
    }
    // Calculate scoring
    let score = 6;
    let correct = 3;
    let wrong = 1;
    let accuracy = 75;

    return {
      success: true,
      data: {
        _id: 'attempt-demo-1',
        testId: MOCK_TESTS()[0],
        status: 'Submitted',
        score,
        accuracy,
        attemptPercentage: 80,
        rank: 1,
        percentile: 100,
        sectionAnalysis: [
          {
            sectionName: 'Quantitative Aptitude & Reasoning',
            score,
            totalQuestions: MOCK_QUESTIONS.length,
            attempted: 4,
            correct,
            wrong,
            accuracy,
            timeSpent: 240,
          }
        ],
        answers: MOCK_QUESTIONS.map((q, idx) => ({
          questionId: q,
          selectedAnswer: idx === 0 ? ['A'] : idx === 1 ? ['A', 'D'] : idx === 2 ? ['60'] : idx === 3 ? ['B'] : [],
          status: idx < 4 ? 'Answered' : 'Not Visited',
          isCorrect: idx < 3,
          marksObtained: idx < 3 ? 2 : idx === 3 ? -0.5 : 0,
        }))
      }
    };
  }

  // Get results
  if (endpoint.includes('/results') && method === 'GET') {
    const score = 6;
    const correct = 3;
    const wrong = 1;
    const accuracy = 75;

    return {
      success: true,
      data: {
        attempt: {
          _id: 'attempt-demo-1',
        testId: MOCK_TESTS()[0],
          status: 'Submitted',
          score,
          accuracy,
          attemptPercentage: 80,
          rank: 2,
          percentile: 92.5,
          sectionAnalysis: [
            {
              sectionName: 'Quantitative Aptitude & Reasoning',
              score,
              totalQuestions: MOCK_QUESTIONS.length,
              attempted: 4,
              correct,
              wrong,
              accuracy,
              timeSpent: 240,
            }
          ],
          answers: MOCK_QUESTIONS.map((q, idx) => ({
            questionId: q,
            selectedAnswer: idx === 0 ? ['A'] : idx === 1 ? ['A', 'D'] : idx === 2 ? ['60'] : idx === 3 ? ['B'] : [],
            status: idx < 4 ? 'Answered' : 'Not Visited',
            isCorrect: idx < 3,
            marksObtained: idx < 3 ? 2 : idx === 3 ? -0.5 : 0,
            timeSpent: idx === 0 ? 40 : idx === 1 ? 80 : idx === 2 ? 100 : idx === 3 ? 20 : 0
          }))
        },
        analytics: {
          subjectBreakdown: [
            { name: 'Quantitative Aptitude', total: 3, correct: 2, attempted: 3, timeSpent: 220, accuracy: 66.6 },
            { name: 'General Science', total: 1, correct: 0, attempted: 1, timeSpent: 20, accuracy: 0 },
            { name: 'General Awareness', total: 1, correct: 1, attempted: 0, timeSpent: 0, accuracy: 100 }
          ],
          topicBreakdown: [
            { name: 'Profit and Loss', total: 1, correct: 1, attempted: 1, timeSpent: 40, accuracy: 100 },
            { name: 'Number System', total: 1, correct: 1, attempted: 1, timeSpent: 80, accuracy: 100 },
            { name: 'Time, Speed and Distance', total: 1, correct: 1, attempted: 1, timeSpent: 100, accuracy: 100 },
            { name: 'Biology - Digestion', total: 1, correct: 0, attempted: 1, timeSpent: 20, accuracy: 0 }
          ],
          difficultyBreakdown: [
            { level: 'Easy', total: 2, correct: 2, attempted: 2, timeSpent: 80, accuracy: 100 },
            { level: 'Medium', total: 2, correct: 1, attempted: 2, timeSpent: 60, accuracy: 50 },
            { level: 'Hard', total: 1, correct: 0, attempted: 0, timeSpent: 100, accuracy: 0 }
          ],
          weakAreas: [{ topic: 'Biology - Digestion', accuracy: 0, total: 1, attempted: 1 }],
          strongAreas: [
            { topic: 'Profit and Loss', accuracy: 100, total: 1, attempted: 1 },
            { topic: 'Number System', accuracy: 100, total: 1, attempted: 1 }
          ],
          examReadinessScore: 78
        }
      }
    };
  }

  // Bookmark folders
  if (endpoint === '/bookmarks/folders') {
    return { success: true, data: ['Starred Questions', 'Formulas', 'Speed Improvement'] };
  }

  // Get Bookmarks
  if (endpoint === '/bookmarks') {
    return {
      success: true,
      data: [
        { _id: 'bm-1', questionId: MOCK_QUESTIONS[0], folderName: 'Starred Questions', notes: 'Tricky logic' }
      ]
    };
  }

  // Distinct subjects
  if (endpoint === '/questions/subjects' && method === 'GET') {
    const qPool = _mockQuestions || MOCK_QUESTIONS;
    const subjects = [...new Set(qPool.map(q => q.subject).filter(Boolean))];
    return { success: true, data: subjects };
  }

  // List questions (with usageStatus support)
  if (endpoint.startsWith('/questions') && method === 'GET') {
    const qIdx = endpoint.indexOf('?');
    const params: Record<string, string> = {};
    if (qIdx !== -1) {
      new URLSearchParams(endpoint.slice(qIdx)).forEach((v, k) => { params[k] = v; });
    }
    const qPool = _mockQuestions || MOCK_QUESTIONS;
    let filtered = qPool.map(q => ({ ...q, usageStatus: (q as any).usageStatus || 'unused' }));
    if (params.subject) filtered = filtered.filter(q => q.subject?.toLowerCase() === params.subject.toLowerCase());
    if (params.topic) filtered = filtered.filter(q => q.topic?.toLowerCase().includes(params.topic.toLowerCase()));
    if (params.difficulty) filtered = filtered.filter(q => q.difficulty === params.difficulty);
    if (params.type) filtered = filtered.filter(q => q.type === params.type);
    if (params.usageStatus) filtered = filtered.filter(q => (q.usageStatus || 'unused') === params.usageStatus);
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(q => q.body?.toLowerCase().includes(s) || (q as any).tags?.some((t: string) => t.toLowerCase().includes(s)));
    }
    const limit = parseInt(params.limit || '20', 10);
    return { success: true, data: filtered.slice(0, limit), pagination: { total: filtered.length, page: 1, limit, pages: Math.ceil(filtered.length / limit) || 1 } };
  }

  // Bulk delete questions
  if (endpoint === '/questions/bulk-delete' && method === 'POST') {
    const body = JSON.parse(options.body as string || '{}');
    const ids: string[] = body.ids || [];
    if (!ids.length) return { success: false, message: 'No question IDs provided.' };
    if (!_mockQuestions) _mockQuestions = [...MOCK_QUESTIONS];
    _mockQuestions = _mockQuestions.filter((q: any) => !ids.includes(q._id));
    _persistMockData();
    return { success: true, message: `${ids.length} question(s) deleted.` };
  }

  // Paste questions — client-side structured parser for mock fallback
  if (endpoint === '/questions/paste' && method === 'POST') {
    const body = JSON.parse(options.body as string || '{}');
    const rawText = body.text || '';
    if (!rawText.trim()) return { success: false, message: 'No question text provided.' };

    const text = rawText.replace(/\r\n/g, '\n');
    const blocks = text.split(/\[NEXT\]/gi).map((b: string) => b.trim()).filter(Boolean);

    const extract = (block: string, marker: string) => {
      const regex = new RegExp(`\\[${marker}\\]([\\s\\S]*?)(?=\\[(?:CONTEXT|Q|SUB-Q|ST-START|MATCH-START|O_[a-d]|ANS|EXP|SUBJ|TOPIC|DIFFICULTY|TYPE|SRC|NEXT)\\]|$)`, 'i');
      const match = block.match(regex);
      return match ? match[1].trim() : '';
    };

    const parsed: any[] = [];
    let lastContext = '';
    let _pasteCounter = 0;

    for (const block of blocks) {
      if (/\[CONTEXT\]/i.test(block) && !/\[\s*Q\s*\]/i.test(block)) {
        const ctxMatch = block.match(/\[CONTEXT\]([\s\S]*)/i);
        if (ctxMatch) lastContext = ctxMatch[1].trim();
        continue;
      }
      if (!/\[\s*Q\s*\]/i.test(block)) continue;

      const qText = extract(block, 'Q');
      const subQ = extract(block, 'SUB-Q');
      const oa = extract(block, 'O_a');
      const ob = extract(block, 'O_b');
      const oc = extract(block, 'O_c');
      const od = extract(block, 'O_d');
      const ansRaw = extract(block, 'ANS');
      const expl = extract(block, 'EXP');
      const subj = extract(block, 'SUBJ');
      const topic = extract(block, 'TOPIC') || 'General';
      const typeOverride = extract(block, 'TYPE');
      const diffRaw = extract(block, 'DIFFICULTY');
      const difficulty = ['Easy', 'Medium', 'Hard'].includes(diffRaw) ? diffRaw : 'Medium';

      let statements: string[] = [];
      const stMatch = block.match(/\[ST-START\]([\s\S]*?)\[ST-END\]/i);
      if (stMatch) {
        statements = stMatch[1].split('\n').map((l: string) => l.trim().replace(/^\d+[\.\)]\s*/, '')).filter(Boolean);
      }

      let matchPairs: string[] = [];
      const mtMatch = block.match(/\[MATCH-START\]([\s\S]*?)\[MATCH-END\]/i);
      if (mtMatch) {
        matchPairs = mtMatch[1].split('\n').map((l: string) => l.trim()).filter(Boolean);
      }

      let body = qText;

      const options: { key: string; text: string }[] = [];
      const rawOpts = [['A', oa], ['B', ob], ['C', oc], ['D', od]];
      for (const [key, val] of rawOpts) {
        if (val) options.push({ key, text: val });
      }

      const correctAnswer = ansRaw.split(/[,&\s]+/).map((a: string) => a.trim().toUpperCase()).filter(Boolean);

      let type = typeOverride || 'Single Correct';
      if (['Numerical', 'Data Sufficiency'].includes(type) && options.length >= 2) {
        const hasLetterKeys = options.every((o) => ['A', 'B', 'C', 'D'].includes(o.key));
        if (hasLetterKeys) type = 'Single Correct';
      }

      if (!qText && !lastContext) continue;
      if (options.length === 0) continue;
      if (correctAnswer.length === 0) continue;

      const qId = `pq-${Date.now()}-${_pasteCounter++}`;
      parsed.push({
        body,
        context: lastContext || '',
        options,
        correctAnswer,
        type,
        subject: subj || 'General',
        topic,
        subtopic: '',
        difficulty,
        language: 'English',
        explanation: expl || 'No explanation provided.',
        source: '',
        year: new Date().getFullYear(),
        statements,
        matchPairs,
        subQ,
        _id: qId,
        usageStatus: 'unused',
        validationErrors: [],
      });
    }

    if (!_mockQuestions) _mockQuestions = [...MOCK_QUESTIONS];
    _mockQuestions.push(...parsed);
    _persistMockData();

    return { success: true, message: `${parsed.length} questions saved as unused.`, data: parsed };
  }

  // Staged questions
  if (endpoint === '/questions/staged/all') {
    return { success: true, data: MOCK_STAGED };
  }

  // Revision pending
  if (endpoint === '/practice/revision/pending') {
    return { success: true, data: MOCK_REVISIONS };
  }

  // Recommendations
  if (endpoint === '/practice/recommendations') {
    return { success: true, data: [] };
  }

  // Recommendations practice set
  if (endpoint.startsWith('/practice/generate')) {
    const qIdx = endpoint.indexOf('?');
    const params: Record<string, string> = {};
    if (qIdx !== -1) {
      new URLSearchParams(endpoint.slice(qIdx)).forEach((v, k) => { params[k] = v; });
    }
    let filtered = _mockQuestions || MOCK_QUESTIONS;
    if (params.subject) filtered = filtered.filter(q => q.subject?.toLowerCase() === params.subject.toLowerCase());
    if (params.topic) filtered = filtered.filter(q => q.topic?.toLowerCase().includes(params.topic.toLowerCase()));
    if (params.difficulty) filtered = filtered.filter(q => q.difficulty === params.difficulty);
    return { success: true, data: filtered.slice(0, parseInt(params.limit || '10', 10)) };
  }

  // Analytics: daily stats
  if (endpoint === '/analytics/daily-stats') {
    return { success: true, data: { streak: 0, questionsToday: 0, timeSpentToday: 0, scoreAvg: 0 } };
  }

  // Analytics: weak areas
  if (endpoint === '/analytics/weak-areas') {
    return { success: true, data: [] };
  }

  // Attempts history
  if (endpoint === '/attempts/history') {
    return { success: true, data: [] };
  }

  // Return empty/ok payload by default
  return { success: true, data: {} };
}

// Export wrapper helpers
export const api = {
  get: (endpoint: string) => request(endpoint, { method: 'GET' }),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
  
  upload: (endpoint: string, formData: FormData) => request(endpoint, {
    method: 'POST',
    body: formData,
  }),
};
