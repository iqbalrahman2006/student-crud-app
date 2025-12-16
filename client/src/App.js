import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsGrid from "./components/StatsGrid";
import Controls from "./components/Controls";
import StudentList from "./components/StudentList";
import StudentForm from "./components/StudentForm";
import Toast from "./components/Toast";
import Reports from "./components/Reports";
import LibraryLogin from "./components/LibraryLogin";
import Library from "./components/Library";
import Settings from "./components/Settings";
import ConsolidatedDashboard from "./components/ConsolidatedDashboard";
import { studentService } from "./services/studentService";
import "./App.css";

function App() {
    // Data State
    const [students, setStudents] = useState([]);
    const [isLibrarian, setIsLibrarian] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [viewMode, setViewMode] = useState('list'); // 'list', 'grid', 'consolidated'
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    // Filter & Sort State
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCourse, setFilterCourse] = useState('');

    // Settings State
    const [theme, setTheme] = useState('light');
    const [density, setDensity] = useState('comfortable');
    const [refreshInterval, setRefreshInterval] = useState(0);

    // URL Synchronization
    const history = useHistory();
    const location = useLocation();

    // Sync URL -> State
    useEffect(() => {
        const path = location.pathname.substring(1) || 'dashboard'; // remove leading /
        // handle sub-routes like /library/inventory
        const tab = path.split('/')[0] || 'dashboard';

        if (['dashboard', 'students', 'library', 'reports', 'settings'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    // Update History when Tab Selection changes (wrapped handler)
    const handleTabChange = (tabId) => {
        history.push(`/${tabId}`);
    };

    const fetchStudents = useCallback(async () => {
        try {
            const response = await studentService.getAll();
            // Handle various response structures safely
            const studentArray = Array.isArray(response.data) ? response.data :
                (response.data && Array.isArray(response.data.data)) ? response.data.data : [];
            setStudents(studentArray);
        } catch (error) {
            console.error("Failed to fetch students", error);
            setToast({ type: 'error', message: 'Failed to load students' });
        }
    }, []);

    useEffect(() => {
        fetchStudents();
        const interval = refreshInterval > 0 ? setInterval(fetchStudents, refreshInterval) : null;
        return () => interval && clearInterval(interval);
    }, [fetchStudents, refreshInterval]);

    // Derived Data (Filtering & Sorting)
    const processedStudents = useMemo(() => {
        let result = [...students];

        // 1. Filter by Search (Name/Email)
        if (search) {
            const lowerQuery = search.toLowerCase();
            result = result.filter(s =>
                (s.name && s.name.toLowerCase().includes(lowerQuery)) ||
                (s.email && s.email.toLowerCase().includes(lowerQuery))
            );
        }

        // 2. Filter by Status
        if (filterStatus) {
            result = result.filter(s => s.status === filterStatus);
        }

        // 3. Filter by Course
        if (filterCourse) {
            result = result.filter(s => s.course === filterCourse);
        }

        // 4. Sort
        if (sortBy) {
            result.sort((a, b) => {
                switch (sortBy) {
                    case 'name': return (a.name || '').localeCompare(b.name || '');
                    case 'gpa-desc': return (b.gpa || 0) - (a.gpa || 0);
                    case 'gpa-asc': return (a.gpa || 0) - (b.gpa || 0);
                    case 'status': return (a.status || '').localeCompare(b.status || '');
                    case 'course': return (a.course || '').localeCompare(b.course || '');
                    case 'date-desc': return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    case 'date-asc': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                    default: return 0;
                }
            });
        }

        return result;
    }, [students, search, sortBy, filterStatus, filterCourse]);

    // Handlers
    const handleAddStudent = async (studentData) => {
        setSubmitting(true);
        try {
            await studentService.create(studentData);
            setToast({ type: 'success', message: 'Student added successfully' });
            setModalOpen(false);
            fetchStudents();
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to add student' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStudent = async (studentData) => {
        if (!editingStudent) return;
        setSubmitting(true);
        try {
            await studentService.update(editingStudent._id, studentData);
            setToast({ type: 'success', message: 'Student updated successfully' });
            setModalOpen(false);
            setEditingStudent(null);
            fetchStudents();
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to update student' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await studentService.delete(id);
                setToast({ type: 'success', message: 'Student deleted successfully' });
                fetchStudents();
            } catch (error) {
                setToast({ type: 'error', message: 'Failed to delete student' });
            }
        }
    };

    const handleEditClick = (student) => {
        setEditingStudent(student);
        setModalOpen(true);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
            case 'students': // Treating dashboard and students similarly for basic view unless consolidated
                return (
                    <>
                        <StatsGrid students={students} />
                        <Controls
                            search={search} setSearch={setSearch}
                            sortBy={sortBy} setSortBy={setSortBy}
                            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                            filterCourse={filterCourse} setFilterCourse={setFilterCourse}
                            students={students}
                            onAddClick={() => { setEditingStudent(null); setModalOpen(true); }}
                        />
                        <StudentList
                            students={processedStudents}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteStudent}
                            viewMode={viewMode}
                            density={density}
                        />
                    </>
                );
            case 'reports':
                return <Reports students={students} />;
            case 'library':
                return isLibrarian ? (
                    <Library students={students} viewMode={viewMode} />
                ) : (
                    <LibraryLogin onLogin={() => setIsLibrarian(true)} />
                );
            case 'settings':
                return (
                    <Settings
                        theme={theme} setTheme={setTheme}
                        density={density} setDensity={setDensity}
                        refreshInterval={refreshInterval} setRefreshInterval={setRefreshInterval}
                    />
                );
            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className={`app-container sidebar-layout ${theme}`}>
            <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
            <main className="main-content">
                <TopBar activeTab={activeTab} viewMode={viewMode} setViewMode={setViewMode} />
                <div className="workspace">
                    {activeTab === 'dashboard' && viewMode === 'consolidated' ? (
                        <ConsolidatedDashboard students={students} />
                    ) : (
                        renderContent()
                    )}
                </div>
            </main>

            <StudentForm
                isOpen={modalOpen}
                onRequestClose={() => { setModalOpen(false); setEditingStudent(null); }}
                onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
                student={editingStudent}
                submitting={submitting}
            />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

export default App;
