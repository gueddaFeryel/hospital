// src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserClock,
    faCalendarCheck,
    faChartBar,
    faCog,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();

    return (
        <div className="sidebar-fixed">
            <div className="sidebar-header">
                <h3>Tableau de Bord</h3>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                        <Link to="/dashboard">
                            <FontAwesomeIcon icon={faUserClock} />
                            <span>Utilisateurs</span>
                        </Link>
                    </li>
                    <li className={location.pathname === '/interventions' ? 'active' : ''}>
                        <Link to="/interventions">
                            <FontAwesomeIcon icon={faCalendarCheck} />
                            <span>Interventions</span>
                        </Link>
                    </li>
                    <li className={location.pathname === '/admin/stats' ? 'active' : ''}>
                        <Link to="/admin/stats">
                            <FontAwesomeIcon icon={faChartBar} />
                            <span>Statistiques</span>
                        </Link>
                    </li>
                    <li className={location.pathname === '/admin/settings' ? 'active' : ''}>
                        <Link to="/admin/settings">
                            <FontAwesomeIcon icon={faCog} />
                            <span>Paramètres</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn">
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
