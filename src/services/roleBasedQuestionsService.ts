/**
 * Role-Based Questions Service
 *
 * Provides technical questions specific to each job role
 * - Data Analyst
 * - Cyber Security Engineer
 * - Full Stack Developer
 *
 * Fixes Bug #4: Role-based question filtering
 * Ensures each student gets role-appropriate technical questions
 */

export interface TechnicalQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  difficulty: "easy" | "medium" | "hard";
  roleSpecific: string; // Which role this is for
}

// ============================================
// DATA ANALYST TECHNICAL QUESTIONS
// ============================================

export const DATA_ANALYST_QUESTIONS: TechnicalQuestion[] = [
  {
    id: "da_tech_1",
    question:
      "Which SQL query would return the top 3 departments by average salary?",
    options: [
      "SELECT department, AVG(salary) AS avg_sal FROM employees GROUP BY department ORDER BY avg_sal DESC LIMIT 3",
      "SELECT TOP 3 department, AVG(salary) FROM employees",
      "SELECT department FROM employees WHERE salary > AVG(salary)",
      "SELECT * FROM employees ORDER BY salary DESC LIMIT 3",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Data Analyst",
  },
  {
    id: "da_tech_2",
    question: "What does normalization in database design primarily prevent?",
    options: [
      "Data redundancy and inconsistencies",
      "Slow query performance",
      "Unauthorized access",
      "Data corruption",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Data Analyst",
  },
  {
    id: "da_tech_3",
    question:
      'In pandas, how would you filter a DataFrame for rows where column "age" is greater than 30?',
    options: [
      'df[df["age"] > 30]',
      'df.filter(column="age", value=30)',
      "df.where(age > 30)",
      "df.select(df.age > 30)",
    ],
    correct: 0,
    difficulty: "easy",
    roleSpecific: "Data Analyst",
  },
  {
    id: "da_tech_4",
    question:
      "Which visualization is best for showing relationship between two continuous variables?",
    options: ["Scatter plot", "Bar chart", "Pie chart", "Line chart"],
    correct: 0,
    difficulty: "easy",
    roleSpecific: "Data Analyst",
  },
  {
    id: "da_tech_5",
    question: "What is the purpose of a pivot table in data analysis?",
    options: [
      "To summarize and reorganize data for easier analysis",
      "To backup data safely",
      "To encrypt sensitive information",
      "To sort data alphabetically",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Data Analyst",
  },
];

// ============================================
// CYBER SECURITY ENGINEER QUESTIONS
// ============================================

export const CYBER_SECURITY_QUESTIONS: TechnicalQuestion[] = [
  {
    id: "cs_tech_1",
    question:
      "Which encryption algorithm is considered broken and should NOT be used?",
    options: ["MD5 (Message Digest)", "AES-256", "RSA-2048", "SHA-256"],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Cyber Security Engineer",
  },
  {
    id: "cs_tech_2",
    question: "What is the primary purpose of a firewall?",
    options: [
      "Monitor and control network traffic based on security rules",
      "Encrypt all data on the network",
      "Backup data regularly",
      "Speed up internet connection",
    ],
    correct: 0,
    difficulty: "easy",
    roleSpecific: "Cyber Security Engineer",
  },
  {
    id: "cs_tech_3",
    question: "Which of these is NOT a type of malware?",
    options: ["Antivirus software", "Trojan", "Ransomware", "Worm"],
    correct: 0,
    difficulty: "easy",
    roleSpecific: "Cyber Security Engineer",
  },
  {
    id: "cs_tech_4",
    question: "What does a DDoS attack attempt to do?",
    options: [
      "Overwhelm a system with traffic to make it unavailable",
      "Steal personal data from users",
      "Modify website content",
      "Encrypt user files for ransom",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Cyber Security Engineer",
  },
  {
    id: "cs_tech_5",
    question: "Which practice is most important for cybersecurity?",
    options: [
      "Regular security audits and updates",
      "Expensive hardware",
      "Multiple internet connections",
      "Bright office lighting",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Cyber Security Engineer",
  },
];

// ============================================
// FULL STACK DEVELOPER QUESTIONS
// ============================================

export const FULL_STACK_DEVELOPER_QUESTIONS: TechnicalQuestion[] = [
  {
    id: "fsd_tech_1",
    question: "What is the purpose of middleware in Express.js?",
    options: [
      "To intercept and process requests/responses in the pipeline",
      "To store session data",
      "To render HTML templates",
      "To manage database connections",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Full Stack Developer",
  },
  {
    id: "fsd_tech_2",
    question: "In React, what is the primary use of the useEffect hook?",
    options: [
      "To perform side effects after render",
      "To manage component state",
      "To handle form submissions",
      "To style components",
    ],
    correct: 0,
    difficulty: "easy",
    roleSpecific: "Full Stack Developer",
  },
  {
    id: "fsd_tech_3",
    question:
      "Which HTTP method is used to retrieve data without modifying server state?",
    options: ["GET", "POST", "PUT", "DELETE"],
    correct: 0,
    difficulty: "easy",
    roleSpecific: "Full Stack Developer",
  },
  {
    id: "fsd_tech_4",
    question: "What does REST stand for?",
    options: [
      "Representational State Transfer",
      "Remote Execution System Transfer",
      "Redundant Server Transfer",
      "Real-time Encryption Service",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Full Stack Developer",
  },
  {
    id: "fsd_tech_5",
    question: "In MongoDB, what is a collection?",
    options: [
      "A set of documents (similar to a table in SQL)",
      "A backup of data",
      "A connection pool",
      "An index on data",
    ],
    correct: 0,
    difficulty: "medium",
    roleSpecific: "Full Stack Developer",
  },
];

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get technical questions for a specific role
 * CRITICAL FIX: Returns role-appropriate questions
 */
export function getTechnicalQuestionsForRole(
  role: string,
): TechnicalQuestion[] {
  const normalizedRole = role.toLowerCase().trim();

  if (normalizedRole.includes("data analyst")) {
    return DATA_ANALYST_QUESTIONS;
  } else if (
    normalizedRole.includes("cyber security") ||
    normalizedRole.includes("security")
  ) {
    return CYBER_SECURITY_QUESTIONS;
  } else if (
    normalizedRole.includes("full stack") ||
    normalizedRole.includes("fullstack")
  ) {
    return FULL_STACK_DEVELOPER_QUESTIONS;
  }

  // Default: return empty array if role not recognized
  console.warn(`[Role-Based Questions] Unknown role: ${role}`);
  return [];
}

/**
 * Get all available roles
 */
export function getAvailableRoles(): string[] {
  return ["Data Analyst", "Cyber Security Engineer", "Full Stack Developer"];
}

/**
 * Validate if role is supported
 */
export function isSupportedRole(role: string): boolean {
  return getAvailableRoles().some(
    (r) => r.toLowerCase() === role.toLowerCase(),
  );
}
