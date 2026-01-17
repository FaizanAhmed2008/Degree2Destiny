# Degree2Destiny

Degree2Destiny is a skill-driven career platform that helps students become job-ready through real-world tasks and role-based assessments. It shows how close a student is to a target role, highlights missing skills, enables professors to guide progress, and allows companies to hire talent based on verified skills.

## Features

- **Student Dashboard**: Track your progress towards target roles and identify missing skills
- **Professor Dashboard**: Guide and assess student progress
- **Company Dashboard**: Discover and hire talent based on verified skills
- **Role-based Authentication**: Secure access for students, professors, and companies

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Firebase** - Authentication and Firestore database
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Degree2Destiny.git
cd Degree2Destiny
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration values from the Firebase Console

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── components/     # Reusable React components
├── context/       # React context providers
├── firebase/      # Firebase configuration
├── pages/         # Next.js pages and routes
└── styles/        # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.
