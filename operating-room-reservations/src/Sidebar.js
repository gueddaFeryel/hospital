import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserClock,
    faCalendarCheck,
    faChartBar,
    faCog,
    faSignOutAlt,
    faHome,
    faUserMd,
    faBed,
    faSyringe
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './auth/AuthContext';
import './Sidebar.css';
import {signOut} from "firebase/auth";
import {auth} from "./auth/auth";

const Sidebar = () => {
    const location = useLocation();
    const { userData, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            alert("Une erreur est survenue lors de la déconnexion");
        }
    };



    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h3>Tableau de Bord</h3>
            </div>

            <nav className="sidebar-nav">
                <ul>

                    <li className={location.pathname === '/' || location.pathname === '/home' ? 'active' : ''}>
                        <Link to={userData?.role === 'admin' ? '/InterventionCalendar' : '/home'}>
                            <FontAwesomeIcon icon={faHome}/>
                            <span>Accueil</span>
                        </Link>
                    </li>
                    <li className={location.pathname === '/dashboard' || location.pathname === '/home' ? 'active' : ''}>
                        <Link to={userData?.role === 'admin' ? '/dashboard' : '/home'}>
                            <FontAwesomeIcon icon={faHome}/>
                            <span>Utilisateurs non approvés</span>
                        </Link>
                    </li>

                    {userData?.role === 'admin' && (
                        <>
                            <li className={location.pathname === '/interventionList' ? 'active' : ''}>
                                <Link to="/interventionList">
                                    <FontAwesomeIcon icon={faUserMd}/>
                                    <span>Interventions</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/reservations' ? 'active' : ''}>
                                <Link to="/reservations">
                                    <FontAwesomeIcon icon={faCalendarCheck}/>
                                    <span>Réservations</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/salles' ? 'active' : ''}>
                                <Link to="/salles">
                                    <FontAwesomeIcon icon={faBed}/>
                                    <span>Salles</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/staff' ? 'active' : ''}>
                                <Link to="/staff">
                                    <FontAwesomeIcon icon={faUserClock}/>
                                    <span>Équipe Médicale</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/materiels' ? 'active' : ''}>
                                <Link to="/materiels">
                                    <FontAwesomeIcon icon={faSyringe}/>
                                    <span>Matériels</span>
                                </Link>
                            </li>
                        </>
                    )}

                    {(userData?.role === 'MEDECIN' || userData?.role === 'INFIRMIER' || userData?.role === 'ANESTHESISTE') && (
                        <>
                            <li className={location.pathname === '/calendar' ? 'active' : ''}>
                                <Link to="/calendar">
                                    <FontAwesomeIcon icon={faCalendarCheck}/>
                                    <span>Calendrier</span>
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt}/>
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
