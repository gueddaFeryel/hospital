import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './PatientList.css';

const PatientList = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [documentsError, setDocumentsError] = useState(null);

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            setError(null);
            try {
                let url = `http://localhost:8089/api/patients?page=${page}&size=${size}`;
                if (searchTerm) {
                    url += `&search=${encodeURIComponent(searchTerm)}`;
                }

                const response = await axios.get(url, {
                    maxContentLength: 10000000,
                    maxBodyLength: 10000000,
                });
                console.log('Patients API response:', response.data);
                const patientsData = response.data.content || [];
                setPatients(Array.isArray(patientsData) ? patientsData : []);
                setTotalPages(response.data.totalPages || 1);
            } catch (err) {
                console.error('Fetch error:', err);
                setError(
                    err.response?.data?.error ||
                    `Erreur de connexion au serveur: ${err.message}.`
                );
                setPatients([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, [page, size, searchTerm]);

    const fetchDocuments = async (patientId) => {
        setDocumentsLoading(true);
        setDocumentsError(null);
        try {
            const response = await axios.get(
                `http://localhost:8089/api/patients/${patientId}/documents`,
                {
                    maxContentLength: 10000000,
                    maxBodyLength: 10000000,
                }
            );
            setDocuments(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setDocumentsError(
                err.response?.data?.error ||
                `Erreur lors du chargement des documents: ${err.message}`
            );
            setDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    };

    const handleDetailsClick = (patientId) => {
        if (selectedPatientId === patientId) {
            setSelectedPatientId(null);
            setDocuments([]);
        } else {
            setSelectedPatientId(patientId);
            fetchDocuments(patientId);
        }
    };

    const handleDelete = async (patientId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce patient ?')) return;

        const previousPatients = patients;
        setPatients(patients.filter((p) => p.id !== patientId));
        setSelectedPatientId(null);
        setDocuments([]);

        try {
            await axios.delete(`http://localhost:8089/api/patients/${patientId}`);
        } catch (err) {
            console.error('Delete error:', err);
            setError(
                err.response?.data?.error ||
                `Erreur lors de la suppression du patient: ${err.message}`
            );
            setPatients(previousPatients);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        setSelectedPatientId(null);
        setDocuments([]);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    if (loading) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="patient-list-container">
            <div className="header">
                <h2>Liste des Patients</h2>
                <Link to="/patients/new" className="btn-add">
                    <i className="fas fa-plus"></i> Nouveau Patient
                </Link>
            </div>

            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Rechercher par nom ou prénom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn-search">
                    <i className="fas fa-search"></i>
                </button>
            </form>

            <div className="table-responsive">
                <table className="patient-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Date Naissance</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {patients.length > 0 ? (
                        patients.map((patient) => (
                            <React.Fragment key={patient.id}>
                                <tr>
                                    <td>{patient.id}</td>
                                    <td>{patient.nom}</td>
                                    <td>{patient.prenom}</td>
                                    <td>{formatDate(patient.dateNaissance)}</td>
                                    <td className="actions">
                                        <button
                                            onClick={() => handleDetailsClick(patient.id)}
                                            className="btn-details"
                                        >
                                            <i
                                                className={`fas ${
                                                    selectedPatientId === patient.id
                                                        ? 'fa-chevron-up'
                                                        : 'fa-chevron-down'
                                                }`}
                                            ></i>{' '}
                                            Détails
                                        </button>
                                        <Link to={`/patients/${patient.id}`} className="btn-view">
                                            <i className="fas fa-eye"></i> Voir
                                        </Link>
                                        <Link
                                            to={`/patients/${patient.id}/edit`}
                                            state={{
                                                patient,
                                                documents: selectedPatientId === patient.id ? documents : [],
                                            }}
                                            className="btn-edit"
                                        >
                                            <i className="fas fa-edit"></i> Modifier
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(patient.id)}
                                            className="btn-delete"
                                        >
                                            <i className="fas fa-trash"></i> Supprimer
                                        </button>
                                    </td>
                                </tr>
                                {selectedPatientId === patient.id && (
                                    <tr className="documents-row">
                                        <td colSpan="5">
                                            <div className="documents-section">
                                                <h4>Documents du patient</h4>
                                                {documentsLoading ? (
                                                    <div className="loading">
                                                        Chargement des documents...
                                                    </div>
                                                ) : documentsError ? (
                                                    <div className="error">{documentsError}</div>
                                                ) : (
                                                    <div>
                                                        {documents.length > 0 ? (
                                                            <ul className="documents-list">
                                                                {documents.map((doc) => (
                                                                    <li key={doc.id}>
                                                                        {doc.nomFichier} ({formatDate(doc.dateCreation)})
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>Aucun document trouvé pour ce patient.</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="no-results">
                                Aucun patient trouvé
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {!searchTerm && patients.length > 0 && (
                <div className="pagination-controls">
                    <div className="pagination-info">
                        Page {page + 1} sur {totalPages}
                    </div>
                    <div className="pagination-buttons">
                        <button
                            onClick={() => setPage((p) => Math.max(p - 1, 0))}
                            disabled={page === 0}
                            className="pagination-btn"
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= totalPages - 1}
                            className="pagination-btn"
                        >
                            Suivant
                        </button>
                    </div>
                    <div className="page-size-selector">
                        <label>Patients par page:</label>
                        <select
                            value={size}
                            onChange={(e) => setSize(Number(e.target.value))}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientList;
