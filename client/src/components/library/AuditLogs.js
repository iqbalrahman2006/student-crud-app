import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import DailyActivityLog from './DailyActivityLog';
import { Table, Icon, Label, Segment, Header, Form, Button } from 'semantic-ui-react';
import Toast from '../Toast'; // Check path if needed, assuming in components/Toast

const AuditLogs = () => {
    const history = useHistory();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [toast, setToast] = useState(null); // Add local toast state
    const [filters, setFilters] = useState({
        action: '',
        start: '',
        end: ''
    });

    useEffect(() => {
        let mounted = true;

        const fetchLogs = async () => {
            setLoading(true);
            try {
                const params = { page, limit: 20 };
                if (filters.action) params.action = filters.action;
                if (filters.start) params.start = filters.start;
                if (filters.end) params.end = filters.end;

                const res = await analyticsService.getAuditLogs(params);
                if (mounted) {
                    setLogs(res.data?.data?.items || []);
                    setTotal(res.data?.data?.total || 0);
                }
            } catch (err) {
                console.error("Failed to fetch logs", err);
                if (mounted) setLogs([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchLogs();
        return () => { mounted = false; };
    }, [page, filters]);

    const handleFilterChange = (e, { name, value }) => {
        setFilters({ ...filters, [name]: value });
        setPage(1);
    };

    const handleReset = () => {
        setFilters({ action: '', start: '', end: '' });
        setPage(1);
    };

    const getActionColor = (action) => {
        const colors = {
            BORROW: 'blue', RETURN: 'green', OVERDUE: 'red',
            ADD: 'purple', DELETE: 'red', UPDATE: 'orange', RENEW: 'teal',
            RESERVE: 'violet'
        };
        return colors[action] || 'grey';
    };

    // Navigation Click Handlers
    const handleBookClick = (bookId, bookTitle) => {
        if (bookId && typeof bookId === 'string' && bookId.length > 0) {
            history.push(`/library/inventory/${bookId}`);
        } else {
            setToast({ message: "Record not linked to a valid book", type: "error" });
        }
    };

    const handleStudentClick = (studentId, studentName) => {
        if (studentId && typeof studentId === 'string' && studentId.length > 0) {
            history.push(`/students/${studentId}`);
        } else {
            setToast({ message: "Record not linked to a valid student", type: "error" });
        }
    };

    const options = [
        { key: 'all', text: 'All Actions', value: '' },
        { key: 'borrow', text: 'Borrow', value: 'BORROW' },
        { key: 'return', text: 'Return', value: 'RETURN' },
        { key: 'renew', text: 'Renew', value: 'RENEW' },
        { key: 'overdue', text: 'Overdue', value: 'OVERDUE' },
        { key: 'add', text: 'Add Book', value: 'ADD' },
        { key: 'update', text: 'Update Book', value: 'UPDATE' },
        { key: 'delete', text: 'Delete Book', value: 'DELETE' },
    ];

    return (
        <div className="audit-logs-container fade-in" style={{ padding: '0 10px' }}>
            <DailyActivityLog />

            {/* Local Toast for AuditLogs validation feedback */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <Segment>
                <Header as='h4'>
                    <Icon name='filter' />
                    <Header.Content>Filter Logs</Header.Content>
                </Header>
                <Form>
                    <Form.Group widths='equal'>
                        <Form.Select
                            fluid
                            label='Action Type'
                            options={options}
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                        />
                        <Form.Input
                            fluid
                            label='Start Date'
                            type="date"
                            name="start"
                            value={filters.start}
                            onChange={handleFilterChange}
                        />
                        <Form.Input
                            fluid
                            label='End Date'
                            type="date"
                            name="end"
                            value={filters.end}
                            onChange={handleFilterChange}
                        />
                        <Form.Button label='&nbsp;' fluid icon labelPosition='left' onClick={handleReset}>
                            <Icon name='undo' /> Reset
                        </Form.Button>
                    </Form.Group>
                </Form>
            </Segment>

            <Segment raised loading={loading}>
                <Table celled striped color='teal'>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell width={5}><Icon name='book' /> Book Title</Table.HeaderCell>
                            <Table.HeaderCell width={5}><Icon name='user circle' /> Student</Table.HeaderCell>
                            <Table.HeaderCell width={3} textAlign='right'><Icon name='tag' /> Action</Table.HeaderCell>
                            <Table.HeaderCell width={2} textAlign='right'><Icon name='dollar' /> Fine</Table.HeaderCell>
                            <Table.HeaderCell width={3} textAlign='right'><Icon name='clock' /> Timestamp</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {(Array.isArray(logs) ? logs : []).map(log => (
                            <Table.Row key={log._id || Math.random()}>
                                <Table.Cell
                                    style={{ cursor: log.bookId ? 'pointer' : 'default' }}
                                    onClick={() => handleBookClick(log.bookId, log.bookTitle)}
                                >
                                    <Header as='h5'>
                                        <Header.Content>
                                            {log.bookTitle !== 'N/A'
                                                ? log.bookTitle
                                                : (log.action === 'OVERDUE' ? 'System Batch Run' : 'N/A')}
                                            {log.bookId && <Header.Subheader>Click to View</Header.Subheader>}
                                        </Header.Content>
                                    </Header>
                                </Table.Cell>
                                <Table.Cell
                                    style={{ cursor: log.studentId ? 'pointer' : 'default' }}
                                    onClick={() => handleStudentClick(log.studentId, log.studentName)}
                                >
                                    <Header as='h5' image>
                                        <Icon name={log.studentName === 'N/A' ? 'server' : 'user circle'} color='grey' />
                                        <Header.Content>
                                            {log.studentName !== 'N/A'
                                                ? log.studentName
                                                : (log.action === 'OVERDUE' ? 'System Task' : 'N/A')}
                                            {log.adminName && <Header.Subheader>By: {log.adminName}</Header.Subheader>}
                                            {log.studentId && <Header.Subheader style={{ color: '#2185d0' }}>Click to Profile</Header.Subheader>}
                                        </Header.Content>
                                    </Header>
                                </Table.Cell>
                                <Table.Cell textAlign='right'>
                                    <Label color={getActionColor(log.action)} horizontal>
                                        {log.action || 'UNKNOWN'}
                                    </Label>
                                </Table.Cell>
                                <Table.Cell textAlign='right'>
                                    <strong>{log.metadata && log.metadata.fine ? `$${log.metadata.fine}` : '$0'}</strong>
                                </Table.Cell>
                                <Table.Cell textAlign='right' style={{ color: '#666', fontSize: '0.9em' }}>
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : '-'}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                        {logs.length === 0 && !loading && (
                            <Table.Row>
                                <Table.Cell colSpan="5" textAlign='center'>
                                    <div style={{ padding: '20px', color: '#999' }}>
                                        <Icon name='search' size='large' />
                                        <p>No records found matching your filters.</p>
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>

                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell colSpan='5'>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Total: {total} records</span>
                                    <Button.Group size='small'>
                                        <Button icon='chevron left' disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                                        <Button disabled style={{ color: '#333', fontWeight: 'bold' }}>
                                            Page {page} of {Math.ceil(total / 20) || 1}
                                        </Button>
                                        <Button icon='chevron right' disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} />
                                    </Button.Group>
                                </div>
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Footer>
                </Table>
            </Segment>
        </div>
    );
}; export default AuditLogs;
