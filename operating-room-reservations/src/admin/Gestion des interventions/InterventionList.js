import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../Gestion des interventions css/InterventionList.css';

const InterventionList = () => {
    const [interventions, setInterventions] = useState([]);
    const [filteredInterventions, setFilteredInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [showPatientModal, setShowPatientModal] = useState(false);
    const [currentIntervention, setCurrentIntervention] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [roomLoading, setRoomLoading] = useState(false);
    const [availableStaff, setAvailableStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: []
    });
    const [selectedStaff, setSelectedStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: []
    });
    const [staffLoading, setStaffLoading] = useState(false);
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [materialLoading, setMaterialLoading] = useState(false);
    const [availablePatients, setAvailablePatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [patientLoading, setPatientLoading] = useState(false);
    const [pendingDemands, setPendingDemands] = useState([]);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validationData, setValidationData] = useState({
        roomId: '',
        startTime: '',
        endTime: '',
        materielIds: [],
        equipeMedicale: {}
    });

    const tableRef = useRef(null); // Reference to the table for PDF capture
    const navigate = useNavigate();

    const ROLES = {
        MEDECIN: 'MEDECIN',
        ANESTHESISTE: 'ANESTHESISTE',
        INFIRMIER: 'INFIRMIER'
    };

    useEffect(() => {
        fetchInterventions();
        fetchPendingDemands();
    }, []);

    useEffect(() => {
        const filtered = interventions.filter(intervention => {
            if (!intervention || !intervention.date) return false;

            try {
                const searchLower = searchTerm.toLowerCase();
                const dateFormatted = format(parseISO(intervention.date), 'dd/MM/yyyy', { locale: fr });
                const typeFormatted = intervention.type?.toLowerCase().replace(/_/g, ' ') || '';
                const statusFormatted = intervention.statut?.toLowerCase() || '';
                const roomNameFormatted = intervention.room?.name?.toLowerCase() || '';
                const patientNameFormatted = intervention.patient
                    ? `${intervention.patient.prenom} ${intervention.patient.nom}`.toLowerCase()
                    : '';
                const staffNames = intervention.equipeMedicale?.map(staff =>
                    `${staff.nom || ''} ${staff.prenom || ''}`.toLowerCase()
                ).join(' ') || '';
                const materialNames = intervention.materiels?.map(m =>
                    m.nom.toLowerCase()
                ).join(' ') || '';

                return (
                    dateFormatted.includes(searchLower) ||
                    typeFormatted.includes(searchLower) ||
                    statusFormatted.includes(searchLower) ||
                    roomNameFormatted.includes(searchLower) ||
                    patientNameFormatted.includes(searchLower) ||
                    staffNames.includes(searchLower) ||
                    materialNames.includes(searchLower)
                );
            } catch (e) {
                console.error("Erreur de filtrage:", e);
                return false;
            }
        });
        setFilteredInterventions(filtered);
    }, [searchTerm, interventions]);

    const fetchInterventions = async (pageNum = 0, append = false) => {
        try {
            setLoading(!append);
            setIsFetchingMore(append);
            const response = await axios.get('http://localhost:8089/api/interventions', {
                params: { page: pageNum, size: 10 }
            });
            const { content, totalPages, number } = response.data;
            const interventionsData = Array.isArray(content) ? content : [];
            const interventionsWithDetails = [];

            for (const intervention of interventionsData) {
                if (!intervention?.id) continue;

                try {
                    const [roomData, staffData, materialsData, patientData] = await Promise.all([
                        intervention.roomId
                            ? axios.get(`http://localhost:8086/api/rooms/${intervention.roomId}`)
                                .then(res => res.data)
                                .catch(() => null)
                            : Promise.resolve(null),
                        axios.get(`http://localhost:8089/api/interventions/${intervention.id}/staff`)
                            .then(res => res.data)
                            .catch(() => []),
                        axios.get(`http://localhost:8089/api/interventions/${intervention.id}/materiels`)
                            .then(res => res.data)
                            .catch(() => []),
                        intervention.patientId
                            ? axios.get(`http://localhost:8089/api/patients/${intervention.patientId}`)
                                .then(res => res.data)
                                .catch(() => null)
                            : Promise.resolve(null)
                    ]);

                    interventionsWithDetails.push({
                        ...intervention,
                        room: roomData,
                        equipeMedicale: Array.isArray(staffData) ? staffData : [],
                        materiels: Array.isArray(materialsData) ? materialsData : [],
                        patient: patientData
                    });
                } catch (err) {
                    console.error(`Erreur lors du chargement des détails pour l'intervention ${intervention.id}`, err);
                    interventionsWithDetails.push({
                        ...intervention,
                        room: null,
                        equipeMedicale: [],
                        materiels: [],
                        patient: null
                    });
                }
            }

            const parseTime = (timeStr) => {
                if (!timeStr) return { hours: 0, minutes: 0 };
                const [hours, minutes] = timeStr.split(':').map(Number);
                return { hours, minutes };
            };

            const sortedInterventions = [...interventionsWithDetails].sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                const dateComparison = dateB - dateA;

                if (dateComparison !== 0) return dateComparison;

                const timeA = parseTime(a.startTime);
                const timeB = parseTime(b.startTime);

                if (timeA.hours !== timeB.hours) {
                    return timeA.hours - timeB.hours;
                }

                return timeA.minutes - timeB.minutes;
            });

            setInterventions(prev => append ? [...prev, ...sortedInterventions] : sortedInterventions);
            setFilteredInterventions(prev => append ? [...prev, ...sortedInterventions] : sortedInterventions);
            setTotalPages(totalPages);
            setPage(number);
        } catch (err) {
            console.error("Erreur fetchInterventions:", err);
            let errorMessage = 'Erreur inconnue';
            if (err.response) {
                switch (err.response.status) {
                    case 404:
                        errorMessage = 'Interventions non trouvées';
                        break;
                    case 500:
                        errorMessage = 'Erreur serveur, veuillez réessayer';
                        break;
                    default:
                        errorMessage = err.response?.data?.message || err.message;
                }
            }
            setError(errorMessage);
            toast.error(`Erreur: ${errorMessage}`);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    const fetchPendingDemands = async () => {
        try {
            const response = await axios.get('http://localhost:8089/api/interventions/demandes/en-attente');
            setPendingDemands(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Erreur fetchPendingDemands:", err);
            toast.error('Erreur lors du chargement des demandes');
        }
    };

    const handleShowRoomModal = (intervention) => {
        if (!intervention || !intervention.id) {
            toast.error("Intervention invalide");
            return;
        }
        if (intervention.statut === 'EN_COURS') {
            toast.warning("Impossible de modifier la salle pour une intervention en cours");
            return;
        }
        setCurrentIntervention(intervention);
        setSelectedRoom(intervention.roomId || '');
        setShowRoomModal(true);
        fetchAvailableRooms(intervention);
    };

    const fetchAvailableRooms = async (intervention) => {
        if (!intervention) return;

        setRoomLoading(true);
        try {
            const response = await axios.get('http://localhost:8089/api/interventions/available-rooms', {
                params: {
                    startTime: intervention.startTime || `${intervention.date}T08:00:00`,
                    endTime: intervention.endTime || `${intervention.date}T18:00:00`,
                    type: intervention.type
                }
            });

            const validRooms = (Array.isArray(response.data) ? response.data : [])
                .filter(room => room && room.id)
                .map(room => ({
                    id: room.id,
                    name: room.name || `Salle ${room.id}`,
                    equipment: room.equipment || 'Équipement non spécifié'
                }));

            if (intervention.roomId && !validRooms.some(r => r.id === intervention.roomId)) {
                validRooms.unshift({
                    id: intervention.roomId,
                    name: intervention.room?.name || `Salle ${intervention.roomId}`,
                    equipment: intervention.room?.equipment || 'Non disponible'
                });
            }

            setAvailableRooms(validRooms);
        } catch (err) {
            console.error("Erreur fetchAvailableRooms:", err);
            toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
            setAvailableRooms([]);
        } finally {
            setRoomLoading(false);
        }
    };

    const handleAssignRoom = async () => {
        if (!selectedRoom || !currentIntervention?.id) {
            toast.error("Veuillez sélectionner une salle valide");
            return;
        }

        try {
            setRoomLoading(true);
            const selectedRoomData = availableRooms.find(r => r.id === selectedRoom);

            await axios.patch(
                `http://localhost:8089/api/interventions/${currentIntervention.id}/assign-room`,
                null,
                { params: { roomId: selectedRoom } }
            );

            setInterventions(prev => prev.map(i =>
                i.id === currentIntervention.id
                    ? {
                        ...i,
                        room: selectedRoomData,
                        roomId: selectedRoom
                    }
                    : i
            ));

            setShowRoomModal(false);
            setSelectedRoom('');
            toast.success("Salle assignée avec succès");
        } catch (err) {
            console.error("Erreur handleAssignRoom:", err);
            toast.error(`Échec de l'attribution: ${err.response?.data?.message || err.message}`);
        } finally {
            setRoomLoading(false);
        }
    };

    const handleStaffSelection = (role, staffId, isChecked) => {
        setSelectedStaff(prev => {
            const currentSelection = prev[role];
            const newSelection = isChecked
                ? [...currentSelection, staffId]
                : currentSelection.filter(id => id !== staffId);

            return {
                ...prev,
                [role]: newSelection
            };
        });
    };

    const prefillStaffSelections = (intervention) => {
        if (!intervention?.equipeMedicale) return;

        const staffByRole = {
            MEDECIN: [],
            ANESTHESISTE: [],
            INFIRMIER: []
        };

        intervention.equipeMedicale.forEach(staff => {
            if (staff.role === 'MEDECIN') {
                staffByRole.MEDECIN.push(staff.id);
            } else if (staff.role === 'ANESTHESISTE') {
                staffByRole.ANESTHESISTE.push(staff.id);
            } else if (staff.role === 'INFIRMIER') {
                staffByRole.INFIRMIER.push(staff.id);
            }
        });

        setSelectedStaff(staffByRole);
    };

    const handleShowStaffModal = (intervention) => {
        if (!intervention || !intervention.id) {
            toast.error("Intervention invalide");
            return;
        }
        if (intervention.statut === 'EN_COURS') {
            toast.warning("Impossible de modifier l'équipe pour une intervention en cours");
            return;
        }
        setCurrentIntervention(intervention);
        prefillStaffSelections(intervention);
        setShowStaffModal(true);
        fetchAvailableStaff(intervention);
    };

    const handleAssignStaff = async () => {
        if (!currentIntervention?.id) {
            toast.error("Intervention invalide");
            return;
        }

        try {
            setStaffLoading(true);

            const staffToAssign = {
                MEDECIN: selectedStaff.MEDECIN,
                ANESTHESISTE: selectedStaff.ANESTHESISTE,
                INFIRMIER: selectedStaff.INFIRMIER
            };

            await axios.post(
                `http://localhost:8089/api/interventions/${currentIntervention.id}/assign-staff`,
                staffToAssign
            );

            const [updatedIntervention, staffResponse] = await Promise.all([
                axios.get(`http://localhost:8089/api/interventions/${currentIntervention.id}`),
                axios.get(`http://localhost:8089/api/interventions/${currentIntervention.id}/staff`)
            ]);

            setInterventions(prev => prev.map(i =>
                i.id === currentIntervention.id
                    ? {
                        ...i,
                        ...updatedIntervention.data,
                        equipeMedicale: Array.isArray(staffResponse.data) ? staffResponse.data : []
                    }
                    : i
            ));

            setShowStaffModal(false);
            toast.success("Équipe médicale assignée avec succès");
        } catch (err) {
            console.error("Erreur handleAssignStaff:", err);
            toast.error(`Échec de l'attribution: ${err.response?.data?.message || err.message}`);
        } finally {
            setStaffLoading(false);
        }
    };

    const fetchAvailableStaff = async (intervention) => {
        if (!intervention) return;

        setStaffLoading(true);
        try {
            const startTime = intervention.startTime || `${intervention.date}T08:00:00`;
            const endTime = intervention.endTime || `${intervention.date}T18:00:00`;

            const assignedStaffResponse = await axios.get(
                `http://localhost:8089/api/interventions/${intervention.id}/staff`
            );
            const assignedStaff = Array.isArray(assignedStaffResponse.data) ? assignedStaffResponse.data : [];

            const staffData = { MEDECIN: [], ANESTHESISTE: [], INFIRMIER: [] };

            await Promise.all(Object.values(ROLES).map(async role => {
                try {
                    const response = await axios.get('http://localhost:8089/api/interventions/available-staff-by-specialite', {
                        params: {
                            startTime,
                            endTime,
                            role,
                            interventionType: intervention.type
                        }
                    });

                    const availableStaff = Array.isArray(response?.data) ? response.data : [];

                    const allStaff = [...assignedStaff.filter(s => s.role === role), ...availableStaff];
                    const uniqueStaff = allStaff.reduce((acc, current) => {
                        const x = acc.find(item => item.id === current.id);
                        if (!x) {
                            return acc.concat([current]);
                        } else {
                            return acc;
                        }
                    }, []);

                    staffData[role] = uniqueStaff;
                } catch (err) {
                    console.error(`Erreur pour ${role}:`, err);
                    const fallbackResponse = await axios.get('http://localhost:8089/api/interventions/available-staff', {
                        params: { startTime, endTime, role }
                    });

                    const fallbackStaff = Array.isArray(fallbackResponse?.data)
                        ? fallbackResponse.data.filter(staff =>
                            role === 'INFIRMIER' || isStaffCompatible(staff, role, intervention.type))
                        : [];

                    staffData[role] = [...assignedStaff.filter(s => s.role === role), ...fallbackStaff];
                }
            }));

            setAvailableStaff(staffData);
        } catch (err) {
            console.error("Erreur fetchAvailableStaff:", err);
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
                INFIRMIER: []
            },
            ORTHOPEDIQUE: {
                MEDECIN: ['ORTHOPEDIE', 'TRAUMATOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_ORTHOPEDIQUE'],
                INFIRMIER: []
            },
            NEUROCHIRURGIE: {
                MEDECIN: ['NEUROLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_NEUROCHIRURGICALE'],
                INFIRMIER: []
            },
            OPHTALMOLOGIQUE: {
                MEDECIN: ['OPHTALMOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            },
            UROLOGIE: {
                MEDECIN: ['UROLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            },
            GYNECOLOGIQUE: {
                MEDECIN: ['GYNECOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            },
            AUTRE: {
                MEDECIN: ['CHIRURGIE_GENERALE', 'AUTRE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            }
        };

        return typeToSpecialities[interventionType] || {
            MEDECIN: [],
            ANESTHESISTE: [],
            INFIRMIER: []
        };
    };

    const fetchAvailableMaterials = async (intervention) => {
        setMaterialLoading(true);
        try {
            const [allMaterialsResponse, assignedResponse] = await Promise.all([
                axios.get('http://localhost:8089/api/materiels'),
                axios.get(`http://localhost:8089/api/interventions/${intervention.id}/materiels`)
            ]);

            let usageCounts = {};
            try {
                const usageResponse = await axios.get('http://localhost:8089/api/interventions/materiels/usage-counts');
                usageCounts = usageResponse.data || {};
            } catch (usageErr) {
                console.warn("Impossible de récupérer les counts d'usage", usageErr);
            }

            const allMaterials = Array.isArray(allMaterialsResponse.data) ? allMaterialsResponse.data : [];
            const assignedMaterials = Array.isArray(assignedResponse.data) ? assignedResponse.data : [];

            const availableMaterials = allMaterials.map(material => {
                const inUse = usageCounts[material.id] || 0;
                return {
                    ...material,
                    virtuallyAvailable: material.quantiteDisponible - inUse,
                    isAssigned: assignedMaterials.some(m => m.id === material.id)
                };
            });

            setAvailableMaterials(availableMaterials);
            setSelectedMaterials(assignedMaterials.map(m => m.id));
        } catch (err) {
            console.error("Erreur fetchAvailableMaterials:", err);
            setAvailableMaterials([]);
            toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
        } finally {
            setMaterialLoading(false);
        }
    };

    const handleMaterialSelection = (materialId, isChecked) => {
        setSelectedMaterials(prev =>
            isChecked
                ? [...prev, materialId]
                : prev.filter(id => id !== materialId)
        );
    };

    const handleShowMaterialModal = (intervention) => {
        if (!intervention || !intervention.id) {
            toast.error("Intervention invalide");
            return;
        }
        if (intervention.statut === 'EN_COURS') {
            toast.warning("Impossible de modifier les matériels pour une intervention en cours");
            return;
        }
        setCurrentIntervention(intervention);
        setShowMaterialModal(true);
        fetchAvailableMaterials(intervention);
    };

    const handleAssignMaterials = async () => {
        try {
            setMaterialLoading(true);

            setInterventions(prev => prev.map(i =>
                i.id === currentIntervention.id
                    ? {
                        ...i,
                        materiels: availableMaterials.filter(m => selectedMaterials.includes(m.id))
                    }
                    : i
            ));

            await axios.post(
                `http://localhost:8089/api/interventions/${currentIntervention.id}/assign-materiel`,
                selectedMaterials
            );

            await fetchAvailableMaterials(currentIntervention);
            await fetchInterventions();

            toast.success("Matériels assignés avec succès");
            setShowMaterialModal(false);
        } catch (err) {
            setInterventions(prev => prev);
            console.error("Erreur assignation matériels:", err);
            toast.error(err.response?.data?.message || "Erreur lors de l'assignation");
        } finally {
            setMaterialLoading(false);
        }
    };

    const handleShowPatientModal = async (intervention) => {
        if (!intervention || !intervention.id) {
            toast.error("Intervention invalide");
            return;
        }
        if (intervention.statut === 'EN_COURS') {
            toast.warning("Impossible de modifier le patient pour une intervention en cours");
            return;
        }
        setCurrentIntervention(intervention);
        setSelectedPatient(intervention.patient?.id || '');
        setShowPatientModal(true);
        await fetchAvailablePatients();
    };

    const fetchAvailablePatients = async () => {
        setPatientLoading(true);
        try {
            const response = await axios.get('http://localhost:8089/api/patients');
            setAvailablePatients(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Erreur fetchAvailablePatients:", err);
            toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
            setAvailablePatients([]);
        } finally {
            setPatientLoading(false);
        }
    };

    const handleAssignPatient = async () => {
        if (!selectedPatient || !currentIntervention?.id) {
            toast.error("Veuillez sélectionner un patient");
            return;
        }

        try {
            setPatientLoading(true);
            await axios.patch(
                `http://localhost:8089/api/interventions/${currentIntervention.id}/assign-patient`,
                { patientId: Number(selectedPatient) }
            );

            const selectedPatientData = availablePatients.find(p => p.id === Number(selectedPatient));
            setInterventions(prev => prev.map(i =>
                i.id === currentIntervention.id
                    ? { ...i, patient: selectedPatientData, patientId: selectedPatient }
                    : i
            ));

            setShowPatientModal(false);
            setSelectedPatient('');
            toast.success("Patient assigné avec succès");
        } catch (err) {
            console.error("Erreur handleAssignPatient:", err);
            toast.error(`Échec de l'attribution: ${err.response?.data?.message || err.message}`);
        } finally {
            setPatientLoading(false);
        }
    };

    const handleShowValidationModal = async (demand) => {
        if (!demand || !demand.id) {
            toast.error("Demande invalide");
            return;
        }
        setCurrentIntervention(demand);
        setValidationData({
            roomId: demand.roomId || '',
            startTime: demand.startTime || '',
            endTime: demand.endTime || '',
            materielIds: demand.materiels?.map(m => m.id) || [],
            equipeMedicale: demand.equipeMedicale?.reduce((acc, staff) => ({
                ...acc,
                [staff.role]: staff.id
            }), {}) || {}
        });
        setShowValidationModal(true);
        await Promise.all([
            fetchAvailableRooms(demand),
            fetchAvailableStaff(demand),
            fetchAvailableMaterials(demand)
        ]);
    };

    const handleValidateDemand = async () => {
        if (!currentIntervention?.id) {
            toast.error("Demande invalide");
            return;
        }

        try {
            setLoading(true);
            await axios.post(
                `http://localhost:8089/api/interventions/demandes/${currentIntervention.id}/planifier`,
                validationData
            );

            setPendingDemands(prev => prev.filter(d => d.id !== currentIntervention.id));
            await fetchInterventions();
            setShowValidationModal(false);
            toast.success("Demande validée avec succès");
        } catch (err) {
            console.error("Erreur handleValidateDemand:", err);
            toast.error(`Échec de la validation: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (page + 1 < totalPages) {
            fetchInterventions(page + 1, true);
        }
    };

    const handleCompleteIntervention = async (id) => {
        if (window.confirm('Confirmez-vous la fin de cette intervention ? Les matériels seront retournés au stock.')) {
            try {
                setLoading(true);
                const response = await axios.patch(
                    `http://localhost:8089/api/interventions/${id}/complete`
                );

                setInterventions(prev => prev.map(i =>
                    i.id === id ? response.data : i
                ));

                toast.success("Intervention terminée avec succès");
            } catch (err) {
                toast.error(err.response?.data?.message || "Erreur lors de la fin de l'intervention");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm('Confirmez-vous l\'annulation de cette intervention ? Les matériels seront retournés au stock.')) {
            try {
                setLoading(true);
                const response = await axios.patch(
                    `http://localhost:8089/api/interventions/${id}/annuler`
                );

                setInterventions(prev => prev.map(i =>
                    i.id === id ? { ...i, ...response.data } : i
                ));

                toast.success("Intervention annulée avec succès");
            } catch (err) {
                console.error('Cancel Error:', {
                    status: err.response?.status,
                    data: err.response?.data,
                    message: err.message
                });
                toast.error(err.response?.data?.message || "Erreur lors de l'annulation");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Confirmez-vous la suppression définitive de cette intervention ?')) {
            try {
                await axios.delete(`http://localhost:8089/api/interventions/${id}`);
                setInterventions(prev => prev.filter(i => i.id !== id));
                toast.success("Intervention supprimée avec succès");
            } catch (err) {
                toast.error(err.response?.data?.message || "Erreur lors de la suppression");
            }
        }
    };

    const handlePrintIntervention = (intervention) => {
        const printWindow = window.open('', '_blank');
        const printContent = `
        <html>
            <head>
                <title>Détails de l'intervention #${intervention.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; }
                    .header { margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-weight: bold; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .footer { margin-top: 30px; font-style: italic; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Rapport d'intervention chirurgicale</h1>
                    <p>Date d'impression: ${new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                
                <div class="section">
                    <div class="section-title">Informations générales</div>
                    <table>
                        <tr>
                            <th>Numéro d'intervention</th>
                            <td>${intervention.id}</td>
                        </tr>
                        <tr>
                            <th>Date</th>
                            <td>${format(parseISO(intervention.date), 'dd/MM/yyyy', { locale: fr })}</td>
                        </tr>
                        <tr>
                            <th>Type</th>
                            <td>${intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}</td>
                        </tr>
                        <tr>
                            <th>Statut</th>
                            <td>${intervention.statut?.toLowerCase() || 'inconnu'}</td>
                        </tr>
                        <tr>
                            <th>Heure début</th>
                            <td>${intervention.startTime ? format(parseISO(intervention.startTime), 'HH:mm') : 'Non défini'}</td>
                        </tr>
                        <tr>
                            <th>Heure fin</th>
                            <td>${intervention.endTime ? format(parseISO(intervention.endTime), 'HH:mm') : 'Non défini'}</td>
                        </tr>
                    </table>
                </div>
                
                <div class="section">
                    <div class="section-title">Salle d'opération</div>
                    ${intervention.room ? `
                        <table>
                            <tr>
                                <th>Nom</th>
                                <td>${intervention.room.name}</td>
                            </tr>
                            <tr>
                                <th>Équipement</th>
                                <td>${intervention.room.equipment}</td>
                            </tr>
                        </table>
                    ` : '<p>Aucune salle attribuée</p>'}
                </div>
                
                <div class="section">
                    <div class="section-title">Patient</div>
                    ${intervention.patient ? `
                        <table>
                            <tr>
                                <th>Nom complet</th>
                                <td>${intervention.patient.prenom} ${intervention.patient.nom}</td>
                            </tr>
                            <tr>
                                <th>Date de naissance</th>
                                <td>${format(parseISO(intervention.patient.dateNaissance), 'dd/MM/yyyy', { locale: fr })}</td>
                            </tr>
                        </table>
                    ` : '<p>Aucun patient assigné</p>'}
                </div>
                
                <div class="section">
                    <div class="section-title">Équipe médicale</div>
                    ${intervention.equipeMedicale?.length > 0 ? `
                        <table>
                            <thead>
                                <tr>
                                    <th>Rôle</th>
                                    <th>Nom</th>
                                    <th>Spécialité</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${intervention.equipeMedicale.map(staff => `
                                    <tr>
                                        <td>${staff.role}</td>
                                        <td>${staff.prenom} ${staff.nom}</td>
                                        <td>${staff.specialite || 'Non spécifié'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Aucune équipe assignée</p>'}
                </div>
                
                <div class="section">
                    <div class="section-title">Matériels utilisés</div>
                    ${intervention.materiels?.length > 0 ? `
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Quantité</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${intervention.materiels.map(materiel => `
                                    <tr>
                                        <td>${materiel.nom}</td>
                                        <td>${materiel.quantiteDisponible}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>Aucun matériel utilisé</p>'}
                </div>
                
                <div class="footer">
                    <p>Signature du médecin responsable: _________________________</p>
                    <p>Date: _________________________</p>
                </div>
            </body>
        </html>
    `;

        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handlePrintAllAsPDF = async () => {
        if (!tableRef.current) {
            toast.error("Tableau non trouvé");
            return;
        }

        try {
            setLoading(true);
            const canvas = await html2canvas(tableRef.current, {
                scale: 2, // Increase resolution
                useCORS: true,
                windowWidth: tableRef.current.scrollWidth,
                windowHeight: tableRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 280; // A4 width in mm (landscape)
            const pageHeight = 210; // A4 height in mm (landscape)
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`interventions_list_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`);
            toast.success("PDF généré avec succès");
        } catch (err) {
            console.error("Erreur lors de la génération du PDF:", err);
            toast.error("Erreur lors de la génération du PDF");
        } finally {
            setLoading(false);
        }
    };

    const calculateTimeStatus = (intervention) => {
        if (!intervention.startTime || !intervention.endTime) {
            return { status: 'non-defini', message: 'Non défini' };
        }

        const now = new Date();
        const start = new Date(intervention.startTime);
        const end = new Date(intervention.endTime);

        if (now < start) {
            const diffMs = start - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return {
                status: 'avant-debut',
                message: `Début dans ${diffHours}h ${diffMinutes}m`
            };
        } else if (now >= start && now < end) {
            const diffMs = end - now;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return {
                status: 'en-cours',
                message: `Termine dans ${diffHours}h ${diffMinutes}m`
            };
        } else {
            return {
                status: 'termine',
                message: 'Terminé'
            };
        }
    };

    if (loading && !isFetchingMore) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">Erreur : {error}</div>;

    return (
        <div className="intervention-container">
            <div className="header-container">
                <h2 className="header">Gestion des Interventions</h2>
            </div>

            <div className="controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Rechercher une intervention..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <i className="fas fa-search search-icon"></i>
                </div>
                <button
                    onClick={handlePrintAllAsPDF}
                    className="btn btn-confirm ml-4"
                    disabled={loading || filteredInterventions.length === 0}
                >
                    🖨️ Imprimer tout en PDF
                </button>
            </div>

            <Link to="/interventions/new" className="btn btn-add">
                <i className="fas fa-plus"></i> Ajouter Une Nouvelle intervention
            </Link>
            <div className="table-responsive" ref={tableRef}>
                <table className="intervention-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Salle</th>
                        <th>Patient</th>
                        <th>Équipe médicale</th>
                        <th>Matériels</th>
                        <th>Heure début</th>
                        <th>Heure Fin</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredInterventions.length > 0 ? (
                        filteredInterventions.map(intervention => (
                            <tr key={intervention.id}>
                                <td>
                                    {intervention.date
                                        ? format(parseISO(intervention.date), 'dd/MM/yyyy', { locale: fr })
                                        : 'Date invalide'}
                                </td>
                                <td className="type-cell">
                                    {intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}
                                </td>
                                <td>
                                    <span
                                        className={`status-badge status-${intervention.statut?.toLowerCase() || 'inconnu'}`}>
                                        {intervention.statut?.toLowerCase() || 'inconnu'}
                                    </span>
                                </td>
                                <td>
                                    {intervention.room ? (
                                        <div className="room-info">
                                            <span className="room-name">{intervention.room.name}</span>
                                            <span className="room-equipment">{intervention.room.equipment}</span>
                                        </div>
                                    ) : (
                                        <span className="no-room">Non attribuée</span>
                                    )}
                                </td>
                                <td>
                                    {intervention.patient ? (
                                        <div className="patient-info">
                                            <div className="patient-name">
                                                {intervention.patient.prenom} {intervention.patient.nom}
                                            </div>
                                            <div className="patient-dob">
                                                {intervention.patient.dateNaissance
                                                    ? format(parseISO(intervention.patient.dateNaissance), 'dd/MM/yyyy', { locale: fr })
                                                    : 'Date de naissance inconnue'}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="no-patient">Non assigné</span>
                                    )}
                                </td>
                                <td>
                                    {intervention.equipeMedicale?.length > 0 ? (
                                        <div className="staff-list-container">
                                            <div className="staff-list">
                                                {intervention.equipeMedicale.map(staff => (
                                                    <div key={`${staff.role}-${staff.id}`} className="staff-item">
                                                        <span className={`staff-badge staff-${staff.role.toLowerCase()}`}>
                                                            {staff.role === 'MEDECIN' ? '👨‍⚕️' :
                                                                staff.role === 'ANESTHESISTE' ? '💉' : '👩‍⚕️'}
                                                            {staff.nom} {staff.prenom}
                                                            {staff.specialite && (
                                                                <span className="staff-specialty"> ({staff.specialite})</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="no-staff">Non assignée</span>
                                    )}
                                </td>
                                <td>
                                    {intervention.materiels?.length > 0 ? (
                                        <div className="materials-list">
                                            {intervention.materiels.map(materiel => (
                                                <div key={materiel.id} className="material-item">
                                                    <span className="material-name">{materiel.nom}</span>
                                                    <span
                                                        className="material-quantity">({materiel.quantiteDisponible})</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="no-materials">Aucun matériel</span>
                                    )}
                                </td>
                                <td>
                                    {intervention.startTime ? format(parseISO(intervention.startTime), 'HH:mm') : 'Non défini'}
                                    <div className={`time-status ${calculateTimeStatus(intervention).status}`}>
                                        {calculateTimeStatus(intervention).message}
                                    </div>
                                </td>
                                <td>
                                    {intervention.endTime ? format(parseISO(intervention.endTime), 'HH:mm') : 'Non défini'}
                                </td>
                                <td className="actions-cell">
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => navigate(`/interventions/edit/${intervention.id}`)}
                                            className="btn-action edit-btn"
                                            title="Modifier"
                                            disabled={intervention.statut === 'TERMINEE' || intervention.statut === 'ANNULEE' || intervention.statut === 'EN_COURS'}
                                        >
                                            ✏️ Modifier
                                        </button>
                                        <button
                                            onClick={() => handleDelete(intervention.id)}
                                            className="btn-action delete-btn"
                                            title="Supprimer"
                                            disabled={intervention.statut !== 'PLANIFIEE'}
                                        >
                                            🗑️ Supprimer
                                        </button>
                                        {intervention.statut === 'EN_COURS' && (
                                            <button
                                                onClick={() => handleCompleteIntervention(intervention.id)}
                                                className="btn-action complete-btn"
                                                title="Terminer l'intervention"
                                            >
                                                ✅ Terminer
                                            </button>
                                        )}
                                        {['PLANIFIEE', 'EN_COURS'].includes(intervention.statut) && (
                                            <button
                                                onClick={() => handleCancel(intervention.id)}
                                                className="btn-action cancel-btn"
                                                title="Annuler l'intervention"
                                            >
                                                ❌ Annuler
                                            </button>
                                        )}
                                        {intervention.statut === 'TERMINEE' && (
                                            <button
                                                onClick={() => handlePrintIntervention(intervention)}
                                                className="btn-action print-btn"
                                                title="Imprimer les détails"
                                            >
                                                🖨️ Imprimer
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" className="no-interventions">
                                {loading ? 'Chargement...' : 'Aucune intervention trouvée'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {page + 1 < totalPages && (
                <button
                    onClick={handleLoadMore}
                    className="btn btn-confirm mt-4 mx-auto block"
                    disabled={isFetchingMore}
                >
                    {isFetchingMore ? 'Chargement...' : 'plus'}
                </button>
            )}

            {showRoomModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Assigner une salle</h3>
                            <button onClick={() => setShowRoomModal(false)} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            {roomLoading ? (
                                <div>Chargement des salles...</div>
                            ) : (
                                <select
                                    value={selectedRoom}
                                    onChange={(e) => setSelectedRoom(e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Sélectionner une salle</option>
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} ({room.equipment})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowRoomModal(false)}
                                className="btn btn-cancel"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAssignRoom}
                                className="btn btn-confirm"
                                disabled={roomLoading || !selectedRoom}
                            >
                                {roomLoading ? 'Assignation...' : 'Assigner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStaffModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>Composition de l'équipe médicale</h3>
                            <button onClick={() => setShowStaffModal(false)} className="close-btn">×</button>
                        </div>
                        <div className="modal-body staff-modal-body">
                            <div className="staff-section">
                                <h4>Médecins ({selectedStaff.MEDECIN.length} sélectionnés)</h4>
                                <div className="scroll-container">
                                    <div className="staff-list-checkbox">
                                        {availableStaff.MEDECIN.map(medecin => {
                                            const isAssigned = selectedStaff.MEDECIN.includes(medecin.id);
                                            return (
                                                <div key={medecin.id}
                                                     className={`staff-item-checkbox ${isAssigned ? 'staff-assigned' : ''}`}>
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
                                                            <div className="staff-name">{medecin.prenom} {medecin.nom}</div>
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
                                        {availableStaff.ANESTHESISTE.map(anesthesiste => {
                                            const isAssigned = selectedStaff.ANESTHESISTE.includes(anesthesiste.id);
                                            return (
                                                <div key={anesthesiste.id} className={`staff-item-checkbox ${isAssigned ? 'staff-assigned' : ''}`}>
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
                                                            <div className="staff-name">{anesthesiste.prenom} {anesthesiste.nom}</div>
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
                                        {availableStaff.INFIRMIER.map(infirmier => {
                                            const isAssigned = selectedStaff.INFIRMIER.includes(infirmier.id);
                                            return (
                                                <div key={infirmier.id} className={`staff-item-checkbox ${isAssigned ? 'staff-assigned' : ''}`}>
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
                                                            <div className="staff-name">{infirmier.prenom} {infirmier.nom}</div>
                                                            <div className="staff-specialty">
                                                                {infirmier.specialite || 'Infirmier'}
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
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowStaffModal(false)}
                                className="btn btn-cancel"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAssignStaff}
                                className="btn btn-confirm"
                                disabled={staffLoading}
                            >
                                {staffLoading ? 'Enregistrement...' : 'Valider la sélection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMaterialModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>Assigner les matériels</h3>
                            <button onClick={() => setShowMaterialModal(false)} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            {materialLoading ? (
                                <div className="loading-materials">Chargement des matériels...</div>
                            ) : availableMaterials.length > 0 ? (
                                <div className="scroll-container">
                                    <div className="materials-list-checkbox">
                                        {availableMaterials.map(material => {
                                            const isAssigned = selectedMaterials.includes(material.id);
                                            const isAvailable = material.virtuallyAvailable > 0;
                                            const isReadOnly = currentIntervention.statut === 'TERMINEE' ||
                                                currentIntervention.statut === 'ANNULEE';

                                            return (
                                                <div key={material.id} className={`material-item-checkbox ${isAssigned ? 'material-assigned' : ''}`}>
                                                    {isReadOnly ? (
                                                        <label className="material-label">
                                                            <span className="material-name">{material.nom}</span>
                                                            <span className="material-details">
                                                                {material.description} - Utilisé: {material.isAssigned ? 'Oui' : 'Non'}
                                                            </span>
                                                        </label>
                                                    ) : (
                                                        <>
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
                                                                    {!isAvailable && !isAssigned && (
                                                                        <span className="unavailable-badge">Indisponible</span>
                                                                    )}
                                                                </span>
                                                                <span className="material-details">
                                                                    {material.description} -
                                                                    <span className={isAvailable ? "quantity-available" : "quantity-unavailable"}>
                                                                        {material.virtuallyAvailable} disponible(s)
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-materials">Aucun matériel disponible</div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowMaterialModal(false)}
                                className="btn btn-cancel"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAssignMaterials}
                                className="btn btn-confirm"
                                disabled={materialLoading || selectedMaterials.length === 0}
                            >
                                {materialLoading ? 'Chargement...' : 'Assigner les matériels'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPatientModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Assigner un patient</h3>
                            <button onClick={() => setShowPatientModal(false)} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            {patientLoading ? (
                                <div>Chargement des patients...</div>
                            ) : (
                                <select
                                    value={selectedPatient}
                                    onChange={(e) => setSelectedPatient(e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Sélectionner un patient</option>
                                    {availablePatients.map(patient => (
                                        <option key={patient.id} value={patient.id}>
                                            {patient.prenom} {patient.nom} ({format(parseISO(patient.dateNaissance), 'dd/MM/yyyy', { locale: fr })})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowPatientModal(false)}
                                className="btn btn-cancel"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAssignPatient}
                                className="btn btn-confirm"
                                disabled={patientLoading || !selectedPatient}
                            >
                                {patientLoading ? 'Assignation...' : 'Assigner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showValidationModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>Valider la demande #{currentIntervention.id}</h3>
                            <button onClick={() => setShowValidationModal(false)} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-2">
                                <label>Salle</label>
                                <select
                                    value={validationData.roomId}
                                    onChange={(e) => setValidationData(prev => ({ ...prev, roomId: e.target.value }))}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Sélectionner</option>
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label>Heure de début</label>
                                <input
                                    type="datetime-local"
                                    value={validationData.startTime}
                                    onChange={(e) => setValidationData(prev => ({ ...prev, startTime: e.target.value }))}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mb-2">
                                <label>Heure de fin</label>
                                <input
                                    type="datetime-local"
                                    value={validationData.endTime}
                                    onChange={(e) => setValidationData(prev => ({ ...prev, endTime: e.target.value }))}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div className="mb-2">
                                <h4>Matériels</h4>
                                {availableMaterials.map(material => (
                                    <div key={material.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={validationData.materielIds.includes(material.id)}
                                            onChange={(e) => {
                                                setValidationData(prev => ({
                                                    ...prev,
                                                    materielIds: e.target.checked
                                                        ? [...prev.materielIds, material.id]
                                                        : prev.materielIds.filter(id => id !== material.id)
                                                }));
                                            }}
                                            className="mr-2"
                                        />
                                        <label>{material.nom}</label>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <h4>Équipe médicale</h4>
                                {['MEDECIN', 'ANESTHESISTE', 'INFIRMIER'].map(role => (
                                    <div key={role} className="mb-2">
                                        <label>{role}</label>
                                        <select
                                            value={validationData.equipeMedicale[role] || ''}
                                            onChange={(e) => setValidationData(prev => ({
                                                ...prev,
                                                equipeMedicale: { ...prev.equipeMedicale, [role]: e.target.value }
                                            }))}
                                            className="w-full p-2 border rounded"
                                        >
                                            <option value="">Aucun</option>
                                            {availableStaff[role].map(staff => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.prenom} {staff.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                onClick={() => setShowValidationModal(false)}
                                className="btn btn-cancel"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleValidateDemand}
                                className="btn btn-confirm"
                                disabled={loading}
                            >
                                {loading ? 'Validation...' : 'Valider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterventionList;
