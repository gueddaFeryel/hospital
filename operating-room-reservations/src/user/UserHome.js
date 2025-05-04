import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faPlus,
    faList,
    faUserCircle,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import UserCalendarView from './UserCalendarView';
import './UserHome.css';
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useAuth } from '../auth/AuthContext';

const UserHome = () => {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();

    // Debugging logs
    React.useEffect(() => {
        console.log('Current User:', currentUser);
        console.log('User Data:', userData);
    }, [currentUser, userData]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
            alert("Une erreur est survenue lors de la déconnexion");
        }
    };

    const getDisplayName = () => {
        if (!currentUser && !userData) return "Chargement...";

        // Priority 1: Firestore name fields
        if (userData) {
            if (userData.name) return userData.name;
            if (userData.firstName || userData.lastName) {
                return [userData.firstName, userData.lastName].filter(Boolean).join(' ');
            }
        }

        // Priority 2: Auth displayName
        if (currentUser?.displayName) return currentUser.displayName;

        // Priority 3: Email username
        if (currentUser?.email) {
            return currentUser.email.split('@')[0];
        }

        // Final fallback
        return "Utilisateur";
    };

    return (
        <div className="user-app-container">
            {/* Navigation Bar */}
            <nav className="user-navbar">
                <div className="navbar-brand">
                    <FontAwesomeIcon icon={faCalendarAlt} className="navbar-icon" />
                    <span>InterventionPlan</span>
                </div>

                <div className="navbar-user">
                    <FontAwesomeIcon icon={faUserCircle} className="user-icon" />
                    <div className="user-info">
                        <span className="user-name">{getDisplayName()}</span>
                        {userData?.role === 'admin' && (
                            <span className="user-role">Administrateur</span>
                        )}
                    </div>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                        aria-label="Déconnexion"
                    >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="user-main-content">
                <div className="user-home">
                    <header className="page-header">
                        <h1>Mon Calendrier d'Interventions</h1>
                        <p>Bienvenue, {getDisplayName()}</p>
                    </header>

                    <div className="quick-actions-grid">
                        <Link to="/request-intervention" className="action-card primary">
                            <div className="card-icon">
                                <FontAwesomeIcon icon={faPlus} />
                            </div>
                            <h3>Demander une intervention</h3>
                            <p>Créer une nouvelle demande d'intervention chirurgicale</p>
                        </Link>

                        <Link to="/mes-interventions" className="action-card secondary">
                            <div className="card-icon">
                                <FontAwesomeIcon icon={faList} />
                            </div>
                            <h3>Mes interventions</h3>
                            <p>Voir toutes vos interventions programmées</p>
                        </Link>
                    </div>

                    <section className="calendar-section">
                        <div className="section-header">
                            <h2>Vue Calendrier</h2>
                            <div className="view-options">
                                <button className="active">Jour</button>
                                <button>Semaine</button>
                                <button>Mois</button>
                            </div>
                        </div>
                        <UserCalendarView />
                    </section>
                </div>
            </main>
        </div>
    );
};

export default UserHome;