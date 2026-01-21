import { UserRole } from '../context/AuthContext';

interface RoleBadgeProps {
  role: UserRole;
}

// Component to display user role as a colored badge
const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getRoleStyles = (role: UserRole) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'professor':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'recruiter':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'professor':
        return 'Professor';
      case 'recruiter':
        return 'HR / Recruiter';
      default:
        return role;
    }
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleStyles(role)}`}
    >
      {getRoleLabel(role)}
    </span>
  );
};

export default RoleBadge;
