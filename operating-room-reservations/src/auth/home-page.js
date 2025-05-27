import React from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';

function Home() {
    const { currentUser } = useAuth();

    return (
        <div className="container mt-5 text-center">
            <h1>Bienvenue sur notre application</h1>

            {currentUser ? (
                <div className="mt-4">
                    <Link to="/profile" className="btn btn-primary">
                        Accéder à votre profil
                    </Link>
                </div>
            ) : (
                <div className="mt-4">
                    <Link to="/login" className="btn btn-primary me-2">
                        Se connecter
                    </Link>
                    <Link to="/signup" className="btn btn-secondary">
                        S'inscrire
                    </Link>
                </div>
            )}
        </div>
    );
}

export default Home;
