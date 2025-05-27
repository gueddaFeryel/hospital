import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Gestion des interventions css/InterventionForm.css';

const InterventionForm = ({ editMode }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State for form data
    const [formData, setFormData] = useState({
        date: '',
        type: '',
        statut: 'PLANIFIEE',
        startTime: '',
        endTime: '',
        roomId: null,
        patientId: null, // Added for patient assignment
    });

    // State for stepper
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5; // Updated to 5: Details, Room, Staff, Materials, Patient

    // State for rooms
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomLoading, setRoomLoading] = useState(false);

    // State for staff
    const [availableStaff, setAvailableStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: [],
    });
    const [selectedStaff, setSelectedStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: [],
    });
    const [staffLoading, setStaffLoading] = useState(false);

    // State for materials
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [materialLoading, setMaterialLoading] = useState(false);

    // State for patients
    const [availablePatients, setAvailablePatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientLoading, setPatientLoading] = useState(false);

    // Other states
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);

    const ROLES = {
        MEDECIN: 'MEDECIN',
        ANESTHESISTE: 'ANESTHESISTE',
        INFIRMIER: 'INFIRMIER',
    };

    // Constants
    const MIN_DURATION_MINUTES = 30;
    const MAX_DURATION_HOURS = 12;

    const interventionTypes = [
        { value: 'CHIRURGIE_CARDIAQUE', label: 'Chirurgie cardiaque' },
        { value: 'ORTHOPEDIQUE', label: 'Orthopédique' },
        { value: 'NEUROCHIRURGIE', label: 'Neurochirurgie' },
        { value: 'OPHTALMOLOGIQUE', label: 'Ophtalmologique' },
        { value: 'UROLOGIE', label: 'Urologie' },
        { value: 'GYNECOLOGIQUE', label: 'Gynécologique' },
        { value: 'AUTRE', label: 'Autre' },
    ];

    const statusOptions = [
        { value: 'PLANIFIEE', label: 'Planifiée' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'TERMINEE', label: 'Terminée' },
        { value: 'ANNULEE', label: 'Annulée' },
    ];

    // Fetch intervention data for edit mode
    useEffect(() => {
        if (editMode && id) {
            const fetchIntervention = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:8089/api/interventions/${id}`);
                    const data = response.data;

                    setFormData({
                        ...data,
                        date: data.date.split('T')[0],
                        startTime: data.startTime ? data.startTime.split('T')[1].substring(0, 5) : '',
                        endTime: data.endTime ? data.endTime.split('T')[1].substring(0, 5) : '',
                        statut: data.statut || 'PLANIFIEE',
                        roomId: data.roomId || null,
                        patientId: data.patientId || null, // Include patientId
                    });

                    if (data.roomId) {
                        try {
                            const roomResponse = await axios.get(`http://localhost:8086/api/rooms/${data.roomId}`);
                            setSelectedRoom(roomResponse.data);
                        } catch (e) {
                            console.error('Erreur récupération salle:', e);
                            setSelectedRoom({
                                id: data.roomId,
                                name: `Salle ${data.roomId}`,
                                equipment: 'Non disponible',
                            });
                        }
                    }

                    if (data.patientId) {
                        try {
                            const patientResponse = await axios.get(`http://localhost:8089/api/patients/${data.patientId}`);
                            setSelectedPatient(patientResponse.data);
                        } catch (e) {
                            console.error('Erreur récupération patient:', e);
                            setSelectedPatient({
                                id: data.patientId,
                                nom: `Patient ${data.patientId}`,
                                prenom: '',
                            });
                        }
                    }

                    // Fetch staff and materials for edit mode
                    const [staffResponse, materialsResponse] = await Promise.all([
                        axios.get(`http://localhost:8089/api/interventions/${id}/staff`).catch(() => ({ data: [] })),
                        axios.get(`http://localhost:8089/api/interventions/${id}/materiels`).catch(() => ({ data: [] })),
                    ]);

                    const staffByRole = {
                        MEDECIN: [],
                        ANESTHESISTE: [],
                        INFIRMIER: [],
                    };
                    staffResponse.data.forEach((staff) => {
                        if (staff.role === 'MEDECIN') staffByRole.MEDECIN.push(staff.id);
                        else if (staff.role === 'ANESTHESISTE') staffByRole.ANESTHESISTE.push(staff.id);
                        else if (staff.role === 'INFIRMIER') staffByRole.INFIRMIER.push(staff.id);
                    });
                    setSelectedStaff(staffByRole);
                    setSelectedMaterials(materialsResponse.data.map((m) => m.id));
                } catch (err) {
                    setErrors({ form: err.response?.data?.message || err.message });
                } finally {
                    setLoading(false);
                }
            };
            fetchIntervention();
        }
    }, [editMode, id]);

    // Validation logic
    const validateField = (name, value) => {
        const newErrors = { ...errors };
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        switch (name) {
            case 'date':
                if (!value) {
                    newErrors.date = 'La date est requise';
                } else if (value < today) {
                    newErrors.date = 'Vous ne pouvez pas créer une intervention dans le passé';
                } else {
                    delete newErrors.date;
                }
                break;
            case 'type':
                if (!value) {
                    newErrors.type = "Le type d'intervention est requis";
                } else {
                    delete newErrors.type;
                }
                break;
            case 'startTime':
            case 'endTime':
                if (formData.startTime && formData.endTime) {
                    const start = new Date(`${formData.date}T${formData.startTime}`);
                    const end = new Date(`${formData.date}T${formData.endTime}`);

                    if (formData.date === today) {
                        if (start < now) {
                            newErrors.time = "L'heure de début ne peut pas être dans le passé";
                        } else if (end < now) {
                            newErrors.time = "L'heure de fin ne peut pas être dans le passé";
                        }
                    }

                    if (start >= end) {
                        newErrors.time = "L'heure de fin doit être après l'heure de début";
                    } else {
                        const durationMinutes = (end - start) / (1000 * 60);
                        if (durationMinutes < MIN_DURATION_MINUTES) {
                            newErrors.time = `La durée minimale est de ${MIN_DURATION_MINUTES} minutes`;
                        } else if (durationMinutes > MAX_DURATION_HOURS * 60) {
                            newErrors.time = `La durée maximale est de ${MAX_DURATION_HOURS} heures`;
                        } else {
                            delete newErrors.time;
                        }
                    }
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateForm = () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        if (!formData.date) newErrors.date = 'La date est requise';
        else if (formData.date < today) newErrors.date = 'Vous ne pouvez pas créer une intervention dans le passé';

        if (!formData.type) newErrors.type = "Le type d'intervention est requis";

        if (!formData.startTime) newErrors.time = "L'heure de début est requise";
        if (!formData.endTime) newErrors.time = "L'heure de fin est requise";

        if (formData.startTime && formData.endTime) {
            const start = new Date(`${formData.date}T${formData.startTime}`);
            const end = new Date(`${formData.date}T${formData.endTime}`);

            if (formData.date === today) {
                if (start < now) newErrors.time = "L'heure de début ne peut pas être dans le passé";
                else if (end < now) newErrors.time = "L'heure de fin ne peut pas être dans le passé";
            }

            if (start >= end) {
                newErrors.time = "L'heure de fin doit être après l'heure de début";
            } else {
                const durationMinutes = (end - start) / (1000 * 60);
                if (durationMinutes < MIN_DURATION_MINUTES) {
                    newErrors.time = `La durée minimale est de ${MIN_DURATION_MINUTES} minutes`;
                } else if (durationMinutes > MAX_DURATION_HOURS * 60) {
                    newErrors.time = `La durée maximale est de ${MAX_DURATION_HOURS} heures`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors.form && errors.form.includes('Conflit de réservation')) {
            if (['date', 'startTime', 'endTime', 'type'].includes(name)) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.form;
                    return newErrors;
                });
            }
        }

        if (formSubmitted) {
            validateField(name, value);
        }
    };

    // Room selection logic
    const fetchAvailableRooms = async () => {
        try {
            if (!formData.type) {
                setErrors({ type: "Veuillez sélectionner un type d'intervention" });
                return;
            }
            if (!formData.date) {
                setErrors({ date: 'Veuillez sélectionner une date' });
                return;
            }
            if (!formData.startTime || !formData.endTime) {
                setErrors({ time: 'Veuillez spécifier les heures de début et fin' });
                return;
            }

            setRoomLoading(true);
            setErrors({});

            const startDateTime = `${formData.date}T${formData.startTime}:00`;
            const endDateTime = `${formData.date}T${formData.endTime}:00`;

            const response = await axios.get('http://localhost:8089/api/interventions/available-rooms', {
                params: {
                    startTime: startDateTime,
                    endTime: endDateTime,
                    type: formData.type,
                },
            });

            setAvailableRooms(response.data || []);
            if (response.data.length === 0) {
                setErrors({ rooms: 'Aucune salle disponible pour ces critères' });
            }
        } catch (err) {
            setErrors({ rooms: err.response?.data?.message || 'Erreur lors de la recherche des salles' });
            console.error('Error fetching rooms:', err);
        } finally {
            setRoomLoading(false);
        }
    };

    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        const selected = availableRooms.find((r) => r.id.toString() === roomId);
        setSelectedRoom(selected || null);
        setFormData((prev) => ({
            ...prev,
            roomId: selected ? selected.id : null,
            statut: prev.statut === 'ANNULEE' ? 'PLANIFIEE' : prev.statut,
        }));

        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.form;
            delete newErrors.rooms;
            delete newErrors.roomConflict;
            return newErrors;
        });

        if (editMode && selected) {
            checkRoomAvailability(selected.id);
        }
    };

    const checkRoomAvailability = async (roomId) => {
        try {
            const { hasConflict } = await checkInterventionConflict();
            if (hasConflict) {
                setErrors((prev) => ({
                    ...prev,
                    roomConflict: 'Attention: Conflit potentiel détecté avec cette salle',
                }));
            }
        } catch (err) {
            console.error('Erreur vérification disponibilité salle:', err);
        }
    };

    const checkInterventionConflict = async () => {
        if (!formData.date || !formData.startTime || !formData.endTime || !selectedRoom?.id) {
            return { hasConflict: false, message: '' };
        }

        try {
            const response = await axios.get('http://localhost:8089/api/interventions/check-conflict', {
                params: {
                    roomId: selectedRoom.id,
                    startTime: `${formData.date}T${formData.startTime}:00`,
                    endTime: `${formData.date}T${formData.endTime}:00`,
                    interventionId: editMode ? id : null,
                },
            });

            return {
                hasConflict: response.data.hasConflict,
                message: response.data.hasConflict
                    ? 'Cette salle est déjà réservée pour cette plage horaire. Souhaitez-vous quand même enregistrer?'
                    : '',
            };
        } catch (err) {
            console.error('Erreur vérification conflit:', err);
            return { hasConflict: false, message: '' };
        }
    };

    // Staff selection logic
    const fetchAvailableStaff = async () => {
        setStaffLoading(true);
        try {
            const startTime = `${formData.date}T${formData.startTime}:00`;
            const endTime = `${formData.date}T${formData.endTime}:00`;

            const staffData = { MEDECIN: [], ANESTHESISTE: [], INFIRMIER: [] };

            await Promise.all(
                Object.values(ROLES).map(async (role) => {
                    try {
                        const response = await axios.get('http://localhost:8089/api/interventions/available-staff-by-specialite', {
                            params: {
                                startTime,
                                endTime,
                                role,
                                interventionType: formData.type,
                            },
                        });

                        const availableStaff = Array.isArray(response?.data) ? response.data : [];
                        staffData[role] = availableStaff.filter((staff) =>
                            role === 'INFIRMIER' || isStaffCompatible(staff, role, formData.type)
                        );
                    } catch (err) {
                        console.error(`Erreur pour ${role}:`, err);
                        staffData[role] = [];
                    }
                })
            );

            setAvailableStaff(staffData);
        } catch (err) {
            console.error('Erreur fetchAvailableStaff:', err);
            toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
        } finally {
            setStaffLoading(false);
        }
    };

    const isStaffCompatible = (staff, role, interventionType) => {
        if (role === 'INFIRMIER') return true;
        const compatibleSpecialities = getCompatibleSpecialities(interventionType)[role] || [];
        if (role === 'MEDECIN') {
            return compatibleSpecialities.includes(staff.specialiteMedecin);
        } else if (role === 'ANESTHESISTE') {
            return compatibleSpecialities.includes(staff.specialiteAnesthesiste);
        }
        return false;
    };

    const getCompatibleSpecialities = (interventionType) => {
        const typeToSpecialities = {
            CHIRURGIE_CARDIAQUE: {
                MEDECIN: ['CARDIOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_CARDIOTHORACIQUE'],
                INFIRMIER: [],
            },
            ORTHOPEDIQUE: {
                MEDECIN: ['ORTHOPEDIE', 'TRAUMATOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_ORTHOPEDIQUE'],
                INFIRMIER: [],
            },
            NEUROCHIRURGIE: {
                MEDECIN: ['NEUROLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_NEUROCHIRURGICALE'],
                INFIRMIER: [],
            },
            OPHTALMOLOGIQUE: {
                MEDECIN: ['OPHTALMOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: [],
            },
            UROLOGIE: {
                MEDECIN: ['UROLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: [],
            },
            GYNECOLOGIQUE: {
                MEDECIN: ['GYNECOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: [],
            },
            AUTRE: {
                MEDECIN: ['CHIRURGIE_GENERALE', 'AUTRE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: [],
            },
        };

        return typeToSpecialities[interventionType] || {
            MEDECIN: [],
            ANESTHESISTE: [],
            INFIRMIER: [],
        };
    };

    const handleStaffSelection = (role, staffId, isChecked) => {
        setSelectedStaff((prev) => {
            const currentSelection = prev[role];
            const newSelection = isChecked
                ? [...currentSelection, staffId]
                : currentSelection.filter((id) => id !== staffId);
            return { ...prev, [role]: newSelection };
        });
    };

    // Material selection logic
    const fetchAvailableMaterials = async () => {
        setMaterialLoading(true);
        try {
            const [allMaterialsResponse, usageResponse] = await Promise.all([
                axios.get('http://localhost:8089/api/materiels'),
                axios.get('http://localhost:8089/api/interventions/materiels/usage-counts').catch(() => ({ data: {} })),
            ]);

            const usageCounts = usageResponse.data || {};
            const allMaterials = Array.isArray(allMaterialsResponse.data) ? allMaterialsResponse.data : [];

            const availableMaterials = allMaterials.map((material) => {
                const inUse = usageCounts[material.id] || 0;
                return {
                    ...material,
                    virtuallyAvailable: material.quantiteDisponible - inUse,
                    isAssigned: selectedMaterials.includes(material.id),
                };
            });

            setAvailableMaterials(availableMaterials);
        } catch (err) {
            console.error('Erreur fetchAvailableMaterials:', err);
            setAvailableMaterials([]);
            toast.error('Erreur lors du chargement des matériels');
        } finally {
            setMaterialLoading(false);
        }
    };

    const handleMaterialSelection = (materialId, isChecked) => {
        setSelectedMaterials((prev) =>
            isChecked ? [...prev, materialId] : prev.filter((id) => id !== materialId)
        );
    };

    // Patient selection logic
    const fetchAvailablePatients = async () => {
        setPatientLoading(true);
        try {
            const response = await axios.get('http://localhost:8089/api/patients', {
                params: {
                    page: 0,
                    size: 1000 // or a large enough number to get all patients
                }
            });
            const patients = Array.isArray(response.data.content) ? response.data.content : [];
            setAvailablePatients(patients);
            if (patients.length === 0) {
                setErrors({ patients: 'Aucun patient disponible' });
            }
        } catch (err) {
            console.error('Erreur fetchAvailablePatients:', err);
            setErrors({ patients: err.response?.data?.message || 'Erreur lors de la recherche des patients' });
            setAvailablePatients([]);
            toast.error('Erreur lors du chargement des patients');
        } finally {
            setPatientLoading(false);
        }
    };

    const handlePatientChange = (e) => {
        const patientId = e.target.value;
        const selected = availablePatients.find((p) => p.id.toString() === patientId);
        setSelectedPatient(selected || null);
        setFormData((prev) => ({
            ...prev,
            patientId: selected ? selected.id : null,
        }));

        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.patients;
            return newErrors;
        });
    };

    // Navigation handlers
    const handleNext = async () => {
        if (currentStep === 1) {
            if (!validateForm()) {
                setFormSubmitted(true);
                return;
            }
            await fetchAvailableRooms();
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!selectedRoom) {
                setErrors({ rooms: 'Veuillez sélectionner une salle' });
                return;
            }
            const { hasConflict } = await checkInterventionConflict();
            if (hasConflict) {
                setErrors({
                    form: 'Conflit de réservation détecté. Veuillez modifier la salle ou les horaires.',
                });
                return;
            }
            await fetchAvailableStaff();
            setCurrentStep(3);
        } else if (currentStep === 3) {
            if (
                selectedStaff.MEDECIN.length === 0 &&
                selectedStaff.ANESTHESISTE.length === 0 &&
                selectedStaff.INFIRMIER.length === 0
            ) {
                toast.error('Veuillez sélectionner au moins un membre du personnel');
                return;
            }
            await fetchAvailableMaterials();
            setCurrentStep(4);
        } else if (currentStep === 4) {
            await fetchAvailablePatients();
            setCurrentStep(5);
        } else if (currentStep === 5) {
            if (!selectedPatient) {
                setErrors({ patients: 'Veuillez sélectionner un patient' });
                return;
            }
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        setErrors({});
        setCurrentStep((prev) => prev - 1);
    };

    // Submit handler
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const hasExistingConflict = errors.form && errors.form.includes('Conflit de réservation');
            if (!hasExistingConflict) {
                const { hasConflict } = await checkInterventionConflict();
                if (hasConflict) {
                    setErrors({
                        form:
                            'Conflit de réservation détecté. Veuillez modifier :\n' +
                            '- La salle\n' +
                            '- La date\n' +
                            '- Les horaires\n\n' +
                            'Après modification, vous pourrez enregistrer.',
                    });
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                date: formData.date,
                type: formData.type,
                statut: formData.statut,
                roomId: selectedRoom?.id ? Number(selectedRoom.id) : null,
                startTime: formData.startTime ? `${formData.date}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null,
                ...(hasExistingConflict && { force: true }),
            };

            const url = editMode
                ? `http://localhost:8089/api/interventions/${id}`
                : 'http://localhost:8089/api/interventions/with-room';

            const response = editMode
                ? await axios.put(url, payload)
                : await axios.post(url, payload);

            const interventionId = editMode ? id : response.data.id;

            // Assign staff
            await axios.post(`http://localhost:8089/api/interventions/${interventionId}/assign-staff`, selectedStaff);

            // Assign materials
            await axios.post(`http://localhost:8089/api/interventions/${interventionId}/assign-materiel`, selectedMaterials);

            // Assign patient
            if (selectedPatient?.id) {
                const patientId = Number(selectedPatient.id);
                if (!patientId || patientId <= 0) {
                    throw new Error('Invalid patient ID selected.');
                }
                setPatientLoading(true);
                try {
                    await axios.patch(`http://localhost:8089/api/interventions/${interventionId}/assign-patient`, {
                        patientId: patientId
                    });
                    toast.success('Patient assigné avec succès.');
                } catch (patientErr) {
                    // gestion erreur
                } finally {
                    setPatientLoading(false);
                }
            }

            navigate('/InterventionList', {
                state: {
                    successMessage: editMode ? 'Intervention updated successfully.' : 'Intervention created successfully.',
                    ...(hasExistingConflict && { warning: 'Conflit résolu.' }),
                },
            });
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data || 'An error occurred.';

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    if (loading) return <div className="loading">Chargement en cours...</div>;

    return (
        <div className="intervention-form-container">
            <h2>{editMode ? 'Modifier Intervention' : 'Nouvelle Intervention'}</h2>
            <Link to="/dashboard" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour au dashboard
            </Link>

            {/* Stepper Navigation */}
            <div className="stepper">
                <div className={`step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                    1. Détails
                </div>
                <div className={`step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                    2. Salle
                </div>
                <div className={`step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
                    3. Équipe
                </div>
                <div className={`step ${currentStep === 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
                    4. Matériels
                </div>
                <div className={`step ${currentStep === 5 ? 'active' : ''}`}>
                    5. Patient
                </div>
            </div>

            {errors.form && <div className="error-message">{errors.form}</div>}

            {/* Step 1: Intervention Details */}
            {currentStep === 1 && (
                <div className="step-content">
                    <h3>Détails de l'intervention</h3>
                    <form>
                        <div className={`form-group ${errors.date ? 'has-error' : ''}`}>
                            <label htmlFor="date">Date:</label>
                            <input
                                id="date"
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                required
                                className="form-control"
                                onBlur={() => validateField('date', formData.date)}
                            />
                            {errors.date && <span className="error-text">{errors.date}</span>}
                        </div>

                        <div className={`form-group ${errors.type ? 'has-error' : ''}`}>
                            <label htmlFor="type">Type:</label>
                            <select
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                className="form-control"
                                onBlur={() => validateField('type', formData.type)}
                            >
                                <option value="">Sélectionner un type</option>
                                {interventionTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && <span className="error-text">{errors.type}</span>}
                        </div>

                        <div className="time-fields">
                            <div className={`form-group ${errors.time ? 'has-error' : ''}`}>
                                <label htmlFor="startTime">Heure de début:</label>
                                <input
                                    id="startTime"
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="form-control"
                                    onBlur={() => validateField('startTime', formData.startTime)}
                                    min={
                                        formData.date === new Date().toISOString().split('T')[0]
                                            ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                            : null
                                    }
                                />
                            </div>

                            <div className={`form-group ${errors.time ? 'has-error' : ''}`}>
                                <label htmlFor="endTime">Heure de fin:</label>
                                <input
                                    id="endTime"
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="form-control"
                                    onBlur={() => validateField('endTime', formData.endTime)}
                                    min={
                                        formData.date === new Date().toISOString().split('T')[0]
                                            ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                                            : null
                                    }
                                />
                            </div>
                            {errors.time && <span className="error-text time-error">{errors.time}</span>}
                            <div className="duration-info">
                                Durée minimale: {MIN_DURATION_MINUTES} min | Durée maximale: {MAX_DURATION_HOURS} h
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="statut">Statut:</label>
                            <select
                                id="statut"
                                name="statut"
                                value={formData.statut}
                                onChange={handleChange}
                                required
                                disabled={!editMode}
                                className="form-control"
                            >
                                {statusOptions.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 2: Room Selection */}
            {currentStep === 2 && (
                <div className="step-content">
                    <h3>Sélection de la salle</h3>
                    <div className="room-section">
                        <button
                            type="button"
                            onClick={fetchAvailableRooms}
                            disabled={!formData.type || !formData.date || !formData.startTime || !formData.endTime || roomLoading}
                            className="btn btn-find-room"
                        >
                            {roomLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    Recherche en cours...
                                </>
                            ) : (
                                'Trouver une salle disponible'
                            )}
                        </button>

                        {roomLoading && <p className="loading-text">Chargement des salles disponibles...</p>}
                        {errors.rooms && <p className="error-text">{errors.rooms}</p>}

                        {availableRooms.length > 0 && (
                            <div className="room-selection">
                                <label htmlFor="room-select">Choisir une salle:</label>
                                <select
                                    id="room-select"
                                    value={selectedRoom?.id || ''}
                                    onChange={handleRoomChange}
                                    className="form-control room-select"
                                >
                                    <option value="">-- Sélectionnez une salle --</option>
                                    {availableRooms.map((room) => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} ({room.equipment})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {selectedRoom && (
                            <div className="current-room">
                                <h4>Salle sélectionnée</h4>
                                <div className="room-info">
                                    <p>
                                        <strong>Nom:</strong> {selectedRoom.name}
                                    </p>
                                    <p>
                                        <strong>Équipement:</strong> {selectedRoom.equipment}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Staff Assignment */}
            {currentStep === 3 && (
                <div className="step-content">
                    <h3>Composition de l'équipe médicale</h3>
                    <div className="staff-modal-body">
                        <div className="staff-section">
                            <h4>Médecins ({selectedStaff.MEDECIN.length} sélectionnés)</h4>
                            <div className="scroll-container">
                                <div className="staff-list-checkbox">
                                    {availableStaff.MEDECIN.map((medecin) => {
                                        const isAssigned = selectedStaff.MEDECIN.includes(medecin.id);
                                        return (
                                            <div
                                                key={medecin.id}
                                                className={`staff-item-checkbox ${isAssigned ? 'staff-assigned' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`medecin-${medecin.id}`}
                                                    checked={isAssigned}
                                                    onChange={(e) => handleStaffSelection('MEDECIN', medecin.id, e.target.checked)}
                                                    className="staff-checkbox"
                                                />
                                                <label htmlFor={`medecin-${medecin.id}`} className="staff-label">
                                                    <div className="staff-avatar">👨‍⚕️</div>
                                                    <div className="staff-info">
                                                        <div className="staff-name">
                                                            {medecin.prenom} {medecin.nom}
                                                        </div>
                                                        <div className="staff-specialty">
                                                            {medecin.specialiteMedecin || 'Généraliste'}
                                                        </div>
                                                        {isAssigned && <span className="assigned-badge">Assigné</span>}
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="staff-section">
                            <h4>Anesthésistes ({selectedStaff.ANESTHESISTE.length} sélectionnés)</h4>
                            <div className="scroll-container">
                                <div className="staff-list-checkbox">
                                    {availableStaff.ANESTHESISTE.map((anesthesiste) => {
                                        const isAssigned = selectedStaff.ANESTHESISTE.includes(anesthesiste.id);
                                        return (
                                            <div
                                                key={anesthesiste.id}
                                                className={`staff-item-checkbox ${isAssigned ? 'staff-assigned' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`anesthesiste-${anesthesiste.id}`}
                                                    checked={isAssigned}
                                                    onChange={(e) => handleStaffSelection('ANESTHESISTE', anesthesiste.id, e.target.checked)}
                                                    className="staff-checkbox"
                                                />
                                                <label htmlFor={`anesthesiste-${anesthesiste.id}`} className="staff-label">
                                                    <div className="staff-avatar">💉</div>
                                                    <div className="staff-info">
                                                        <div className="staff-name">
                                                            {anesthesiste.prenom} {anesthesiste.nom}
                                                        </div>
                                                        <div className="staff-specialty">
                                                            {anesthesiste.specialiteAnesthesiste || 'Généraliste'}
                                                        </div>
                                                        {isAssigned && <span className="assigned-badge">Assigné</span>}
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="staff-section">
                            <h4>Infirmiers ({selectedStaff.INFIRMIER.length} sélectionnés)</h4>
                            <div className="scroll-container">
                                <div className="staff-list-checkbox">
                                    {availableStaff.INFIRMIER.map((infirmier) => {
                                        const isAssigned = selectedStaff.INFIRMIER.includes(infirmier.id);
                                        return (
                                            <div
                                                key={infirmier.id}
                                                className={`staff-item-checkbox ${isAssigned ? 'staff-assigned' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    id={`infirmier-${infirmier.id}`}
                                                    checked={isAssigned}
                                                    onChange={(e) => handleStaffSelection('INFIRMIER', infirmier.id, e.target.checked)}
                                                    className="staff-checkbox"
                                                />
                                                <label htmlFor={`infirmier-${infirmier.id}`} className="staff-label">
                                                    <div className="staff-avatar">👩‍⚕️</div>
                                                    <div className="staff-info">
                                                        <div className="staff-name">
                                                            {infirmier.prenom} {infirmier.nom}
                                                        </div>
                                                        <div className="staff-specialty">{infirmier.specialite || 'Infirmier'}</div>
                                                        {isAssigned && <span className="assigned-badge">Assigné</span>}
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Material Assignment */}
            {currentStep === 4 && (
                <div className="step-content">
                    <h3>Assigner les matériels</h3>
                    {materialLoading ? (
                        <div className="loading-materials">Chargement des matériels...</div>
                    ) : availableMaterials.length > 0 ? (
                        <div className="scroll-container">
                            <div className="materials-list-checkbox">
                                {availableMaterials.map((material) => {
                                    const isAssigned = selectedMaterials.includes(material.id);
                                    const isAvailable = material.virtuallyAvailable > 0;
                                    return (
                                        <div
                                            key={material.id}
                                            className={`material-item-checkbox ${isAssigned ? 'material-assigned' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`material-${material.id}`}
                                                checked={isAssigned}
                                                onChange={(e) => handleMaterialSelection(material.id, e.target.checked)}
                                                disabled={!isAvailable && !isAssigned}
                                                className="material-checkbox"
                                            />
                                            <label htmlFor={`material-${material.id}`} className="material-label">
                                                <span className="material-name">
                                                    {material.nom}
                                                    {!isAvailable && !isAssigned && <span className="unavailable-badge">Indisponible</span>}
                                                </span>
                                                <span className="material-details">
                                                    {material.description} -
                                                    <span className={isAvailable ? 'quantity-available' : 'quantity-unavailable'}>
                                                        {material.virtuallyAvailable} disponible(s)
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="no-materials">Aucun matériel disponible</div>
                    )}
                </div>
            )}

            {/* Step 5: Patient Assignment */}
            {currentStep === 5 && (
                <div className="step-content">
                    <h3>Sélection du patient</h3>
                    <div className="patient-section">
                        {patientLoading ? (
                            <p className="loading-text">Chargement des patients disponibles...</p>
                        ) : errors.patients ? (
                            <p className="error-text">{errors.patients}</p>
                        ) : availablePatients.length > 0 ? (
                            <div className="patient-selection">
                                <label htmlFor="patient-select">Choisir un patient:</label>
                                <select
                                    id="patient-select"
                                    value={selectedPatient?.id || ''}
                                    onChange={handlePatientChange}
                                    className="form-control patient-select"
                                >
                                    <option value="">-- Sélectionnez un patient --</option>
                                    {availablePatients.map((patient) => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.prenom} {patient.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="no-patients">Aucun patient disponible</div>
                        )}

                        {selectedPatient && (
                            <div className="current-patient">
                                <h4>Patient sélectionné</h4>
                                <div className="patient-info">
                                    <p>
                                        <strong>Nom:</strong> {selectedPatient.prenom} {selectedPatient.nom}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-actions">
                {currentStep > 1 && (
                    <button type="button" onClick={handlePrevious} className="btn btn-previous">
                        Précédent
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || (currentStep < 5 && Object.keys(errors).length > 0)}
                    className="btn btn-next"
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            {currentStep === 5 ? 'Enregistrement...' : 'Chargement...'}
                        </>
                    ) : currentStep === 5 ? (
                        'Enregistrer'
                    ) : (
                        'Suivant'
                    )}
                </button>
                <button type="button" onClick={() => navigate('/InterventionList')} className="btn btn-cancel">
                    Annuler
                </button>
            </div>
        </div>
    );
};

export default InterventionForm;
