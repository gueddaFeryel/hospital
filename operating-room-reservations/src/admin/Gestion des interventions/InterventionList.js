import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import '../Gestion des interventions css/InterventionList.css';

const InterventionList = () => {
    const [interventions, setInterventions] = useState([]);
    const [filteredInterventions, setFilteredInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // États pour les modals
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);

    const [currentIntervention, setCurrentIntervention] = useState(null);

    // États pour les salles
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');
    const [roomLoading, setRoomLoading] = useState(false);

    // États pour le staff
    const [availableStaff, setAvailableStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: []
    });
    const [selectedStaff, setSelectedStaff] = useState({
        MEDECIN: null,
        ANESTHESISTE: null,
        INFIRMIER: null
    });
    const [staffLoading, setStaffLoading] = useState(false);

    // États pour les matériels
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [materialLoading, setMaterialLoading] = useState(false);

    const navigate = useNavigate();

    const ROLES = {
        MEDECIN: 'MEDECIN',
        ANESTHESISTE: 'ANESTHESISTE',
        INFIRMIER: 'INFIRMIER'
    };

    useEffect(() => {
        fetchInterventions();
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

    const fetchInterventions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8089/api/interventions');

            const interventionsData = Array.isArray(response.data) ? response.data : [];
            const interventionsWithDetails = [];

            for (const intervention of interventionsData.slice(0, 50)) {
                if (!intervention?.id) continue;

                const [roomData, staffData, materialsData] = await Promise.all([
                    intervention.roomId ?
                        axios.get(`http://localhost:8086/api/rooms/${intervention.roomId}`)
                            .then(res => res.data)
                            .catch(() => ({
                                id: intervention.roomId,
                                name: `Salle ${intervention.roomId}`,
                                equipment: 'Non disponible'
                            })) :
                        Promise.resolve(null),

                    axios.get(`http://localhost:8089/api/interventions/${intervention.id}/staff`)
                        .then(res => Array.isArray(res.data) ? res.data : [])
                        .catch(() => []),

                    axios.get(`http://localhost:8089/api/interventions/${intervention.id}/materiels`)
                        .then(res => Array.isArray(res.data) ? res.data : [])
                        .catch(() => [])
                ]);

                interventionsWithDetails.push({
                    ...intervention,
                    date: intervention.date || new Date().toISOString(),
                    room: roomData,
                    equipeMedicale: staffData,
                    materiels: materialsData
                });
            }

            // Tri des interventions par date (les plus récentes en premier)
            const sortedInterventions = interventionsWithDetails.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            setInterventions(sortedInterventions);
            setFilteredInterventions(sortedInterventions);
        } catch (err) {
            console.error("Erreur fetchInterventions:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fonctions pour la gestion des salles (existantes)
    const handleShowRoomModal = (intervention) => {
        if (!intervention || !intervention.id) {
            toast.error("Intervention invalide");
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

    // Fonctions pour la gestion du staff (existantes)
    const handleShowStaffModal = (intervention) => {
        if (!intervention || !intervention.id) {
            toast.error("Intervention invalide");
            return;
        }
        setCurrentIntervention(intervention);
        setShowStaffModal(true);
        fetchAvailableStaff(intervention);
    };

    const fetchAvailableStaff = async (intervention) => {
        if (!intervention) return;

        setStaffLoading(true);
        try {
            const startTime = intervention.startTime || `${intervention.date}T08:00:00`;
            const endTime = intervention.endTime || `${intervention.date}T18:00:00`;

            const allStaffResponse = await axios.get('http://localhost:8089/api/medical-staff');
            const allStaff = Array.isArray(allStaffResponse.data) ? allStaffResponse.data : [];

            const staffData = { MEDECIN: [], ANESTHESISTE: [], INFIRMIER: [] };

            await Promise.all(Object.values(ROLES).map(async role => {
                try {
                    const response = await axios.get('http://localhost:8089/api/interventions/available-staff', {
                        params: {
                            startTime,
                            endTime,
                            role,
                            interventionId: intervention.id
                        }
                    });
                    staffData[role] = Array.isArray(response?.data) ? response.data : [];
                } catch (err) {
                    console.error(`Erreur pour ${role}:`, err);
                    staffData[role] = allStaff.filter(staff => staff.role === role);
                }
            }));

            setAvailableStaff(staffData);

            const currentSelections = {};
            if (Array.isArray(intervention.equipeMedicale)) {
                intervention.equipeMedicale.forEach(staff => {
                    if (staff?.role && Object.values(ROLES).includes(staff.role)) {
                        currentSelections[staff.role] = staff.id;
                    }
                });
            }

            setSelectedStaff({
                MEDECIN: currentSelections.MEDECIN || null,
                ANESTHESISTE: currentSelections.ANESTHESISTE || null,
                INFIRMIER: currentSelections.INFIRMIER || null
            });

        } catch (err) {
            console.error("Erreur fetchAvailableStaff:", err);
            toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
            setAvailableStaff({ MEDECIN: [], ANESTHESISTE: [], INFIRMIER: [] });
        } finally {
            setStaffLoading(false);
        }
    };

    const handleStaffSelection = (role, staffId) => {
        setSelectedStaff(prev => ({
            ...prev,
            [role]: staffId ? parseInt(staffId) : null
        }));
    };

    const handleAssignStaff = async () => {
        if (!currentIntervention?.id) {
            toast.error("Intervention invalide");
            return;
        }

        try {
            setStaffLoading(true);

            const staffToAssign = Object.entries(selectedStaff)
                .filter(([_, id]) => id !== null && id !== undefined)
                .reduce((acc, [role, id]) => ({ ...acc, [role]: id }), {});

            if (Object.keys(staffToAssign).length === 0) {
                toast.error("Veuillez sélectionner au moins un membre du staff");
                return;
            }

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
    const fetchAvailableMaterials = async (intervention) => {
        if (!intervention) return;

        setMaterialLoading(true);
        try {
            // Formatage des dates pour l'API
            const startTime = intervention.startTime || `${intervention.date}T08:00:00`;
            const endTime = intervention.endTime || `${intervention.date}T18:00:00`;

            const response = await axios.get('http://localhost:8089/api/materiels/available', {
                params: {
                    startTime: startTime.replace(" ", "T"), // Assure le bon format
                    endTime: endTime.replace(" ", "T"),
                    interventionId: intervention.id
                }
            });

            const materials = Array.isArray(response.data) ? response.data : [];
            setAvailableMaterials(materials);

            // Charger les matériels déjà assignés
            const assignedResponse = await axios.get(
                `http://localhost:8089/api/interventions/${intervention.id}/materiels`
            );
            const assignedMaterials = Array.isArray(assignedResponse.data) ? assignedResponse.data : [];
            setSelectedMaterials(assignedMaterials.map(m => m.id));

        } catch (err) {
            console.error("Erreur fetchAvailableMaterials:", err);

            // Fallback: charger tous les matériels si l'API échoue
            try {
                const allMateriels = await axios.get('http://localhost:8089/api/materiels');
                setAvailableMaterials(Array.isArray(allMateriels.data) ? allMateriels.data : []);
            } catch (fallbackError) {
                console.error("Erreur fallback:", fallbackError);
                setAvailableMaterials([]);
            }
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

    const handleAssignMaterials = async () => {
        if (!currentIntervention?.id) {
            toast.error("Intervention invalide");
            return;
        }

        try {
            setMaterialLoading(true);

            // Format correct pour le backend
            const requestData = {
                materialIds: selectedMaterials
            };

            await axios.post(
                `http://localhost:8089/api/interventions/${currentIntervention.id}/assign-materials`,
                requestData
            );

            // Rafraîchir les données
            const [updatedIntervention, materialsResponse] = await Promise.all([
                axios.get(`http://localhost:8089/api/interventions/${currentIntervention.id}`),
                axios.get(`http://localhost:8089/api/interventions/${currentIntervention.id}/materiels`)
            ]);

            setInterventions(prev => prev.map(i =>
                i.id === currentIntervention.id
                    ? {
                        ...i,
                        ...updatedIntervention.data,
                        materiels: Array.isArray(materialsResponse.data) ? materialsResponse.data : []
                    }
                    : i
            ));

            setShowMaterialModal(false);
            toast.success("Matériels assignés avec succès");
        } catch (err) {
            console.error("Erreur handleAssignMaterials:", err);
            toast.error(`Échec: ${err.response?.data?.message || err.message}`);
        } finally {
            setMaterialLoading(false);
        }
    };
    // Fonctions communes (delete, cancel)
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

    const handleCancel = async (id) => {
        if (window.confirm('Confirmez-vous l\'annulation de cette intervention ?')) {
            try {
                await axios.patch(`http://localhost:8089/api/interventions/${id}/annuler`);
                setInterventions(prev => prev.map(i =>
                    i.id === id ? { ...i, statut: 'ANNULEE' } : i
                ));

                // Envoyer notification par email
                const intervention = interventions.find(i => i.id === id);
                if (intervention) {
                    await axios.post(`http://localhost:8089/api/interventions/${id}/notify-cancellation`);
                }

                toast.success("Intervention annulée avec succès");
            } catch (err) {
                toast.error(`Échec de l'annulation : ${err.response?.data?.message || err.message}`);
            }
        }
    };

    if (loading) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">Erreur : {error}</div>;

    return (
        <div className="intervention-container">
            <div className="header-container">
                <h2 className="header">Gestion des Interventions</h2>
                <Link to="/dashboard" className="btn btn-back">
                    <i className="fas fa-arrow-left"></i> Retour au dashboard
                </Link>
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

                <Link to="/interventions/new" className="btn btn-add">
                    <i className="fas fa-plus"></i> Nouvelle intervention
                </Link>
            </div>

            <div className="table-responsive">
                <table className="intervention-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Statut</th>
                        <th>Salle</th>
                        <th>Équipe médicale</th>
                        <th>Matériels</th>
                        <th>Heure début</th>
                        <th>Heure fin</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredInterventions.length > 0 ? (
                        filteredInterventions.map(intervention => (
                            <tr key={intervention.id}>
                                <td>
                                    {intervention.date ?
                                        format(parseISO(intervention.date), 'dd/MM/yyyy', {locale: fr}) :
                                        'Date invalide'}
                                </td>
                                <td className="type-cell">
                                    {intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}
                                </td>
                                <td>
                                    <span className={`status-badge status-${intervention.statut?.toLowerCase() || 'inconnu'}`}>
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
                                    {intervention.equipeMedicale?.length > 0 ? (
                                        <div className="staff-list">
                                            {intervention.equipeMedicale.map(staff => (
                                                <div key={`${staff.role}-${staff.id}`} className="staff-item">
                                                    <span className="staff-role">{staff.role?.toLowerCase()}:</span>
                                                    <span className="staff-name">{staff.nom} {staff.prenom}</span>
                                                </div>
                                            ))}
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
                                                    <span className="material-quantity">({materiel.quantiteDisponible})</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="no-materials">Aucun matériel</span>
                                    )}
                                </td>
                                <td>{intervention.startTime ? format(parseISO(intervention.startTime), 'HH:mm') : 'Non défini'}</td>
                                <td>{intervention.endTime ? format(parseISO(intervention.endTime), 'HH:mm') : 'Non défini'}</td>
                                <td className="actions-cell">
                                    <div className="action-buttons">
                                        <button
                                            onClick={() => navigate(`/interventions/edit/${intervention.id}`)}
                                            className="btn-action edit-btn"
                                            title="Modifier"
                                        >
                                            ✏️ Modifier
                                        </button>

                                        <button
                                            onClick={() => handleDelete(intervention.id)}
                                            className="btn-action delete-btn"
                                            title="Supprimer"
                                        >
                                            🗑️ Supprimer
                                        </button>

                                        {['PLANIFIEE', 'EN_COURS'].includes(intervention.statut) && (
                                            <button
                                                onClick={() => handleCancel(intervention.id)}
                                                className="btn-action cancel-btn"
                                                title="Annuler"
                                            >
                                                ❌ Annuler
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleShowRoomModal(intervention)}
                                            className="btn-action room-btn"
                                            disabled={!['PLANIFIEE', 'EN_COURS'].includes(intervention.statut)}
                                            title={intervention.roomId ? 'Changer salle' : 'Assigner salle'}
                                        >
                                            🏥 Salle
                                        </button>

                                        <button
                                            onClick={() => handleShowStaffModal(intervention)}
                                            className="btn-action staff-btn"
                                            disabled={!['PLANIFIEE', 'EN_COURS'].includes(intervention.statut)}
                                            title="Équipe médicale"
                                        >
                                            👨‍⚕️ Équipe
                                        </button>

                                        <button
                                            onClick={() => {
                                                setCurrentIntervention(intervention);
                                                setShowMaterialModal(true);
                                                fetchAvailableMaterials(intervention);
                                            }}
                                            className="btn-action materials-btn"
                                            title="Matériels"
                                        >
                                            🏷️ Matériels
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" className="no-interventions">
                                {loading ? 'Chargement...' : 'Aucune intervention trouvée'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Modal pour l'assignation de salle */}
            {showRoomModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Assigner une salle</h3>
                            <button onClick={() => setShowRoomModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            <label>Salle :</label>
                            <select
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="modal-select"
                                disabled={roomLoading}
                            >
                                <option value="">Sélectionnez une salle</option>
                                {roomLoading ? (
                                    <option>Chargement des salles...</option>
                                ) : availableRooms.length > 0 ? (
                                    availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} ({room.equipment})
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Aucune salle disponible</option>
                                )}
                            </select>
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
                                disabled={!selectedRoom || roomLoading}
                            >
                                {roomLoading ? 'Chargement...' : 'Assigner'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal pour l'assignation d'équipe médicale */}
            {showStaffModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>Assigner l'équipe médicale</h3>
                            <button onClick={() => setShowStaffModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            {Object.values(ROLES).map(role => (
                                <div key={role} className="staff-selection-group">
                                    <label>{role.charAt(0) + role.slice(1).toLowerCase()} :</label>
                                    <select
                                        value={selectedStaff[role] || ''}
                                        onChange={(e) => handleStaffSelection(role, e.target.value)}
                                        disabled={staffLoading}
                                        className="modal-select"
                                    >
                                        <option value="">Sélectionnez un {role.toLowerCase()}</option>
                                        {staffLoading ? (
                                            <option>Chargement...</option>
                                        ) : availableStaff[role]?.length > 0 ? (
                                            availableStaff[role].map(staff => (
                                                <option key={staff.id} value={staff.id}>
                                                    {staff.nom} {staff.prenom}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>Aucun {role.toLowerCase()} disponible</option>
                                        )}
                                    </select>
                                </div>
                            ))}
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
                                disabled={staffLoading || !Object.values(selectedStaff).some(Boolean)}
                            >
                                {staffLoading ? 'Chargement...' : 'Assigner l\'équipe'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal pour l'assignation de matériels */}
            {showMaterialModal && currentIntervention && (
                <div className="modal-backdrop">
                    <div className="modal modal-wide">
                        <div className="modal-header">
                            <h3>Assigner les matériels</h3>
                            <button onClick={() => setShowMaterialModal(false)} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body">
                            {materialLoading ? (
                                <div className="loading">Chargement des matériels...</div>
                            ) : availableMaterials.length > 0 ? (
                                <div className="materials-grid">
                                    {availableMaterials.map(material => (
                                        <div key={material.id} className="material-item">
                                            <input
                                                type="checkbox"
                                                id={`material-${material.id}`}
                                                checked={selectedMaterials.includes(material.id)}
                                                onChange={(e) => handleMaterialSelection(material.id, e.target.checked)}
                                            />
                                            <label htmlFor={`material-${material.id}`}>
                                                <span className="material-name">{material.nom}</span>
                                                <span className="material-details">
                                                    {material.description} - {material.quantiteDisponible} disponible(s)
                                                </span>
                                            </label>
                                        </div>
                                    ))}
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
        </div>
    );
};

export default InterventionList;