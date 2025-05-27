import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    differenceInMinutes,
    differenceInHours,
    formatDistanceToNow,
    subDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
    FaClock,
    FaHourglassStart,
    FaHourglassEnd,
    FaTimes,
} from 'react-icons/fa';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import '../Gestion des interventions css/Calendar.css';

// Register Chart.js components
ChartJS.register(...registerables);

// Memoize the day cell to prevent unnecessary re-renders
const CalendarDay = memo(
    ({ day, currentDate, selectedDate, isTodayDate, dayInterventions, setSelectedDate }) => {
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        return (
            <div
                className={`calendar-day ${isCurrentMonth ? '' : 'other-month'} ${
                    isSelected ? 'selected-day' : ''
                } ${isTodayDate ? 'today-day' : ''}`}
                onClick={() => setSelectedDate(day)}
            >
                <div className="day-number">
                    {format(day, 'd')}
                    {isTodayDate && <div className="today-marker">Aujourd'hui</div>}
                </div>
                {dayInterventions.length > 0 && (
                    <div className="intervention-indicator">{dayInterventions.length}</div>
                )}
            </div>
        );
    }
);

const InterventionCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [todayInterventions, setTodayInterventions] = useState([]);
    const [statusData, setStatusData] = useState({});
    const [typeData, setTypeData] = useState({});
    const [dailyData, setDailyData] = useState({});
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [interventionDetails, setInterventionDetails] = useState(null);

    const updateInterventionStatus = (intervention) => {
        const now = new Date();
        const startTime = intervention.startTime ? new Date(intervention.startTime) : null;
        const endTime = intervention.endTime ? new Date(intervention.endTime) : null;

        if (!startTime || !endTime) return intervention;

        let newStatus = intervention.statut;
        if (now >= startTime && now <= endTime && intervention.statut !== 'EN_COURS') {
            newStatus = 'EN_COURS';
        } else if (now > endTime && intervention.statut !== 'TERMINEE') {
            newStatus = 'TERMINEE';
        }

        return newStatus !== intervention.statut
            ? { ...intervention, statut: newStatus }
            : intervention;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setInterventions((prev) => prev.map(updateInterventionStatus));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchInterventions();
        fetchStats();
    }, [currentDate]);

    useEffect(() => {
        const todayInts = interventions.filter((intervention) => {
            try {
                return isSameDay(new Date(intervention.date), new Date());
            } catch {
                return false;
            }
        });
        setTodayInterventions(todayInts);
    }, [interventions]);

    const fetchInterventions = async () => {
        try {
            setLoading(true);
            const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

            const response = await axios.get('http://localhost:8089/api/interventions', {
                params: { startDate, endDate },
            });

            const interventionsData = Array.isArray(response.data) ? response.data : [];
            console.log('Interventions API response:', interventionsData);

            const interventionsWithDetails = await Promise.all(
                interventionsData.slice(0, 50).map(async (intervention) => {
                    if (!intervention?.id) {
                        console.warn('Skipping intervention with missing id:', intervention);
                        return null;
                    }

                    const [roomData, staffData, materielData] = await Promise.all([
                        intervention.roomId
                            ? axios
                                .get(`http://localhost:8086/api/rooms/${intervention.roomId}`)
                                .then((res) => {
                                    console.log(`Room API response for room ${intervention.roomId}:`, res.data);
                                    return res.data;
                                })
                                .catch((err) => {
                                    console.error(`Room API error for room ${intervention.roomId}:`, err);
                                    return {
                                        id: intervention.roomId,
                                        name: `Salle ${intervention.roomId}`,
                                        equipment: 'Non disponible',
                                    };
                                })
                            : Promise.resolve(null),
                        axios
                            .get(`http://localhost:8089/api/interventions/${intervention.id}/staff`)
                            .then((res) => {
                                const staff = Array.isArray(res.data) ? res.data : [];
                                console.log(`Staff API response for intervention ${intervention.id}:`, staff);
                                return staff;
                            })
                            .catch((err) => {
                                console.error(`Staff API error for intervention ${intervention.id}:`, err);
                                return [];
                            }),
                        axios
                            .get(`http://localhost:8089/api/interventions/${intervention.id}/materiels`)
                            .then((res) => {
                                const materiels = Array.isArray(res.data) ? res.data : [];
                                console.log(`Materiel API response for intervention ${intervention.id}:`, materiels);
                                return materiels;
                            })
                            .catch((err) => {
                                console.error(`Materiel API error for intervention ${intervention.id}:`, err);
                                return [];
                            }),
                    ]);

                    const interventionWithDetails = {
                        ...intervention,
                        date: intervention.date || new Date().toISOString(),
                        room: roomData
                            ? {
                                ...roomData,
                                equipment: roomData.equipmentList || roomData.equipment || 'Non disponible',
                            }
                            : null,
                        equipeMedicale: staffData.map((staff) => ({
                            ...staff,
                            name:
                                staff.nom && staff.prenom
                                    ? `${staff.nom} ${staff.prenom}`
                                    : staff.email || 'Non spécifié',
                        })),
                        materiels: materielData.map((materiel) => ({
                            ...materiel,
                            name: materiel.nom || materiel.description || 'Matériel non spécifié',
                        })),
                    };

                    return updateInterventionStatus(interventionWithDetails);
                })
            );

            const validInterventions = interventionsWithDetails.filter(Boolean);
            console.log('Processed interventions:', validInterventions);
            setInterventions(validInterventions);
        } catch (err) {
            console.error('Erreur fetchInterventions:', err);
            console.error('Erreur détails:', err.response?.data || err.message);
            setError(err.message);
            toast.error(`Échec du chargement des interventions: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setStatsLoading(true);

            const statusResponse = await axios.get('http://localhost:8089/api/interventions/stats/by-status');
            setStatusData(statusResponse.data || {});

            const typeResponse = await axios.get('http://localhost:8089/api/interventions/stats/by-type');
            setTypeData(typeResponse.data || {});

            const endDate = format(new Date(), 'yyyy-MM-dd');
            const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');
            const dailyResponse = await axios.get('http://localhost:8089/api/interventions/stats/daily', {
                params: { startDate, endDate },
            });
            setDailyData(dailyResponse.data || {});
        } catch (err) {
            console.error('Erreur lors de la récupération des stats:', err);
            console.error('Erreur détails:', err.response?.data || err.message);
            setStatsError(err.message);
            toast.error(`Échec du chargement des statistiques: ${err.message}`);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchInterventionDetails = async (id) => {
        try {
            const response = await axios.get(`http://localhost:8089/api/interventions/${id}`);
            const interventionData = response.data;
            console.log('Intervention details API response:', interventionData);

            const roomResponse = interventionData.roomId
                ? await axios.get(`http://localhost:8086/api/rooms/${interventionData.roomId}`).catch((err) => {
                    console.error(`Room API error for room ${interventionData.roomId}:`, err);
                    return null;
                })
                : null;
            const room = roomResponse ? roomResponse.data : null;
            console.log(`Room details for intervention ${id}:`, room);

            const staffResponse = await axios.get(`http://localhost:8089/api/interventions/${id}/staff`).catch((err) => {
                console.error(`Staff API error for intervention ${id}:`, err);
                return { data: [] };
            });
            const staff = Array.isArray(staffResponse.data) ? staffResponse.data : [];
            console.log(`Staff details for intervention ${id}:`, staff);

            const materielResponse = await axios.get(`http://localhost:8089/api/interventions/${id}/materiels`).catch((err) => {
                console.error(`Materiel API error for intervention ${id}:`, err);
                return { data: [] };
            });
            const materiels = Array.isArray(materielResponse.data) ? materielResponse.data : [];
            console.log(`Materiel details for intervention ${id}:`, materiels);

            const details = {
                ...interventionData,
                room: room
                    ? {
                        ...room,
                        equipment: room.equipmentList || room.equipment || 'Non disponible',
                    }
                    : null,
                equipeMedicale: staff.length > 0
                    ? staff.map((s) => ({
                        ...s,
                        name:
                            s.nom && s.prenom
                                ? `${s.nom} ${s.prenom}`
                                : s.email || 'Non spécifié',
                    }))
                    : [],
                materiels: materiels.map((m) => ({
                    ...m,
                    name: m.nom || m.description || 'Matériel non spécifié',
                })),
            };

            console.log('Processed intervention details:', details);
            setInterventionDetails(details);
        } catch (err) {
            console.error('Erreur fetchInterventionDetails:', err);
            console.error('Erreur détails:', err.response?.data || err.message);
            toast.error(`Échec du chargement des détails: ${err.message}`);
            setInterventionDetails(null);
        }
    };

    const prevMonth = () =>
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () =>
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getInterventionsForDay = (day) => {
        return interventions.filter((intervention) => {
            try {
                return isSameDay(new Date(intervention.date), day);
            } catch {
                return false;
            }
        });
    };

    const filteredInterventions = selectedDate ? getInterventionsForDay(selectedDate) : [];

    const getTimeStatus = (intervention) => {
        const now = new Date();
        const startTime = intervention.startTime ? new Date(intervention.startTime) : null;
        const endTime = intervention.endTime ? new Date(intervention.endTime) : null;

        if (!startTime || !endTime) return 'Non disponible';

        if (intervention.statut === 'TERMINEE') {
            return (
                <span>
                    <FaHourglassEnd /> Terminée{' '}
                    {formatDistanceToNow(endTime, { addSuffix: true, locale: fr })}
                </span>
            );
        } else if (intervention.statut === 'EN_COURS') {
            const mins = differenceInMinutes(endTime, now);
            const hours = differenceInHours(endTime, now);
            return (
                <span>
                    <FaClock />{' '}
                    {hours > 0 ? `Finit dans ${hours}h` : mins > 0 ? `Finit dans ${mins}m` : `Doit finir`}
                </span>
            );
        } else {
            const mins = differenceInMinutes(startTime, now);
            const hours = differenceInHours(startTime, now);
            return (
                <span>
                    <FaHourglassStart />{' '}
                    {hours > 0 ? `Dans ${hours}h` : mins > 0 ? `Dans ${mins}m` : `Commence`}
                </span>
            );
        }
    };

    const handleCancel = async (id) => {
        try {
            await axios.patch(`http://localhost:8089/api/interventions/${id}/annuler`);
            setInterventions((prev) =>
                prev.map((i) => (i.id === id ? { ...i, statut: 'ANNULEE' } : i))
            );
            if (selectedIntervention?.id === id) {
                setInterventionDetails((prev) =>
                    prev ? { ...prev, statut: 'ANNULEE' } : prev
                );
            }
            toast.success('Intervention annulée');
        } catch (err) {
            console.error('Erreur lors de l\'annulation:', err);
            console.error('Erreur détails:', err.response?.data || err.message);
            toast.error('Échec de l\'annulation');
        }
    };

    const handleShowDetails = (intervention) => {
        setSelectedIntervention(intervention);
        fetchInterventionDetails(intervention.id);
    };

    const handleCloseDetails = () => {
        setSelectedIntervention(null);
        setInterventionDetails(null);
    };

    if (error) return <div className="error">Erreur : {error}</div>;

    // Prepare chart data
    const statusLabels = Object.keys(statusData).map((status) => status.toLowerCase());
    const statusValues = Object.values(statusData).map((val) => Number(val) || 0);

    const typeLabels = Object.keys(typeData).map((type) =>
        type.replace(/_/g, ' ').toLowerCase()
    );
    const typeValues = Object.values(typeData).map((val) => Number(val) || 0);

    const dailyLabels = Object.keys(dailyData).sort();
    const dailyValues = dailyLabels.map((date) => Number(dailyData[date]) || 0);

    // Chart configurations
    const statusChartData = {
        labels: statusLabels,
        datasets: [
            {
                label: "Nombre d'interventions",
                data: statusValues,
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'],
                borderColor: ['#2A8BBF', '#D94F70', '#D4A437', '#3B9C9C'],
                borderWidth: 1,
            },
        ],
    };

    const typeChartData = {
        labels: typeLabels,
        datasets: [
            {
                label: "Nombre d'interventions",
                data: typeValues,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderColor: ['#D94F70', '#2A8BBF', '#D4A437', '#3B9C9C', '#7A52CC'],
                borderWidth: 1,
            },
        ],
    };

    const dailyChartData = {
        labels: dailyLabels,
        datasets: [
            {
                label: "Nombre d'interventions",
                data: dailyValues,
                fill: false,
                borderColor: '#36A2EB',
                tension: 0.1,
            },
        ],
    };

    const chartOptions = {
        status: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Nombre d'interventions" },
                },
                x: {
                    title: { display: true, text: 'Statut' },
                },
            },
            plugins: {
                legend: { display: false },
            },
        },
        type: {
            plugins: {
                legend: { position: 'right' },
            },
        },
        daily: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Nombre d'interventions" },
                },
                x: {
                    title: { display: true, text: 'Date' },
                },
            },
            plugins: {
                legend: { display: false },
            },
        },
    };

    return (
        <div className="intervention-container">
            <div className="header-container">
                <h2 className="header">Calendrier des Interventions</h2>
            </div>

            <div className="dashboard-grid">
                <div className="stats-container">
                    <h3>Statistiques des Interventions</h3>
                    {statsLoading ? (
                        <div className="loading-spinner">Chargement des statistiques...</div>
                    ) : statsError ? (
                        <div className="error">Erreur : {statsError}</div>
                    ) : (
                        <div className="stats-grid">
                            <div className="chart-container">
                                <h4>Interventions par Statut</h4>
                                <Bar data={statusChartData} options={chartOptions.status} />
                            </div>
                            <div className="chart-container">
                                <h4>Interventions par Type</h4>
                                <Doughnut data={typeChartData} options={chartOptions.type} />
                            </div>
                            <div className="chart-container">
                                <h4>Interventions Quotidiennes (30 derniers jours)</h4>
                                <Line data={dailyChartData} options={chartOptions.daily} />
                            </div>
                        </div>
                    )}
                </div>

                {todayInterventions.length > 0 && (
                    <div className="today-interventions">
                        <h3>
                            <FaCalendarAlt /> Aujourd'hui ({format(new Date(), 'dd/MM', { locale: fr })})
                        </h3>
                        <div className="today-cards">
                            {todayInterventions.map((intervention) => {
                                const timeStatus = getTimeStatus(intervention);
                                const isUpcoming = intervention.statut === 'PLANIFIEE';
                                const isInProgress = intervention.statut === 'EN_COURS';

                                return (
                                    <div
                                        key={intervention.id}
                                        className={`today-card ${isUpcoming ? 'upcoming' : ''} ${
                                            isInProgress ? 'in-progress' : ''
                                        }`}
                                    >
                                        <div className="today-card-header">
                                            <span className="intervention-time">
                                                {intervention.startTime
                                                    ? format(new Date(intervention.startTime), 'HH:mm')
                                                    : '--:--'}
                                                {intervention.endTime &&
                                                    ` - ${format(new Date(intervention.endTime), 'HH:mm')}`}
                                            </span>
                                            <span
                                                className={`status-badge status-${
                                                    intervention.statut?.toLowerCase() || 'inconnu'
                                                }`}
                                            >
                                                {intervention.statut?.toLowerCase() || 'inconnu'}
                                            </span>
                                        </div>
                                        <div className="today-card-body">
                                            <h4>
                                                {intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}
                                            </h4>
                                            <p>{intervention.room?.name || 'Non attribuée'}</p>
                                            {timeStatus && <div className="time-status">{timeStatus}</div>}
                                        </div>
                                        <button
                                            onClick={() => handleShowDetails(intervention)}
                                            className="btn-action details-btn"
                                        >
                                            Détails
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="calendar-controls">
                <button onClick={prevMonth} className="nav-button">
                    <FaChevronLeft />
                </button>
                <h3 className="month-title">{format(currentDate, 'MMMM yyyy', { locale: fr })}</h3>
                <button onClick={nextMonth} className="nav-button">
                    <FaChevronRight />
                </button>
            </div>

            <div className="calendar-grid">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="calendar-day-header">
                        {day}
                    </div>
                ))}
                {monthDays.map((day) => (
                    <CalendarDay
                        key={day.toString()}
                        day={day}
                        currentDate={currentDate}
                        selectedDate={selectedDate}
                        isTodayDate={isToday(day)}
                        dayInterventions={getInterventionsForDay(day)}
                        setSelectedDate={setSelectedDate}
                    />
                ))}
            </div>

            <div className="interventions-list">
                <h3>
                    {selectedDate
                        ? `Interventions du ${format(selectedDate, 'dd/MM/yyyy', { locale: fr })}`
                        : 'Sélectionnez une date'}
                </h3>
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Chargement...</p>
                    </div>
                ) : filteredInterventions.length > 0 ? (
                    <div className="intervention-grid">
                        {filteredInterventions.map((intervention) => {
                            const timeStatus = getTimeStatus(intervention);
                            const isUpcoming = intervention.statut === 'PLANIFIEE';
                            const isInProgress = intervention.statut === 'EN_COURS';

                            return (
                                <div key={intervention.id} className="intervention-card">
                                    <div className="intervention-card-header">
                                        <span>
                                            {intervention.startTime
                                                ? format(new Date(intervention.startTime), 'HH:mm')
                                                : '--:--'}
                                        </span>
                                        <span
                                            className={`status-badge status-${
                                                intervention.statut?.toLowerCase() || 'inconnu'
                                            }`}
                                        >
                                            {intervention.statut?.toLowerCase() || 'inconnu'}
                                        </span>
                                    </div>
                                    <div className="intervention-card-body">
                                        <h4>
                                            {intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}
                                        </h4>
                                        <p>{intervention.room?.name || 'Non attribuée'}</p>
                                        {timeStatus && <div className="time-status">{timeStatus}</div>}
                                    </div>
                                    <div className="intervention-card-actions">
                                        {['PLANIFIEE', 'EN_COURS'].includes(intervention.statut) && (
                                            <button
                                                onClick={() => handleCancel(intervention.id)}
                                                className="btn-action cancel-btn"
                                            >
                                                ❌
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleShowDetails(intervention)}
                                            className="btn-action details-btn"
                                        >
                                            🔍
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-interventions">Aucune intervention</div>
                )}
            </div>

            {selectedIntervention && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button onClick={handleCloseDetails} className="modal-close-button">
                            <FaTimes />
                        </button>
                        <h3>Détails de l'Intervention</h3>
                        {interventionDetails ? (
                            <div className="modal-body">
                                <div className="details-header">
                                    <h4>
                                        {interventionDetails.type?.replace(/_/g, ' ') || 'Non spécifié'}
                                    </h4>
                                    <span
                                        className={`status-badge status-${
                                            interventionDetails.statut?.toLowerCase() || 'inconnu'
                                        }`}
                                    >
                                        {interventionDetails.statut?.toLowerCase() || 'inconnu'}
                                    </span>
                                </div>
                                <div className="details-body">
                                    <p>
                                        <strong>Date :</strong>{' '}
                                        {interventionDetails.date
                                            ? format(new Date(interventionDetails.date), 'dd/MM/yyyy', {
                                                locale: fr,
                                            })
                                            : 'Non spécifiée'}
                                    </p>
                                    <p>
                                        <strong>Heure :</strong>{' '}
                                        {interventionDetails.startTime
                                            ? format(new Date(interventionDetails.startTime), 'HH:mm')
                                            : '--:--'}{' '}
                                        -{' '}
                                        {interventionDetails.endTime
                                            ? format(new Date(interventionDetails.endTime), 'HH:mm')
                                            : '--:--'}
                                    </p>
                                    <p>
                                        <strong>Statut temporel :</strong>{' '}
                                        {getTimeStatus(interventionDetails)}
                                    </p>
                                    <p>
                                        <strong>Salle :</strong>{' '}
                                        {interventionDetails.room?.name || 'Non attribuée'}
                                    </p>
                                    <p>
                                        <strong>Équipe médicale :</strong>{' '}
                                        {interventionDetails.equipeMedicale?.length > 0
                                            ? interventionDetails.equipeMedicale
                                            .map((s) => s.name)
                                            .filter((name) => name !== 'Non spécifié')
                                            .join(', ') || 'Non spécifié'
                                            : 'Non spécifié'}
                                    </p>
                                    <p>
                                        <strong>Matériels :</strong>{' '}
                                        {interventionDetails.materiels?.length > 0
                                            ? interventionDetails.materiels
                                                .map((m) => m.name)
                                                .join(', ')
                                            : 'Aucun'}
                                    </p>
                                </div>
                                <div className="details-actions">
                                    {['PLANIFIEE', 'EN_COURS'].includes(interventionDetails.statut) && (
                                        <button
                                            onClick={() => handleCancel(interventionDetails.id)}
                                            className="btn-action cancel-btn"
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="loading-spinner">Chargement des détails...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterventionCalendar;
