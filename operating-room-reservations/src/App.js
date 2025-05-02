import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import SignUp from './auth/SignUp';

// Admin Components
import AdminDashboard from "./auth/AdminDashboard";
import InterventionList from "./admin/Gestion des interventions/InterventionList";
import InterventionForm from "./admin/Gestion des interventions/InterventionForm";
import InterventionMaterials from "./admin/Gestion des interventions/InterventionMaterials";
import MedicalStaffList from "./admin/Gestion des interventions/MedicalStaffList";
import MedicalStaffForm from "./admin/Gestion des interventions/MedicalStaffForm";
import ReservationList from "./admin/Gestion des salles/ReservationList";
import ReservationForm from "./admin/Gestion des salles/ReservationForm";
import RoomsByCategory from "./admin/Gestion des salles/RoomsByCategory";
import CreateRoomForm from "./admin/Gestion des salles/CreateRoomForm";
import EditRoomModal from "./admin/Gestion des salles/EditRoomModal";
import MaterielList from "./admin/MaterielList";
import CreateMaterielForm from "./admin/CreateMaterielForm";
import InterventionCalendar from "./admin/Gestion des interventions/InterventionCalendar";

// User Components
import UserHome from './user/UserHome';
import UserCalendarView from './user/UserCalendarView';
import UserInterventionDetails from './user/UserInterventionDetails';
import DoctorInterventionRequest from "./user/DoctorInterventionRequest";

function AppRoutes() {
    const { currentUser, userData, loading } = useAuth();

    if (loading) {
        return <div className="loading-spinner">Loading...</div>;
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Admin Routes */}
            {currentUser && userData?.role === 'admin' && (
                <>
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/interventionList" element={<InterventionList />} />
                    <Route path="/interventions/new" element={<InterventionForm />} />
                    <Route path="/interventions/edit/:id" element={<InterventionForm editMode={true} />} />
                    <Route path="/interventions" element={<InterventionMaterials />} />
                    <Route path="/reservations/new" element={<ReservationForm />} />
                    <Route path="/reservations/edit/:id" element={<ReservationForm editMode={true} />} />
                    <Route path="/reservation" element={<ReservationList />} />
                    <Route path="/salle" element={<RoomsByCategory />} />
                    <Route path="/edit-room/:id" element={<EditRoomModal />} />
                    <Route path="/create-room" element={<CreateRoomForm />} />
                    <Route path="/rooms/by-category" element={<RoomsByCategory />} />
                    <Route path="/staff" element={<MedicalStaffList />} />
                    <Route path="/medical-staff/edit/:id" element={<MedicalStaffForm editMode={true} />} />
                    <Route path="/materiels" element={<MaterielList />} />
                    <Route path="/materiels/edit/:id" element={<CreateMaterielForm editMode={true} />} />
                    <Route path="/materiels/new" element={<CreateMaterielForm />} />
                    <Route path="/InterventionCalendar" element={<InterventionCalendar />} />
                </>
            )}

            {/* Doctor Routes */}
            {currentUser && userData?.role === 'MEDECIN' && (
                <>
                    <Route path="/home" element={<UserHome />} />
                    <Route path="/calendar" element={<UserCalendarView />} />
                    <Route path="/intervention/:id" element={<UserInterventionDetails />} />
                    <Route path="/request-intervention" element={<DoctorInterventionRequest />} /> />
                    <Route path="/mes-interventions" element={<InterventionList />} />
                </>
            )}

            {/* Nurse Routes */}
            {currentUser && userData?.role === 'INFIRMIER' && (
                <>
                    <Route path="/home" element={<UserHome />} />
                    <Route path="/calendar" element={<UserCalendarView />} />
                    <Route path="/intervention/:id" element={<UserInterventionDetails />} />
                </>
            )}

            {/* Anesthetist Routes */}
            {currentUser && userData?.role === 'ANESTHESISTE' && (
                <>
                    <Route path="/home" element={<UserHome />} />
                    <Route path="/calendar" element={<UserCalendarView />} />
                    <Route path="/intervention/:id" element={<UserInterventionDetails />} />
                </>
            )}

            {/* Default Redirect */}
            <Route path="*" element={
                <Navigate to={
                    currentUser
                        ? (userData?.role === 'admin'
                            ? "/dashboard"
                            : "/home")
                        : "/login"
                } replace />
            } />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;