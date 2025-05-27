import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { FaSearch, FaUserCheck } from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import { useAuth } from '../auth/AuthContext';
import './AdminDashboard.css';

function AdminDashboard() {
    const { userData } = useAuth();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [emailStatus, setEmailStatus] = useState({});

    useEffect(() => {
        emailjs.init("jEoTwyonBRh00dpd4");
    }, []);

    useEffect(() => {
        const fetchPendingUsers = async () => {
            try {
                const q = query(
                    collection(db, 'users'),
                    where('isApproved', '==', false)
                );
                const querySnapshot = await getDocs(q);
                setPendingUsers(querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })));
            } catch (error) {
                console.error("Erreur de récupération des utilisateurs:", error);
                alert("Erreur lors du chargement des utilisateurs");
            } finally {
                setLoading(false);
            }
        };
        fetchPendingUsers();
    }, []);

    const sendApprovalEmail = async (user) => {
        const email = user.email?.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Adresse email invalide");
        }

        try {
            setEmailStatus(prev => ({ ...prev, [user.id]: 'sending' }));

            const response = await emailjs.send(
                'service_wmw0cua',
                'template_ec90uzk',
                {
                    to_email: email,
                    to_name: `${user.prenom} ${user.nom}`,
                    role: user.role,
                    date: new Date().toLocaleDateString('fr-FR')
                },
                'jEoTwyonBRh00dpd4'
            );

            setEmailStatus(prev => ({ ...prev, [user.id]: 'sent' }));
            console.log("Réponse EmailJS:", response);
            return response;
        } catch (error) {
            console.error("Détails de l'erreur EmailJS:", {
                status: error.status,
                text: error.text,
                message: error.message
            });
            setEmailStatus(prev => ({ ...prev, [user.id]: 'failed' }));
            throw error;
        }
    };

    const approveUser = async (userId) => {
        setIsSyncing(true);
        try {
            const userToApprove = pendingUsers.find(user => user.id === userId);
            if (!userToApprove) throw new Error('Utilisateur non trouvé');
            if (!userToApprove.role) throw new Error('Le rôle est obligatoire');

            // 1. Envoi de l'email de confirmation
            await sendApprovalEmail(userToApprove);

            // 2. Préparation des données pour create-with-image
            const requestData = {
                email: userToApprove.email || '',
                nom: userToApprove.nom || '',
                prenom: userToApprove.prenom || '',
                role: userToApprove.role.toUpperCase(),
                image: userToApprove.image || null,
                firebase_uid: userToApprove.id,
                is_approved: true
            };

            // Ajout des spécialités selon le rôle
            if (userToApprove.role === 'MEDECIN') {
                requestData.specialiteMedecin = userToApprove.specialite || '';
            } else if (userToApprove.role === 'ANESTHESISTE') {
                requestData.specialiteAnesthesiste = userToApprove.specialite || '';
            }

            // 3. Appel à l'endpoint create-with-image
            const response = await fetch('http://localhost:8089/api/medical-staff/create-with-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur de création');
            }

            // 4. Mise à jour Firestore
            await updateDoc(doc(db, 'users', userId), {
                isApproved: true,
                approvedAt: new Date().toISOString()
            });

            // 5. Mise à jour de l'état local
            setPendingUsers(prev => prev.filter(user => user.id !== userId));

            alert(`Utilisateur ${userToApprove.prenom} ${userToApprove.nom} approuvé avec succès!`);
        } catch (error) {
            console.error("Erreur complète d'approbation:", error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const filteredUsers = pendingUsers.filter(user =>
        `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="admin-dashboard-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            <div className="dashboard-header">
                <div className="header-content">
                    <h2>Approbation des Utilisateurs</h2>
                </div>
            </div>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    className="search-bar"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="dashboard-content">
                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        {pendingUsers.length === 0 ? (
                            <p>Aucun utilisateur en attente d'approbation</p>
                        ) : (
                            <p>Aucun résultat trouvé pour "{searchTerm}"</p>
                        )}
                    </div>
                ) : (
                    <div className="users-table-wrapper">
                        <table className="users-table">
                            <thead>
                            <tr>
                                <th>Nom Complet</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.map((user, index) => (
                                <tr key={user.id} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <td>{user.prenom} {user.nom}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => approveUser(user.id)}
                                            disabled={isSyncing || emailStatus[user.id] === 'sending'}
                                            className={`approve-btn ${
                                                emailStatus[user.id] === 'sent' ? 'approved' :
                                                    emailStatus[user.id] === 'failed' ? 'failed' : ''
                                            }`}
                                        >
                                            <FaUserCheck />
                                            {emailStatus[user.id] === 'sending' ? 'Envoi en cours...' :
                                                emailStatus[user.id] === 'sent' ? 'Approuvé' :
                                                    emailStatus[user.id] === 'failed' ? 'Erreur d\'envoi' :
                                                        isSyncing ? 'Traitement...' : 'Approuver'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
