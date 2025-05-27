// auth/PrivateRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function PrivateRoute({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        // Redirige vers le login si l'utilisateur n'est pas connecté
        return <Navigate to="/login" replace />;
    }

    return children;
}
