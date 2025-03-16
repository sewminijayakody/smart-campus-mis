// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import StudentDashboard from './components/StudentDashboard';
import NotificationsPage from './pages/NotificationsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import EventsPage from './pages/EventsPage';
import CoursePage from './pages/CoursePage';
import AdminFileUploadPage from './pages/AdminFileUploadPage';
import ResourcesPage from './pages/ResourcesPage';
import HelpPage from './pages/HelpPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminUploadsPage from './pages/AdminUploadsPage';
import AdminInquiryPage from './pages/AdminInquiryPage';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import RegisterUsers from './components/RegisterUsers';
import Chat from './pages/Chat';
import ScheduleEventsPage from './pages/ScheduleEventsPage';
import ManageStudentsPage from './pages/ManageStudentsPage';
import ManageLecturersPage from './pages/ManageLecturersPage';
import UpdateStudentPage from './pages/UpdateStudentPage';
import UpdateLecturerPage from './pages/UpdateLecturerPage';
import RequestsPage from './pages/RequestsPage';
import NewsfeedPage from './pages/NewsfeedPage';
import ReportGenerationPage from './pages/ReportGenerationPage';
import LecturerProfilePage from './pages/LecturerProfilePage';
import StudentSchedulePage from './pages/StudentSchedulePage';
import ScheduleClassesPage from './pages/ScheduleClassesPage';
import LecturerCourseworkPage from './pages/LecturerCourseworkPage';
import AdminProfilePage from './pages/AdminProfilePage'; // New import for AdminProfilePage

const App = () => (
  <Router>
    <UserProvider>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Student Routes */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer"]}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer"]}>
              <AnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer"]}>
              <EventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/course"
          element={
            <ProtectedRoute allowedRole="student">
              <CoursePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer"]}>
              <ResourcesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer"]}>
              <HelpPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-profile"
          element={
            <ProtectedRoute allowedRole="student">
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-uploads"
          element={
            <ProtectedRoute allowedRoles={["student", "lecturer"]}>
              <AdminUploadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={["student", "admin", "lecturer"]}>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentSchedulePage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-profile"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-users"
          element={
            <ProtectedRoute allowedRole="admin">
              <RegisterUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-file-upload"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminFileUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-inquiries"
          element={
            <ProtectedRoute allowedRole="admin">
              <ErrorBoundary fallback={<p>Something went wrong while loading inquiries.</p>}>
                <AdminInquiryPage />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule-events"
          element={
            <ProtectedRoute allowedRole="admin">
              <ScheduleEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-students"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageStudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-lecturers"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageLecturersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-student/:id"
          element={
            <ProtectedRoute allowedRole="admin">
              <UpdateStudentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-lecturer/:id"
          element={
            <ProtectedRoute allowedRole="admin">
              <UpdateLecturerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRole="admin">
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newsfeed"
          element={
            <ProtectedRoute allowedRole="admin">
              <NewsfeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-generation"
          element={
            <ProtectedRoute allowedRole="admin">
              <ReportGenerationPage />
            </ProtectedRoute>
          }
        />

        {/* Lecturer Routes */}
        <Route
          path="/lecturer-dashboard"
          element={
            <ProtectedRoute allowedRole="lecturer">
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer-profile"
          element={
            <ProtectedRoute allowedRole="lecturer">
              <LecturerProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule-classes"
          element={
            <ProtectedRoute allowedRole="lecturer">
              <ScheduleClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer-coursework"
          element={
            <ProtectedRoute allowedRole="lecturer">
              <LecturerCourseworkPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  </Router>
);

export default App;