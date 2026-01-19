import React, { useState, useRef, useEffect } from 'react';
import { useAuth, UserRole } from '../context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatbotProps {
  role: UserRole;
}

// AI Chatbot component with role-specific responses
const Chatbot: React.FC<ChatbotProps> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: getWelcomeMessage(role),
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Role-specific responses
    if (role === 'student') {
      if (lowerMessage.includes('skill') || lowerMessage.includes('improve') || lowerMessage.includes('help')) {
        return "I can help you improve your skills! Here are some suggestions:\n\n1. Focus on skills with scores below 70%\n2. Practice regularly and take on projects\n3. Seek feedback from professors\n4. Complete skill assessments\n5. Join study groups or workshops\n\nWhich skill would you like to work on?";
      }
      if (lowerMessage.includes('next step') || lowerMessage.includes('career') || lowerMessage.includes('path')) {
        return "Based on your current readiness score, here's your next steps:\n\n1. Identify your target role\n2. Compare your skills with role requirements\n3. Focus on skill gaps\n4. Build a portfolio showcasing your skills\n5. Network with companies and professionals\n\nWould you like me to analyze your skill gaps?";
      }
      if (lowerMessage.includes('readiness') || lowerMessage.includes('score') || lowerMessage.includes('progress')) {
        return "Your readiness score reflects how prepared you are for your target role. To improve:\n\n• Complete skill assessments\n• Work on projects\n• Get certifications\n• Seek mentorship\n\nYour current progress is visible on your dashboard. Keep working on areas with lower scores!";
      }
    }

    if (role === 'professor') {
      if (lowerMessage.includes('student') || lowerMessage.includes('find') || lowerMessage.includes('search')) {
        return "I can help you find students! Here's how:\n\n1. Use the search bar on your dashboard\n2. Filter by readiness score\n3. View students by skill level\n4. Check student progress over time\n\nWould you like to see students who need attention?";
      }
      if (lowerMessage.includes('progress') || lowerMessage.includes('track') || lowerMessage.includes('monitor')) {
        return "You can track student progress through:\n\n• Dashboard analytics showing average readiness\n• Individual student profiles\n• Skill breakdown by student\n• Progress trends over time\n\nCheck the 'All Students' section for detailed views.";
      }
      if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
        return "I'm here to help you guide your students! I can assist with:\n\n• Finding students who need attention\n• Tracking overall class progress\n• Identifying skill gaps\n• Providing student recommendations\n\nWhat would you like to know?";
      }
    }

    if (role === 'company') {
      if (lowerMessage.includes('student') || lowerMessage.includes('candidate') || lowerMessage.includes('find')) {
        return "I can help you find the best candidates! Here's how:\n\n1. Use filters to find candidates by readiness score\n2. Search for specific skills\n3. View shortlisted candidates\n4. Check candidate profiles\n\nWould you like to see top candidates or new students for internships?";
      }
      if (lowerMessage.includes('intern') || lowerMessage.includes('internship') || lowerMessage.includes('new')) {
        return "For internship roles, I recommend:\n\n• Looking at students with 60-80% readiness (great potential)\n• Checking students with strong foundational skills\n• Reviewing recent activity and progress\n• Focusing on students eager to learn\n\nUse the filter to find candidates in the 60-80% range for internships.";
      }
      if (lowerMessage.includes('best') || lowerMessage.includes('top') || lowerMessage.includes('excellent')) {
        return "Top candidates typically have:\n\n• Readiness score above 80%\n• Strong skill diversity\n• Consistent progress\n• Good communication skills\n\nFilter candidates with 80%+ readiness to see the best matches. You can also check shortlisted candidates!";
      }
      if (lowerMessage.includes('hire') || lowerMessage.includes('recruit')) {
        return "To find the right candidates:\n\n1. Set minimum readiness score based on role requirements\n2. Review candidate skills and profiles\n3. Shortlist promising candidates\n4. Check their progress and activity\n\nWhat type of role are you looking to fill?";
      }
    }

    // General responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `Hello! I'm your AI assistant. How can I help you today?`;
    }
    if (lowerMessage.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    if (lowerMessage.includes('help')) {
      return "I'm here to help! You can ask me about:\n\n• Your progress and skills\n• Finding students/candidates\n• Next steps and recommendations\n• Using the platform features\n\nWhat would you like to know?";
    }

    return "I understand you're asking about that. Could you provide more details? I can help you with skills, progress, finding students, or using the platform features.";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Try to use Destiny AI service, fallback to rule-based if it fails
      const response = await fetch('/api/destiny-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          role,
          contextData: {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response || getAIResponse(currentInput),
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        console.error('[Destiny AI] HTTP error from API:', response.status);
        throw new Error('Destiny AI service unavailable');
      }
    } catch (error) {
      console.error('[Destiny AI] Falling back to rule-based response:', error);
      // Fallback to rule-based responses
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(currentInput),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = getQuickActions(role);

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-indigo-600 dark:bg-indigo-700 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all duration-200 hover:scale-110"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="bg-indigo-600 dark:bg-indigo-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <h3 className="font-semibold">Destiny AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(action);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function getWelcomeMessage(role: UserRole): string {
  switch (role) {
    case 'student':
      return "👋 Hello! I'm Destiny AI, your career copilot. I can help you:\n\n• Improve your skills\n• Plan your next steps\n• Understand your progress\n• Get career guidance\n\nHow can I help you today?";
    case 'professor':
      return "👋 Hello Professor! I'm Destiny AI. I can help you:\n\n• Find and track students\n• Monitor student progress\n• Identify students who need attention\n• Analyze class performance\n\nWhat would you like to know?";
    case 'company':
      return "👋 Hello! I'm Destiny AI. I can help you:\n\n• Find the best candidates\n• Discover new students for internships\n• Filter candidates by skills\n• Get hiring recommendations\n\nHow can I assist you today?";
    default:
      return "Hello! How can I help you?";
  }
}

function getQuickActions(role: UserRole): string[] {
  switch (role) {
    case 'student':
      return ['How to improve skills?', 'What are my next steps?', 'Check my progress'];
    case 'professor':
      return ['Find students', 'Track progress', 'View analytics'];
    case 'company':
      return ['Find best candidates', 'New students for internships', 'View shortlisted'];
    default:
      return [];
  }
}

export default Chatbot;
