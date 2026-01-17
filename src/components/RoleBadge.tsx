import { UserRole } from '../context/AuthContext';

interface RoleBadgeProps {
  role: UserRole;
}

// Component to display user role as a colored badge
const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getRoleStyles = (role: UserRole) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'professor':
        return 'bg-purple-100 text-purple-800';
      case 'company':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'professor':
        return 'Professor';
      case 'company':
        return 'Company';
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
