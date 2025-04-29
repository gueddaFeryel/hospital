import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

function Navbar() {
    const { currentUser, userData } = useAuth();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <Link className="navbar-brand" to="/">Mon Application</Link>

                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto">
                        {currentUser && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/profile">Profil</Link>
                            </li>
                        )}
                        {userData?.role === 'admin' && (
                            <li className="nav-item">
                                <Link className="nav-link" to="/admin">Admin</Link>
                            </li>
                        )}
                    </ul>

                    <div className="d-flex">
                        {currentUser ? (
                            // eslint-disable-next-line no-undef
                            <button className="btn btn-outline-light" onClick={() => auth.signOut()}>
                                Déconnexion
                            </button>
                        ) : (
                            <>
                                <Link className="btn btn-outline-light me-2" to="/login">
                                    Connexion
                                </Link>
                                <Link className="btn btn-primary" to="/signup">
                                    Inscription
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
