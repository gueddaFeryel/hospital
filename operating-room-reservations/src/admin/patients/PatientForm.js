import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './PatientForm.css';

const PatientForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useLocation();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        nom: state?.patient?.nom || '',
        prenom: state?.patient?.prenom || '',
        dateNaissance: state?.patient?.dateNaissance ? state.patient.dateNaissance.split('T')[0] : '',
        telephone: state?.patient?.telephone || '',
        adresse: state?.patient?.adresse || '',
    });
    const [documents, setDocuments] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState(state?.documents || []);
    const [documentsToDelete, setDocumentsToDelete] = useState([]);
    const [updateDocumentId, setUpdateDocumentId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState({
        patient: isEditMode,
        documents: isEditMode && !state?.documents,
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEditMode) {
            const fetchData = async () => {
                try {
                    console.log(`Fetching data for patient ID: ${id}`);
                    console.log('State from PatientList:', state);

                    const requests = [
                        axios.get(`http://localhost:8089/api/patients/${id}`),
                    ];
                    if (!state?.documents) {
                        requests.push(
                            axios.get(`http://localhost:8089/api/patients/${id}/documents`, {
                                maxContentLength: 10000000,
                                maxBodyLength: 10000000,
                            })
                        );
                    } else {
                        requests.push(Promise.resolve({ data: state.documents }));
                    }

                    const [patientResponse, docsResponse] = await Promise.all(requests);

                    const patient = patientResponse.data;
                    console.log('Patient API response:', patient);

                    setFormData({
                        nom: patient.nom || '',
                        prenom: patient.prenom || '',
                        dateNaissance: patient.dateNaissance ? patient.dateNaissance.split('T')[0] : '',
                        telephone: patient.telephone || '',
                        adresse: patient.adresse || '',
                    });

                    if (!state?.documents) {
                        setExistingDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
                        console.log('Documents API response:', docsResponse.data);
                    }
                } catch (err) {
                    console.error('Fetch error:', err);
                    setErrors({
                        form: err.response?.data?.error || `Erreur de chargement: ${err.message}`,
                    });
                } finally {
                    setFetchLoading({ patient: false, documents: false });
                }
            };
            fetchData();
        }
    }, [id, isEditMode, state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const invalidFiles = files.filter((file) => file.type !== 'application/pdf');
        if (invalidFiles.length > 0) {
            setErrors((prev) => ({ ...prev, documents: 'Seuls les fichiers PDF sont acceptés.' }));
            return;
        }
        setDocuments((prev) => [...prev, ...files]);
        setErrors((prev) => ({ ...prev, documents: null }));
    };

    const handleUpdateFileChange = (e, documentId) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            setErrors((prev) => ({ ...prev, documents: 'Seul un fichier PDF est accepté.' }));
            return;
        }
        setDocuments((prev) => [...prev, file]);
        setUpdateDocumentId(documentId);
        setErrors((prev) => ({ ...prev, documents: null }));
    };

    const removeDocument = (index) => {
        setDocuments((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDeleteDocument = (documentId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer ce document ?')) return;
        setDocumentsToDelete((prev) => [...prev, documentId]);
        setExistingDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    };

    const validateField = (name, value) => {
        const newErrors = { ...errors };
        switch (name) {
            case 'nom':
                newErrors.nom = value.trim() ? '' : 'Le nom est requis';
                break;
            case 'prenom':
                newErrors.prenom = value.trim() ? '' : 'Le prénom est requis';
                break;
            case 'dateNaissance':
                if (!value) {
                    newErrors.dateNaissance = 'La date de naissance est requise';
                } else {
                    const birthDate = new Date(value);
                    const today = new Date();
                    newErrors.dateNaissance = birthDate > today ? 'Date invalide' : '';
                }
                break;
            case 'telephone':
                newErrors.telephone = value.trim() ? (/^[0-9+\-\s()]{7,15}$/.test(value) ? '' : 'Numéro invalide') : '';
                break;
            case 'adresse':
                newErrors.adresse = value.trim() ? '' : '';
                break;
            default:
                break;
        }
        setErrors(newErrors);
    };

    const isFormValid = () => {
        const requiredFieldsValid = formData.nom.trim() && formData.prenom.trim() && formData.dateNaissance;
        const hasErrors = Object.values(errors).some((error) => error && error !== '');
        return requiredFieldsValid && !hasErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) {
            setErrors((prev) => ({ ...prev, form: 'Veuillez corriger les erreurs.' }));
            return;
        }

        setLoading(true);
        setErrors((prev) => ({ ...prev, form: null }));

        try {
            let patientId;
            console.log('Submitting formData:', formData);
            if (isEditMode) {
                await axios.put(`http://localhost:8089/api/patients/${id}`, formData, {
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                });
                patientId = id;
            } else {
                const patientResponse = await axios.post('http://localhost:8089/api/patients', formData, {
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                });
                patientId = patientResponse.data.id;
            }

            for (const docId of documentsToDelete) {
                await axios.delete(`http://localhost:8089/api/patients/${patientId}/documents/${docId}`);
            }

            if (updateDocumentId && documents.length > 0) {
                const formDataDocs = new FormData();
                formDataDocs.append('file', documents[documents.length - 1]);
                await axios.put(
                    `http://localhost:8089/api/patients/${patientId}/documents/${updateDocumentId}`,
                    formDataDocs,
                    { headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' } }
                );
            }

            if (documents.length > 0 && !updateDocumentId) {
                const formDataDocs = new FormData();
                documents.forEach((file) => formDataDocs.append('files', file));
                await axios.post(
                    `http://localhost:8089/api/patients/${patientId}/documents`,
                    formDataDocs,
                    { headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' } }
                );
            }

            navigate('/patientslist', {
                state: {
                    successMessage: isEditMode ? 'Patient mis à jour' : 'Patient créé',
                    ...(documents.length > 0 || documentsToDelete.length > 0 || updateDocumentId
                        ? {
                            docsMessage: [
                                documentsToDelete.length > 0 ? `${documentsToDelete.length} document(s) supprimé(s)` : '',
                                updateDocumentId ? '1 document mis à jour' : '',
                                documents.length > 0 && !updateDocumentId ? `${documents.length} document(s) ajouté(s)` : '',
                            ].filter(Boolean).join(', '),
                        }
                        : {}),
                },
            });
        } catch (err) {
            console.error('Submit error:', err);
            setErrors({
                form: err.response?.data?.error || (isEditMode ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création'),
            });
        } finally {
            setLoading(false);
            setDocuments([]);
            setUpdateDocumentId(null);
            setDocumentsToDelete([]);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <div className="patient-form-container">
            <h2>{isEditMode ? 'Modifier le Patient' : 'Nouveau Patient'}</h2>
            <Link to="/patients" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour
            </Link>

            {errors.form && <div className="error-message">{errors.form}</div>}

            {fetchLoading.patient || fetchLoading.documents ? (
                <div className="loading">
                    {fetchLoading.patient && fetchLoading.documents
                        ? 'Chargement du patient et des documents...'
                        : fetchLoading.patient
                            ? 'Chargement des informations du patient...'
                            : 'Chargement des documents...'}
                </div>
            ) : (
                <>
                    {isEditMode && !fetchLoading.documents && existingDocuments.length === 0 && !errors.form && (
                        <p>Aucun document existant.</p>
                    )}
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h3>Informations Personnelles</h3>
                            <div className="form-row">
                                <div className={`form-group ${errors.nom ? 'has-error' : ''}`}>
                                    <label htmlFor="nom">Nom*:</label>
                                    <input
                                        id="nom"
                                        type="text"
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        className="form-control"
                                        disabled={fetchLoading.patient}
                                    />
                                    {errors.nom && <span className="error-text">{errors.nom}</span>}
                                </div>
                                <div className={`form-group ${errors.prenom ? 'has-error' : ''}`}>
                                    <label htmlFor="prenom">Prénom*:</label>
                                    <input
                                        id="prenom"
                                        type="text"
                                        name="prenom"
                                        value={formData.prenom}
                                        onChange={handleChange}
                                        className="form-control"
                                        disabled={fetchLoading.patient}
                                    />
                                    {errors.prenom && <span className="error-text">{errors.prenom}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className={`form-group ${errors.dateNaissance ? 'has-error' : ''}`}>
                                    <label htmlFor="dateNaissance">Date de Naissance*:</label>
                                    <input
                                        id="dateNaissance"
                                        type="date"
                                        name="dateNaissance"
                                        value={formData.dateNaissance}
                                        onChange={handleChange}
                                        className="form-control"
                                        max={new Date().toISOString().split('T')[0]}
                                        disabled={fetchLoading.patient}
                                    />
                                    {errors.dateNaissance && <span className="error-text">{errors.dateNaissance}</span>}
                                </div>
                                <div className={`form-group ${errors.telephone ? 'has-error' : ''}`}>
                                    <label htmlFor="telephone">Téléphone:</label>
                                    <input
                                        id="telephone"
                                        type="text"
                                        name="telephone"
                                        value={formData.telephone}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="Ex: +1234567890"
                                        disabled={fetchLoading.patient}
                                    />
                                    {errors.telephone && <span className="error-text">{errors.telephone}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className={`form-group ${errors.adresse ? 'has-error' : ''}`}>
                                    <label htmlFor="adresse">Adresse:</label>
                                    <input
                                        id="adresse"
                                        type="text"
                                        name="adresse"
                                        value={formData.adresse}
                                        onChange={handleChange}
                                        className="form-control"
                                        placeholder="Ex: 123 Rue Exemple, Ville"
                                        disabled={fetchLoading.patient}
                                    />
                                    {errors.adresse && <span className="error-text">{errors.adresse}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Documents Médicaux (PDF)</h3>
                            {isEditMode && (
                                <div className="documents-list">
                                    <h4>Documents Existants:</h4>
                                    {fetchLoading.documents ? (
                                        <div className="loading">Chargement des documents...</div>
                                    ) : existingDocuments.length > 0 ? (
                                        <ul>
                                            {existingDocuments.map((doc) => (
                                                <li key={doc.id}>
                                                    {updateDocumentId === doc.id ? (
                                                        <>
                                                            <input
                                                                type="file"
                                                                accept="application/pdf"
                                                                onChange={(e) => handleUpdateFileChange(e, doc.id)}
                                                                className="form-control-file"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setUpdateDocumentId(null)}
                                                                className="btn-cancel-update"
                                                            >
                                                                Annuler
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {doc.nomFichier} ({formatDate(doc.dateCreation)})
                                                            <button
                                                                type="button"
                                                                onClick={() => setUpdateDocumentId(doc.id)}
                                                                className="btn-update-document"
                                                            >
                                                                <i className="fas fa-upload"></i> Mettre à jour
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteDocument(doc.id)}
                                                                className="btn-delete-document"
                                                            >
                                                                <i className="fas fa-trash"></i> Supprimer
                                                            </button>
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>Aucun document.</p>
                                    )}
                                </div>
                            )}
                            <div className={`form-group ${errors.documents ? 'has-error' : ''}`}>
                                <label htmlFor="documents">
                                    {isEditMode ? 'Ajouter de nouveaux documents:' : 'Ajouter des documents:'}
                                </label>
                                <input
                                    id="documents"
                                    type="file"
                                    multiple
                                    accept="application/pdf"
                                    onChange={handleFileChange}
                                    className="form-control-file"
                                    disabled={fetchLoading.documents}
                                />
                                <small className="form-text text-muted">Sélectionnez des fichiers PDF</small>
                                {errors.documents && <span className="error-text">{errors.documents}</span>}
                            </div>
                            {documents.length > 0 && (
                                <div className="documents-list">
                                    <h4>Fichiers sélectionnés:</h4>
                                    <ul>
                                        {documents.map((file, index) => (
                                            <li key={index}>
                                                {file.name}
                                                <button
                                                    type="button"
                                                    onClick={() => removeDocument(index)}
                                                    className="btn-remove"
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                disabled={loading || !isFormValid() || fetchLoading.patient || fetchLoading.documents}
                                className={`btn btn-submit ${!isFormValid() || fetchLoading.patient || fetchLoading.documents ? 'disabled' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                        {isEditMode ? 'Mise à jour...' : 'Enregistrement...'}
                                    </>
                                ) : isEditMode ? (
                                    'Mettre à jour'
                                ) : (
                                    'Enregistrer'
                                )}
                            </button>
                            <button type="button" onClick={() => navigate('/patientslist')} className="btn btn-cancel">
                                Annuler
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default PatientForm;
