import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStudentById } from '../services/api';

const StudentDetail = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const data = await getStudentById(id);
                setStudent(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Student Detail</h1>
            {student ? (
                <div>
                    <h2>{student.name}</h2>
                    <p>Email: {student.email}</p>
                    <p>Age: {student.age}</p>
                    <p>Grade: {student.grade}</p>
                </div>
            ) : (
                <p>No student found.</p>
            )}
        </div>
    );
};

export default StudentDetail;