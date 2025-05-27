import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './RapportList.css';
import { useAuth } from '../auth/AuthContext';

const RapportList = () => {
    const { userData, loading: authLoading } = useAuth();
    const [rapports, setRapports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchRapports = async () => {
            if (authLoading) return;
            if (!userData || !userData.id || !userData.role) {
                setError('Utilisateur non authentifié ou données manquantes');
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get('http://localhost:8089/api/rapports-postoperatoires', {
                    headers: {
                        'X-User-Role': userData.role.toUpperCase(),
                        'X-User-Id': userData.id
                    }
                });
                setRapports(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.response?.data?.message || error.message);
                setLoading(false);
            }
        };
        fetchRapports();
    }, [userData, authLoading]);

    const filteredRapports = useMemo(() => {
        return rapports.filter(rapport =>
            (rapport.id?.toString().includes(searchTerm) ||
                rapport.diagnostic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.complications?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.recommandations?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.notesInfirmier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.statut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.medecin?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.infirmier?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.intervention?.date?.toString().includes(searchTerm) ||
                rapport.intervention?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.intervention?.statut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rapport.intervention?.roomId?.toString().includes(searchTerm)
            ));
    }, [rapports, searchTerm]);

    const groupedRapports = useMemo(() => {
        return filteredRapports.reduce((acc, rapport) => {
            const type = rapport.intervention?.type || 'Non spécifié';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(rapport);
            return acc;
        }, {});
    }, [filteredRapports]);

    const sortedTypes = Object.keys(groupedRapports).sort();

    if (authLoading || loading) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">Erreur: {error}</div>;

    return (
        <div className="rapport-list-container">
            <div className="list-header">
                <h2>Liste des Rapports Post-Opératoires</h2>
                {userData?.role.toUpperCase() === 'MEDECIN' && (
                    <Link to="/rapports/new" className="btn add-btn">
                        <i className="fas fa-plus"></i> Ajouter un Rapport
                    </Link>
                )}
                <Link to="/dashboard" className="btn btn-back">
                    <i className="fas fa-arrow-left"></i> Retour au dashboard
                </Link>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Rechercher par diagnostic, complications, date intervention, type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="fas fa-search search-icon"></i>
            </div>

            {sortedTypes.map(type => (
                <div key={type} className="intervention-type-group">
                    <h3 className="intervention-type-header">
                        {type === 'Non spécifié'
                            ? 'Rapports sans type d\'intervention'
                            : `Type d'intervention: ${type}`}
                        ({groupedRapports[type].length} rapport{groupedRapports[type].length > 1 ? 's' : ''})
                    </h3>
                    <div className="table-wrapper">
                        <table className="rapport-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Complications</th>
                                <th>Date Création</th>
                                <th>Date Soumission</th>
                                <th>Diagnostic</th>
                                <th>Notes Infirmier</th>
                                <th>Recommandations</th>
                                <th>Statut</th>
                                <th>Infirmier Nom</th>
                                <th>Date Intervention</th>
                                <th>Statut Intervention</th>
                                <th>Début Intervention</th>
                                <th>Fin Intervention</th>
                                <th>Salle ID</th>
                                <th>Médecin Nom</th>
                            </tr>
                            </thead>
                            <tbody>
                            {groupedRapports[type].map(rapport => (
                                <tr key={rapport.id}>
                                    <td data-label="ID">{rapport.id}</td>
                                    <td data-label="Complications">{rapport.complications || '-'}</td>
                                    <td data-label="Date Création">
                                        {rapport.dateCreation
                                            ? new Date(rapport.dateCreation).toLocaleString('fr-FR')
                                            : '-'}
                                    </td>
                                    <td data-label="Date Soumission">
                                        {rapport.dateSoumission
                                            ? new Date(rapport.dateSoumission).toLocaleString('fr-FR')
                                            : '-'}
                                    </td>
                                    <td data-label="Diagnostic">{rapport.diagnostic || '-'}</td>
                                    <td data-label="Notes Infirmier">{rapport.notesInfirmier || '-'}</td>
                                    <td data-label="Recommandations">{rapport.recommandations || '-'}</td>
                                    <td data-label="Statut">{rapport.statut || '-'}</td>
                                    <td data-label="Infirmier Nom">
                                        {rapport.infirmier ? `${rapport.infirmier.nom} ${rapport.infirmier.prenom}` : '-'}
                                    </td>
                                    <td data-label="Date Intervention">
                                        {rapport.intervention?.date
                                            ? new Date(rapport.intervention.date).toLocaleDateString('fr-FR')
                                            : '-'}
                                    </td>
                                    <td data-label="Statut Intervention">{rapport.intervention?.statut || '-'}</td>
                                    <td data-label="Début Intervention">
                                        {rapport.intervention?.startTime
                                            ? new Date(rapport.intervention.startTime).toLocaleString('fr-FR')
                                            : '-'}
                                    </td>
                                    <td data-label="Fin Intervention">
                                        {rapport.intervention?.endTime
                                            ? new Date(rapport.intervention.endTime).toLocaleString('fr-FR')
                                            : '-'}
                                    </td>
                                    <td data-label="Salle ID">{rapport.intervention?.roomId || '-'}</td>
                                    <td data-label="Médecin Nom">
                                        {rapport.medecin ? `${rapport.medecin.nom} ${rapport.medecin.prenom}` : '-'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {filteredRapports.length === 0 && (
                <div className="no-results">
                    Aucun rapport trouvé
                </div>
            )}
        </div>
    );
};

export default RapportList;
