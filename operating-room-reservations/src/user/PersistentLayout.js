import React from 'react';
import { Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUserCircle, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './PersistentLayout.css';

const PersistentLayout = () => {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();

    const getDisplayName = () => {
        if (!currentUser && !userData) return "Chargement...";
        if (userData?.name) return userData.name;
        if (currentUser?.displayName) return currentUser.displayName;
        return "Utilisateur";
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
            alert("Déconnexion échouée");
        }
    };

    return (
        <div className="app-container">
            {/* Fixed Navigation Bar */}
            <nav className="fixed-navbar">
                <div className="navbar-brand">
                    <FontAwesomeIcon icon={faCalendarAlt} className="navbar-icon" />
                    <span>InterventionPlan</span>
                </div>

                <div className="navbar-user">
                    <FontAwesomeIcon icon={faUserCircle} className="user-icon" />
                    <span className="user-name">{getDisplayName()}</span>
                    {userData?.role === 'admin' && (
                        <span className="user-role">Admin</span>
                    )}
                    <button className="logout-btn" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                </div>
            </nav>

            {/* Content Area (will change based on route) */}
            <main className="content-area">
                <Outlet /> {/* This is where child routes will render */}
            </main>
        </div>
    );
};

export default PersistentLayout;