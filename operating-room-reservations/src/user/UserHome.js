import React from 'react';
import { Link } from 'react-router-dom';
import UserCalendarView from './UserCalendarView';
import './UserHome.css';

const UserHome = () => {
    return (
        <div className="user-home">
            <h2>Mon Calendrier d'Interventions</h2>

            <div className="quick-actions">
                <Link to="/reservations/new" className="action-card">
                    <i className="fas fa-book-medical"></i>
                    <span>Demander une intervention</span>
                </Link>
                <Link to="/mes-interventions" className="action-card">
                    <i className="fas fa-list"></i>
                    <span>Mes interventions</span>
                </Link>
            </div>

            <div className="calendar-section">
                <UserCalendarView />
            </div>
        </div>
    );
};

export default UserHome;