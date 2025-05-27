import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserClock,
    faCalendarCheck,
    faChartBar,
    faSignOutAlt,
    faHome,
    faUserMd,
    faBed,
    faSyringe,
    faUserCircle,
    faClipboardList,
    faBars,
    faChevronDown,
    faChevronUp,
    faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from './auth/auth';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [showAlert, setShowAlert] = useState(false);
    const [profileInfo, setProfileInfo] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            alert('Une erreur est survenue lors de la déconnexion');
        }
    };

    const showProfileAlert = () => {
        const formatSpecialty = (specialty) => {
            if (!specialty) return 'Non spécifiée';
            return specialty
                .toLowerCase()
                .replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        const getSpecialty = () => {
            if (userData?.role === 'MEDECIN') {
                return formatSpecialty(userData?.specialiteMedecin);
            } else if (userData?.role === 'ANESTHESISTE') {
                return formatSpecialty(userData?.specialiteAnesthesiste);
            }
            return 'Non applicable';
        };

        const profile = `
Nom: ${userData?.nom || 'Non disponible'}
Prénom: ${userData?.prenom || 'Non disponible'}
Email: ${userData?.email || 'Non disponible'}
Rôle: ${userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1).toLowerCase() : 'Non disponible'}
${(userData?.role === 'MEDECIN' || userData?.role === 'ANESTHESISTE') ? `Spécialité: ${getSpecialty()}` : ''}
Statut: ${userData?.isApproved ? 'Approuvé' : 'En attente'}
${userData?.approvedAt ? `Approuvé le: ${new Date(userData.approvedAt).toLocaleDateString('fr-FR')}` : ''}
        `.trim();

        setProfileInfo(profile);
        setShowAlert(true);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const toggleAdminMenu = () => {
        setIsAdminMenuOpen(!isAdminMenuOpen);
    };

    // Vérification des rôles
    const isAdmin = userData?.role === 'admin';
    const isManager = userData?.role === 'GESTIONNAIRE_ADMIN';
    const isMedicalStaff = ['MEDECIN', 'INFIRMIER', 'ANESTHESISTE'].includes(userData?.role);
    const isAdminOrManager = isAdmin || isManager;

    return (
        <header className="sidebar">
            <div className="sidebar-header">
                <h3>Tableau de Bord</h3>
                <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                    <FontAwesomeIcon icon={faBars} />
                </button>
            </div>

            <nav className={`sidebar-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                <ul>
                    <li className={location.pathname === '/' || location.pathname === '/home' ? 'active' : ''}>
                        <Link to={isAdminOrManager ? "/InterventionCalendar" : "/home"}>
                            <FontAwesomeIcon icon={faHome} />
                            <span>Accueil</span>
                        </Link>
                    </li>

                    {isAdminOrManager && (
                        <>
                            <li className="admin-menu-item">
                                <div
                                    className={`admin-menu-header ${isAdminMenuOpen ? 'open' : ''}`}
                                    onClick={toggleAdminMenu}
                                >
                                    <FontAwesomeIcon icon={faClipboardList}/>
                                    <span>Gestion</span>
                                    <FontAwesomeIcon
                                        icon={isAdminMenuOpen ? faChevronUp : faChevronDown}
                                        className="admin-menu-chevron"
                                    />
                                </div>
                                {isAdminMenuOpen && (
                                    <ul className="admin-submenu">
                                        {(isAdmin || isManager) && (
                                            <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                                                <Link to="/dashboard">
                                                    <span>Utilisateurs non approuvés</span>
                                                </Link>
                                            </li>
                                        )}
                                        <li className={location.pathname === '/intervention-requests' ? 'active' : ''}>
                                            <Link to="/intervention-requests">
                                                <span>Demandes d'intervention</span>
                                            </Link>
                                        </li>
                                        <li className={location.pathname === '/InterventionCalendar' ? 'active' : ''}>
                                            <Link to="/InterventionCalendar">
                                                <span>Calendrier des interventions</span>
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </li>

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
                            <li className={location.pathname === '/patients' ? 'active' : ''}>
                                <Link to="/patients">
                                    <FontAwesomeIcon icon={faUserClock}/>
                                    <span>patients</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/patientslist' ? 'active' : ''}>
                                <Link to="/patientslist">
                                    <FontAwesomeIcon icon={faUserClock}/>
                                    <span>patientsliste</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/materiels' ? 'active' : ''}>
                                <Link to="/materiels">
                                    <FontAwesomeIcon icon={faSyringe}/>
                                    <span>Matériels</span>
                                </Link>
                            </li>
                            <li className={location.pathname === '/reports' ? 'active' : ''}>
                                <Link to="/reports">
                                    <FontAwesomeIcon icon={faChartBar}/>
                                    <span>Rapports postopératoires</span>
                                </Link>
                            </li>
                            {isAdmin && (
                                <li className={location.pathname === '/membre' ? 'active' : ''}>
                                    <Link to="/membre">
                                        <FontAwesomeIcon icon={faUserPlus}/>
                                        <span>Ajouter un membre</span>
                                    </Link>
                                </li>
                            )}
                        </>
                    )}

                    {isMedicalStaff && (
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
                <div className="profile-section" onClick={showProfileAlert}>
                    <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
                    <span className="profile-text">Profil</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span>Déconnexion</span>
                </button>
            </div>

            {showAlert && (
                <div className="custom-alert-overlay" onClick={() => setShowAlert(false)}>
                    <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
                        <h2>Profil Utilisateur</h2>
                        <pre>{profileInfo}</pre>
                        <button onClick={() => setShowAlert(false)}>Fermer</button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Sidebar;
