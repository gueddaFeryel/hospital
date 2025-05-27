import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import SignUp from './auth/SignUp';
import Layout from './Layout';
import LoadingSpinner from './LoadingSpinner';

// Partie ADMIN
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
import EditRoomForm from "./admin/Gestion des salles/EditRoomModal";
import MaterielList from "./admin/MaterielList";
import CreateMaterielForm from "./admin/CreateMaterielForm";

// Partie USER
import UserHome from './user/UserHome';
import UserCalendarView from './user/UserCalendarView';
import UserInterventionDetails from './user/UserInterventionDetails';
import InterventionCalendar from "./admin/Gestion des interventions/InterventionCalendar";
import DoctorInterventionRequest from "./user/DoctorInterventionRequest";
import InterventionRequests from "./user/InterventionRequests";
import EditRoomModal from "./admin/Gestion des salles/EditRoomModal";
import ReportsListView from "./user/ReportsListView";
import RapportList from "./admin/RapportList";
import PatientForm from "./admin/patients/PatientForm";
import PatientList from "./admin/patients/PatientList";



// Dans AppRoutes
function AppRoutes() {
    const { currentUser, userData, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Routes protégées */}
            <Route element={<ProtectedLayout />}>
                {/* Redirection par défaut selon le rôle */}
                <Route
                    path="/"
                    element={
                        <Navigate
                            to={
                                userData?.role === 'admin' || userData?.role === 'GESTIONNAIRE_ADMIN'
                                    ? "/InterventionCalendar"
                                    : "/home"
                            }
                            replace
                        />
                    }
                />

                {/* Routes ADMIN et GESTIONNAIRE_ADMIN */}
                {(userData?.role === 'admin' || userData?.role === 'GESTIONNAIRE_ADMIN') && (
                    <>
                        <Route path="/dashboard" element={<AdminDashboard />} />
                        <Route path="/interventionList" element={<InterventionList />} />
                        <Route path="/interventions/new" element={<InterventionForm />} />
                        <Route path="/interventions/edit/:id" element={<InterventionForm editMode={true} />} />
                        <Route path="/interventions/materials" element={<InterventionMaterials />} />
                        <Route path="/reservations" element={<ReservationList />} />
                        <Route path="/reservations/new" element={<ReservationForm />} />
                        <Route path="/reservations/edit/:id" element={<ReservationForm editMode={true} />} />
                        <Route path="/salles" element={<RoomsByCategory />} />
                        <Route path="/create-room" element={<CreateRoomForm />} />
                        <Route path="/salles/edit/:id" element={<EditRoomModal editMode={true} />} />
                        <Route path="/staff" element={<MedicalStaffList />} />
                        <Route path="/staff/edit/:id" element={<MedicalStaffForm editMode={true} />} />
                        <Route path="/materiels" element={<MaterielList />} />
                        <Route path="/materiels/new" element={<CreateMaterielForm />} />
                        <Route path="/materiels/edit/:id" element={<CreateMaterielForm editMode={true} />} />
                        <Route path="/InterventionCalendar" element={<InterventionCalendar />} />
                        <Route path="/intervention-requests" element={<InterventionRequests />} />
                        <Route path="/reports" element={<RapportList />} />
                        <Route path="/patients" element={<PatientForm/>}/>
                        <Route path="/patients/:id/edit" element={<PatientForm editMode={true}/>}/>
                        <Route path="/patientslist" element={<PatientList/>}/>
                        {/* Route /membre réservée uniquement à l'admin */}
                        {userData?.role === 'admin' && (
                            <Route path="/membre" element={<MedicalStaffForm />} />
                        )}
                    </>
                )}

                {/* Routes USER (commun à tous les rôles médicaux) */}
                {(userData?.role === 'MEDECIN' || userData?.role === 'INFIRMIER' || userData?.role === 'ANESTHESISTE') && (
                    <>
                        <Route path="/home" element={<UserHome />} />
                        <Route path="/calendar" element={<UserCalendarView />} />
                        <Route path="/interventions/:id" element={<UserInterventionDetails />} />
                        <Route path="/request-intervention" element={<DoctorInterventionRequest />} />
                        <Route path="/reports" element={<ReportsListView />} />
                    </>
                )}
            </Route>

            {/* Redirection pour les routes inconnues */}
            <Route
                path="*"
                element={
                    <Navigate
                        to={
                            currentUser
                                ? userData?.role === 'admin' || userData?.role === 'GESTIONNAIRE_ADMIN'
                                    ? "/dashboard"
                                    : "/home"
                                : "/login"
                        }
                        replace
                    />
                }
            />
        </Routes>
    );
}

function ProtectedLayout() {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
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
