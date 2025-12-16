import React, { useState, useEffect } from 'react';
import { bookService } from '../../services/bookService';
import ReservationModal from './ReservationModal';
import { Table, Icon, Label, Button, Segment, Header } from 'semantic-ui-react';

const BookInventory = ({ onEdit, onIssue, viewMode }) => {
    const [books, setBooks] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [reservingBook, setReservingBook] = useState(null);

    const loadBooks = React.useCallback(async (overdue = false, searchQuery = '', currentPage = 1) => {
        try {
            const params = {
                page: currentPage,
                limit: 50,
                overdue: overdue
            };
            if (searchQuery) params.search = searchQuery;

            const res = await bookService.getAll(params);
            setBooks(res.data.data || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 1);
        } catch (e) {
            console.error("Failed to load books");
        }
    }, [page]); // Re-create if page dependency changes structure, but mostly used in useEffect

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const isOverdue = queryParams.get('filter') === 'overdue';
        const openId = queryParams.get('open');
        const searchParam = queryParams.get('search');
        const deptParam = queryParams.get('department');

        // Initial Load with Params
        loadBooks(isOverdue, searchParam || filter, page);

        // Auto-refresh interval (keep current page)
        const interval = setInterval(() => loadBooks(isOverdue, searchParam || filter, page), 30000);

        if (openId) setFilter(openId);
        if (searchParam) setFilter(searchParam);
        if (deptParam) setDeptFilter(deptParam);

        return () => clearInterval(interval);
    }, [filter, loadBooks, page]);



    const handleReserve = async (data) => {
        try {
            await bookService.reserve(data);
            alert("Reservation Successful! Added to queue.");
            loadBooks(); // Reflect any status changes?
        } catch (err) {
            throw err; // Modal handles alert
        }
    };

    // FILTERING
    const filteredBooks = books.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(filter.toLowerCase()) ||
            b.author.toLowerCase().includes(filter.toLowerCase()) ||
            b.isbn.includes(filter) ||
            (b._id === filter);
        const matchesDept = deptFilter ? b.department === deptFilter : true;
        return matchesSearch && matchesDept;
    });

    const departments = [...new Set(books.map(b => b.department))].filter(Boolean);
    const isConsolidated = viewMode === 'consolidated';

    return (
        <div className="book-inventory fade-in">
            {reservingBook && (
                <ReservationModal
                    book={reservingBook}
                    onClose={() => setReservingBook(null)}
                    onConfirm={handleReserve}
                />
            )}

            {/* CONTROLS */}
            <Segment basic style={{ padding: '0 0 20px 0' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="search-wrapper" style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                        <Icon name='search' style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: '#999' }} />
                        <input
                            style={{ paddingLeft: '40px', width: '100%', padding: '12px 40px 12px 40px', borderRadius: '5px', border: '1px solid #ddd' }}
                            placeholder="Search Title, Author, ISBN..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <select className="filter-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
                        <option value="">All Departments</option>
                        {(departments || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </Segment>

            {/* LIST VIEW */}
            <Segment raised>
                <Table celled striped selectable unstackable color='teal'>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell width={isConsolidated ? 6 : 4}><Icon name='book' /> Title</Table.HeaderCell>
                            <Table.HeaderCell width={isConsolidated ? 5 : 4}><Icon name='user' /> Author / {isConsolidated ? '' : 'ISBN'}</Table.HeaderCell>
                            {!isConsolidated && <Table.HeaderCell width={3}><Icon name='map marker alternate' /> Location</Table.HeaderCell>}
                            {!isConsolidated && <Table.HeaderCell width={3}><Icon name='building' /> Dept / Pop.</Table.HeaderCell>}
                            <Table.HeaderCell width={isConsolidated ? 5 : 3}><Icon name='box' /> Status</Table.HeaderCell>
                            {!isConsolidated && <Table.HeaderCell width={3}>Actions</Table.HeaderCell>}
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {filteredBooks.map(b => {
                            const isOverdueView = new URLSearchParams(window.location.search).get('filter') === 'overdue';
                            const rowStyle = isOverdueView ? { background: '#fef2f2', borderLeft: '4px solid #ef4444' } : {};

                            return (
                                <Table.Row key={b._id} style={rowStyle}>
                                    <Table.Cell
                                        style={{ fontWeight: 600, cursor: 'pointer', color: '#4f46e5' }}
                                        onClick={() => onEdit(b)}
                                        title="Click to View Details"
                                    >
                                        <Header as='h4'>
                                            <Header.Content>
                                                {b.title}
                                                <Header.Subheader style={{ fontSize: '0.8em', color: '#666' }}>ID: {b._id.substring(0, 6)}...</Header.Subheader>
                                            </Header.Content>
                                        </Header>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div style={{ fontWeight: 500 }}>{b.author}</div>
                                        {!isConsolidated && <div style={{ fontSize: '0.85rem', color: '#64748b' }}><Icon name='barcode' /> {b.isbn}</div>}
                                    </Table.Cell>

                                    {!isConsolidated && (
                                        <Table.Cell>
                                            <Label basic size='small'><Icon name='list' /> {b.shelfLocation || 'Main Stacks'}</Label>
                                        </Table.Cell>
                                    )}

                                    {!isConsolidated && (
                                        <Table.Cell>
                                            <Label color='blue' size='mini' horizontal>{b.department}</Label>
                                            <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#666' }}>
                                                <Icon name='fire' color='orange' /> PMI: {b.popularityIndex || 0}
                                            </div>
                                        </Table.Cell>
                                    )}

                                    <Table.Cell>
                                        <Label color={b.availableCopies > 0 ? 'green' : 'red'} horizontal>
                                            {b.availableCopies > 0 ? 'Available' : 'Unavailable'}
                                        </Label>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                            {b.availableCopies} / {b.totalCopies} Copies
                                        </div>
                                    </Table.Cell>

                                    {!isConsolidated && (
                                        <Table.Cell>
                                            <Button.Group size='mini'>
                                                <Button icon='pencil' basic onClick={() => onEdit(b)} title="Edit Book" />
                                                {b.availableCopies > 0 ? (
                                                    <Button icon='check' color='green' onClick={() => onIssue(b)} title="Issue Book" />
                                                ) : (
                                                    <Button icon='clock' color='orange' onClick={() => setReservingBook(b)} title="Reserve Book" />
                                                )}
                                            </Button.Group>
                                        </Table.Cell>
                                    )}
                                </Table.Row>
                            )
                        })}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell colSpan={isConsolidated ? '4' : '6'}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                        Showing {books.length} of {total} Books | Page {page} of {totalPages || 1}
                                    </span>
                                    <Button.Group size='small'>
                                        <Button
                                            icon='chevron left'
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        />
                                        <Button disabled style={{ color: '#333', fontWeight: 'bold' }}>
                                            {page}
                                        </Button>
                                        <Button
                                            icon='chevron right'
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                        />
                                    </Button.Group>
                                </div>
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Footer>
                </Table>
            </Segment>
        </div>
    );
};

export default BookInventory;
