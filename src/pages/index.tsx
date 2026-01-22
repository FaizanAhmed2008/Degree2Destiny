import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';

// FAQ Item Component with Accordion
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
          {question}
        </span>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
};

// Enhanced smooth scroll function with easing (client-side only)
const smoothScrollTo = (element: HTMLElement, offset: number = 80) => {
  if (typeof window === 'undefined') return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.scrollY - offset;
  
  const startPosition = window.scrollY;
  const distance = offsetPosition - startPosition;
  const duration = Math.min(Math.abs(distance) * 0.5, 1000); // Max 1 second
  let start: number | null = null;

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animation = (currentTime: number) => {
    if (start === null) start = currentTime;
    const timeElapsed = currentTime - start;
    const progress = Math.min(timeElapsed / duration, 1);
    const ease = easeInOutCubic(progress);
    
    window.scrollTo(0, startPosition + distance * ease);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  };

  requestAnimationFrame(animation);
};

// Landing page with hero section, animations, and About Us
const Home = () => {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Redirect authenticated users to their dashboard (only once)
  useEffect(() => {
    if (currentUser && userProfile && userProfile.role) {
      // Use replace instead of push to avoid back button issues
      const targetPath = 
        userProfile.role === 'student' ? '/student/dashboard' :
        userProfile.role === 'professor' ? '/professor/dashboard' :
        userProfile.role === 'recruiter' ? '/recruiter/dashboard' :
        null;
      
      if (targetPath && router.pathname === '/') {
        router.replace(targetPath);
      }
    }
  }, [currentUser, userProfile, router]);

  // Animation trigger
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (id: string) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const element = document.getElementById(id);
    if (element) {
      // Use enhanced smooth scroll with easing
      if ('requestAnimationFrame' in window) {
        smoothScrollTo(element, 80);
      } else {
        // Fallback for older browsers
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const win = window as Window & typeof globalThis;
        const offsetPosition = elementPosition + win.scrollY - headerOffset;
        win.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60 dark:opacity-50"
            poster="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&h=1080&fit=crop"
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
            {/* Fallback image if video doesn't load */}
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&h=1080&fit=crop"
              alt="Professional workspace"
              className="w-full h-full object-cover"
            />
          </video>
          {/* Overlay gradient - reduced opacity for better video visibility */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-pink-900/60 dark:from-gray-900/70 dark:via-gray-900/65 dark:to-gray-900/70"></div>
        </div>

        {/* Hero Content */}
        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 animate-slide-in">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100">
                Degree2Destiny
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-4 max-w-3xl mx-auto animate-fade-in-delay">
              Transform Your Skills Into Career Success
            </p>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fade-in-delay-2">
              A skill-driven platform connecting ambitious students, dedicated professors, and HR / recruiters
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-3">
              <button
                onClick={() => router.push('/register')}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                Get Started Free
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 border-2 border-white/30 hover:border-white/50"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Degree2Destiny?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to bridge the gap between education and career success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Skill Gap Analysis */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Skill Gap Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Identify areas for improvement with comprehensive skill assessments and personalized gap analysis
              </p>
            </div>

            {/* Feature 2 - Job Matching */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Job Matching</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Connect with relevant opportunities that match your skills and career goals
              </p>
            </div>

            {/* Feature 3 - Student Performance Tracking */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Performance Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Monitor your progress with real-time readiness scores, aptitude tests, and detailed analytics
              </p>
            </div>

            {/* Feature 4 - Recruiter Insights */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Recruiter Insights</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Access detailed candidate profiles with verified skills, performance metrics, and readiness scores
              </p>
            </div>

            {/* Feature 5 - Smart Dashboards */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Smart Dashboards</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Visualize your data with interactive charts, performance graphs, and comprehensive analytics
              </p>
            </div>

            {/* Feature 6 - Placement Readiness Score */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Placement Readiness Score</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Get an accurate measure of your job readiness with our comprehensive scoring system
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Tech Stack Used
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Built with modern technologies for optimal performance and scalability
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {/* React */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">⚛️</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">React</h3>
            </div>

            {/* Next.js */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">▲</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Next.js</h3>
            </div>

            {/* Node.js */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">🟢</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Node.js</h3>
            </div>

            {/* Firebase */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">🔥</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Firebase</h3>
            </div>

            {/* Recharts */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recharts</h3>
            </div>

            {/* Tailwind CSS */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">💨</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Tailwind CSS</h3>
            </div>

            {/* TypeScript */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">TypeScript</h3>
            </div>

            {/* AI API */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Gemini AI</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Meet the Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              The talented individuals behind Degree2Destiny
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Team Member 1 - Faizan */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                FA
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Faizan Ahmed</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Lead Developer and Backend Engineer</p>
            </div>

            {/* Team Member 2 - Mustafa */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                MK
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mustafa Khan</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">UI/UX + Frontend Developer</p>
            </div>

            {/* Team Member 3 - Mohammad Arifi */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                MA
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mohammad Arifi</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Helper, Video Creator, and Prototype Generator</p>
            </div>

            {/* Team Member 4 - Inshra Shaikh */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                IS
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Inshra Shaikh</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Project Ideation and Presentation</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                About Degree2Destiny
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                We believe that every student deserves a clear path from education to their dream career. 
                Degree2Destiny bridges the gap between academic learning and real-world job requirements.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Our platform empowers students to track their skill development, enables professors to 
                guide student progress effectively, and helps companies discover talented candidates 
                based on verified skills and readiness scores.
              </p>
              <div className="grid grid-cols-2 gap-6 mt-8">
                <div>
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">1000+</div>
                  <div className="text-gray-600 dark:text-gray-400">Active Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">500+</div>
                  <div className="text-gray-600 dark:text-gray-400">Companies</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">200+</div>
                  <div className="text-gray-600 dark:text-gray-400">Professors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">95%</div>
                  <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                  alt="Students collaborating"
                  className="rounded-lg shadow-xl w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                  alt="Professional meeting"
                  className="rounded-lg shadow-xl w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="space-y-4 pt-8">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop"
                  alt="Team working together"
                  className="rounded-lg shadow-xl w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                />
                <img
                  src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop"
                  alt="Success celebration"
                  className="rounded-lg shadow-xl w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of students, professors, and companies already using Degree2Destiny
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Start Your Journey
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-all duration-300 border-2 border-white/30 hover:border-white/50"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Find answers to common questions about Degree2Destiny
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ Item 1 */}
            <FAQItem
              question="What is the purpose of this platform?"
              answer="Degree2Destiny bridges the gap between education and career success by connecting ambitious students, dedicated professors, and HR / recruiters. It provides a comprehensive skill-driven platform for tracking student progress, verifying skills, and facilitating career placements."
            />

            {/* FAQ Item 2 */}
            <FAQItem
              question="How does the placement readiness system work?"
              answer="Our placement readiness system evaluates students based on multiple factors including technical skills, aptitude scores, communication abilities, and verified assessments. Students receive an overall readiness score (0-100%) and can see detailed breakdowns across different skill categories. This helps identify areas for improvement and tracks progress over time."
            />

            {/* FAQ Item 3 */}
            <FAQItem
              question="Are student scores real or simulated?"
              answer="Student scores are a combination of verified assessments, skill evaluations, and performance metrics. The platform uses both real assessment data from professors and AI-generated insights. Mock scores (aptitude, technical, communication) are generated for demonstration purposes and can be replaced with actual assessment results."
            />

            {/* FAQ Item 4 */}
            <FAQItem
              question="Can recruiters view student profiles?"
              answer="Yes, recruiters can view comprehensive student profiles including skills, scores, projects, and performance metrics. They can filter candidates by readiness score, skills, and verification status. However, students maintain control over their privacy settings and can choose what information is visible to recruiters."
            />

            {/* FAQ Item 5 */}
            <FAQItem
              question="Who can access dashboards?"
              answer="The platform has three main user roles: Students can access their personal dashboard with skill tracking and progress analytics. Professors can view their assigned students' progress and manage assessments. Recruiters can browse verified candidate profiles and shortlist potential hires. Each role has specific permissions and dashboard features tailored to their needs."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="md" showText={true} textClassName="text-white font-bold text-lg" />
              </div>
              <p className="text-sm">
                Bridging the gap between education and career success.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => router.push('/register')} className="hover:text-white transition-colors">For Students</button></li>
                <li><button onClick={() => router.push('/register')} className="hover:text-white transition-colors">For Professors</button></li>
                <li><button onClick={() => router.push('/register')} className="hover:text-white transition-colors">For HR / Recruiters</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => router.push('/register')} className="hover:text-white transition-colors">Sign Up</button></li>
                <li><button onClick={() => router.push('/login')} className="hover:text-white transition-colors">Login</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy;2026 Alpha Devs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
