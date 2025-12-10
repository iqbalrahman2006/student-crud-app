import React, { useState, useEffect, useMemo, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import StatsGrid from "./components/StatsGrid";
import Controls from "./components/Controls";
import StudentList from "./components/StudentList";
import StudentForm from "./components/StudentForm";
import Toast from "./components/Toast";
import Reports from "./components/Reports";
import Library from "./components/Library";
import Settings from "./components/Settings";
import { getStudents, addStudent, updateStudent, deleteStudent } from "./services/api";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

function App() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [filterConfig, setFilterConfig] = useState({ status: '', course: '' });

    // Settings State
    const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'light');
    const [density, setDensity] = useState(localStorage.getItem('app_density') || 'comfortable');
    const [refreshInterval, setRefreshInterval] = useState(parseInt(localStorage.getItem('app_refresh') || '0'));

    // Apply Theme Effect
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const loadStudents = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await getStudents();
            // Handle different API response structures robustly
            const data = response.data || response;
            const studentList = Array.isArray(data) ? data : (data.data || []);
            setStudents(studentList);
        } catch (error) {
            showToast("Failed to fetch students", "error");
        } finally {
            if (!silent) setLoading(false);
        }
    }, []); // Stable dependency

    useEffect(() => {
        loadStudents();

        // Auto-Refresh Logic
        let intervalId;
        if (refreshInterval > 0) {
            intervalId = setInterval(() => {
                loadStudents(true); // Silent refresh
            }, refreshInterval);
        }
        return () => clearInterval(intervalId);
    }, [refreshInterval, loadStudents]);


    const handleAddStudent = async (studentData) => {
        setSubmitting(true);
        try {
            await addStudent(studentData);
            await loadStudents();
            setModalOpen(false);
            showToast("Student created successfully", "success");
        } catch (error) {
            showToast("Failed to create student", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStudent = async (studentData) => {
        setSubmitting(true);
        try {
            if (!editingStudent) return;
            await updateStudent(editingStudent._id, studentData);
            await loadStudents();
            setModalOpen(false);
            setEditingStudent(null);
            showToast("Student updated successfully", "success");
        } catch (error) {
            showToast("Failed to update student", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStudent = async (student) => {
        const id = student._id;
        // Check for 'Soft Delete' preference
        const isSoftDelete = localStorage.getItem('app_softDelete') === 'true';

        if (!window.confirm(`Are you sure you want to delete ${student.name}?`)) return;
        try {
            await deleteStudent(id); // API handles logic, but UI expects removal
            await loadStudents();
            showToast(isSoftDelete ? "Student archived (Soft Delete)" : "Student deleted successfully", "success");
        } catch (error) {
            showToast("Failed to delete student", "error");
        }
    };

    const openAddModal = () => {
        setEditingStudent(null);
        setModalOpen(true);
    };

    const openEditModal = (student) => {
        setEditingStudent(student);
        setModalOpen(true);
    };

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- SORTING & FILTERING ENGINE ---
    const processedStudents = useMemo(() => {
        let result = [...students];

        // 1. Filtering
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(s =>
                (s.name || "").toLowerCase().includes(lowerSearch) ||
                (s.email || "").toLowerCase().includes(lowerSearch) ||
                (s.city && s.city.toLowerCase().includes(lowerSearch))
            );
        }
        if (filterConfig.status) {
            result = result.filter(s => s.status === filterConfig.status);
        }
        if (filterConfig.course) {
            result = result.filter(s => s.course === filterConfig.course);
        }

        // 2. Sorting
        result.sort((a, b) => {
            let aValue = a[sortConfig.key] || "";
            let bValue = b[sortConfig.key] || "";

            // Specific handling for dates and numbers
            if (sortConfig.key === 'gpa') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [students, searchTerm, sortConfig, filterConfig]);

    // --- RENDER CONTENT BASED ON TAB ---
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="dashboard-view">
                        <StatsGrid students={students} />

                        <div className="section-header">
                            <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                            <button className="add-btn" onClick={() => setActiveTab('students')}>
                                <span className="btn-content">👥 View All Students</span>
                            </button>
                            <button className="add-btn" onClick={openAddModal} style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                                <span className="btn-content">➕ Add New Student</span>
                            </button>
                        </div>

                        {/* Recent Activity / Preview could go here */}
                        <div className="table-card" style={{ maxHeight: '400px' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: '#f8fafc', fontWeight: 600, color: '#64748b' }}>
                                RECENTLY ENROLLED
                            </div>
                            <div className="table-container">
                                <StudentList
                                    students={students.slice(0, 5)}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteStudent}
                                    density="compact"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'students':
                return (
                    <>
                        <Controls
                            search={searchTerm}
                            setSearch={setSearchTerm}
                            sortBy={sortConfig.key}
                            setSortBy={(key) => setSortConfig(prev => ({ ...prev, key }))}
                            filterStatus={filterConfig.status}
                            setFilterStatus={(status) => setFilterConfig(prev => ({ ...prev, status }))}
                            filterCourse={filterConfig.course}
                            setFilterCourse={(course) => setFilterConfig(prev => ({ ...prev, course }))}
                            students={students}
                            onAddClick={openAddModal}
                        />
                        {loading ? (
                            <div className="loading-state">Loading students...</div>
                        ) : (
                            <div className="table-card">
                                <StudentList
                                    students={processedStudents}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteStudent}
                                    density={density}
                                />
                            </div>
                        )}
                    </>
                );

            case 'reports':
                return <Reports students={students} />;

            case 'library':
                return <Library students={students} />;

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
        <div className="app-container sidebar-layout">
            <ErrorBoundary>
                {/* Sidebar Navigation */}
                <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Main Content Area */}
                <main className="main-content">
                    <TopBar activeTab={activeTab} />

                    {/* CORRECTED CLASS: workspace (was content-scrollable which had no height) */}
                    <div className="workspace">
                        {renderContent()}
                    </div>
                </main>
            </ErrorBoundary>

            {/* Modals & Toasts */}
            <StudentForm
                isOpen={modalOpen}
                onRequestClose={() => setModalOpen(false)}
                onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
                student={editingStudent}
                submitting={submitting}
            />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

export default App;
