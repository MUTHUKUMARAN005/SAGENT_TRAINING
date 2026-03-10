import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../Common/PageTransition';
import LoadingSpinner from '../Common/LoadingSpinner';
import DataTable from '../Common/DataTable';
import SearchBar from '../Common/SearchBar';
import StatusBadge from '../Common/StatusBadge';
import {
  getBorrowingRecords,
  getMembers,
  getBooks,
} from '../../api/api';
import { printTableAsPdf, printIssueReceipt } from '../../utils/pdf';

const FALLBACK_BORROWINGS = [
  { recordId:'BR001', member:{memberId:'MEM001', name:'Alice Johnson', email:'alice@email.com'}, bookTitle:'1984', borrowDate:'2024-10-01', dueDate:'2024-10-15', returnDate:null, fineAmount:0, status:'Issued' },
  { recordId:'BR002', member:{memberId:'MEM002', name:'Bob Williams', email:'bob@email.com'}, bookTitle:'To Kill a Mockingbird', borrowDate:'2024-09-15', dueDate:'2024-09-29', returnDate:'2024-09-28', fineAmount:0, status:'Returned' },
  { recordId:'BR003', member:{memberId:'MEM003', name:'Clara Chen', email:'clara@email.com'}, bookTitle:'Pride and Prejudice', borrowDate:'2024-10-05', dueDate:'2024-10-19', returnDate:null, fineAmount:0, status:'Issued' },
  { recordId:'BR004', member:{memberId:'MEM004', name:'David Martinez', email:'david@email.com'}, bookTitle:'100 Years of Solitude', borrowDate:'2024-08-20', dueDate:'2024-09-03', returnDate:'2024-09-10', fineAmount:14, status:'Returned' },
  { recordId:'BR005', member:{memberId:'MEM005', name:'Eva Thompson', email:'eva@email.com'}, bookTitle:'The Great Gatsby', borrowDate:'2024-10-10', dueDate:'2024-10-24', returnDate:null, fineAmount:4, status:'Overdue' },
];

const FALLBACK_STUDENTS = [
  { memberId:'MEM001', name:'Alice Johnson', email:'alice@email.com', status:'Active' },
  { memberId:'MEM002', name:'Bob Williams', email:'bob@email.com', status:'Active' },
  { memberId:'MEM003', name:'Clara Chen', email:'clara@email.com', status:'Active' },
  { memberId:'MEM004', name:'David Martinez', email:'david@email.com', status:'Inactive' },
  { memberId:'MEM005', name:'Eva Thompson', email:'eva@email.com', status:'Active' },
];

const FALLBACK_BOOKS = [
  { bookId:'BK001', title:'To Kill a Mockingbird', author:'Harper Lee', category:'Fiction', availableCopies:2, totalCopies:5, status:'Available' },
  { bookId:'BK002', title:'1984', author:'George Orwell', category:'Science Fiction', availableCopies:0, totalCopies:4, status:'Issued' },
  { bookId:'BK003', title:'Pride and Prejudice', author:'Jane Austen', category:'Romance', availableCopies:3, totalCopies:6, status:'Available' },
  { bookId:'BK004', title:'The Great Gatsby', author:'F. Scott Fitzgerald', category:'Classic', availableCopies:1, totalCopies:3, status:'Available' },
  { bookId:'BK005', title:'100 Years of Solitude', author:'Gabriel Garcia Marquez', category:'Magical Realism', availableCopies:0, totalCopies:4, status:'Issued' },
];

const REPORTS = {
  issued: 'Issued Books Report',
  late: 'Late Return Report',
  students: 'Student Report',
  books: 'Book Report',
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [borrowings, setBorrowings] = useState([]);
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [activeReport, setActiveReport] = useState('issued');

  useEffect(() => {
    Promise.all([
      getBorrowingRecords().catch(() => ({ data: FALLBACK_BORROWINGS })),
      getMembers().catch(() => ({ data: FALLBACK_STUDENTS })),
      getBooks().catch(() => ({ data: FALLBACK_BOOKS })),
    ])
      .then(([borrowingRes, studentRes, bookRes]) => {
        setBorrowings(Array.isArray(borrowingRes?.data) ? borrowingRes.data : FALLBACK_BORROWINGS);
        setStudents(Array.isArray(studentRes?.data) ? studentRes.data : FALLBACK_STUDENTS);
        setBooks(Array.isArray(bookRes?.data) ? bookRes.data : FALLBACK_BOOKS);
      })
      .finally(() => setLoading(false));
  }, []);

  const lateRows = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return borrowings.filter((record) => {
      if (!record?.dueDate) return false;
      const dueDate = new Date(record.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (record.returnDate) {
        const returned = new Date(record.returnDate);
        returned.setHours(0, 0, 0, 0);
        return returned > dueDate;
      }
      return today > dueDate;
    });
  }, [borrowings]);

  const issuedRows = useMemo(() => (
    borrowings.filter((record) => ['Issued', 'Overdue'].includes(record.status))
  ), [borrowings]);

  const reportRows = useMemo(() => {
    if (activeReport === 'issued') return issuedRows;
    if (activeReport === 'late') return lateRows;
    if (activeReport === 'students') return students;
    return books;
  }, [activeReport, books, issuedRows, lateRows, students]);

  const filteredRows = useMemo(() => {
    if (!search) return reportRows;
    const query = search.toLowerCase();
    return reportRows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  }, [reportRows, search]);

  const columns = useMemo(() => {
    if (activeReport === 'issued') {
      return [
        { header:'Issue ID', render: (row) => <span style={{ fontFamily:'monospace', fontSize:'11px' }}>{row.recordId}</span> },
        { header:'Student', render: (row) => row.member?.name || row.memberName || 'N/A' },
        { header:'Book', accessor:'bookTitle' },
        { header:'Issue Date', accessor:'borrowDate' },
        { header:'Due Date', accessor:'dueDate' },
        { header:'Status', render: (row) => <StatusBadge status={row.status || 'Issued'} /> },
        { header:'Receipt', render: (row) => (
          <button
            onClick={() => printIssueReceipt(row)}
            style={{
              border: '1px solid rgba(20,184,166,0.35)',
              background: 'rgba(20,184,166,0.12)',
              color: '#2dd4bf',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            PDF
          </button>
        ) },
      ];
    }

    if (activeReport === 'late') {
      return [
        { header:'Issue ID', accessor:'recordId' },
        { header:'Student', render: (row) => row.member?.name || row.memberName || 'N/A' },
        { header:'Book', accessor:'bookTitle' },
        { header:'Due Date', accessor:'dueDate' },
        { header:'Return Date', render: (row) => row.returnDate || 'Not Returned' },
        { header:'Fine', render: (row) => <span style={{ color:'#f59e0b', fontWeight:700 }}>${Number(row.fineAmount || 0).toFixed(2)}</span> },
        { header:'Status', render: (row) => <StatusBadge status={row.status || 'Overdue'} /> },
      ];
    }

    if (activeReport === 'students') {
      return [
        { header:'Student ID', accessor:'memberId' },
        { header:'Name', accessor:'name' },
        { header:'Email', accessor:'email' },
        { header:'Status', render: (row) => <StatusBadge status={row.status || 'Active'} /> },
      ];
    }

    return [
      { header:'Book ID', accessor:'bookId' },
      { header:'Title', accessor:'title' },
      { header:'Author', accessor:'author' },
      { header:'Category', render: (row) => row.category || row.subject || 'N/A' },
      { header:'Availability', render: (row) => <StatusBadge status={(row.availableCopies || 0) > 0 ? 'Available' : 'Issued'} /> },
      { header:'Copies', render: (row) => `${row.availableCopies ?? 0}/${row.totalCopies ?? 0}` },
    ];
  }, [activeReport]);

  const exportCurrentReport = () => {
    const cols = columns.map((item) => item.header);
    const rows = filteredRows.map((row) => {
      if (activeReport === 'issued') {
        return [
          row.recordId,
          row.member?.name || row.memberName || 'N/A',
          row.bookTitle || 'N/A',
          row.borrowDate || 'N/A',
          row.dueDate || 'N/A',
          row.status || 'Issued',
          `$${Number(row.fineAmount || 0).toFixed(2)}`,
        ];
      }
      if (activeReport === 'late') {
        return [
          row.recordId,
          row.member?.name || row.memberName || 'N/A',
          row.bookTitle || 'N/A',
          row.dueDate || 'N/A',
          row.returnDate || 'Not Returned',
          `$${Number(row.fineAmount || 0).toFixed(2)}`,
          row.status || 'Overdue',
        ];
      }
      if (activeReport === 'students') {
        return [row.memberId, row.name, row.email, row.status || 'Active'];
      }
      return [
        row.bookId,
        row.title,
        row.author,
        row.category || row.subject || 'N/A',
        (row.availableCopies || 0) > 0 ? 'Available' : 'Issued',
        `${row.availableCopies ?? 0}/${row.totalCopies ?? 0}`,
      ];
    });

    printTableAsPdf({
      title: REPORTS[activeReport],
      subtitle: 'Library Management Generated Report',
      columns: cols,
      rows,
    });
  };

  if (loading) return <LoadingSpinner text="Loading reports..." />;

  return (
    <PageTransition>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'12px', marginBottom:'16px' }}>
        {[
          { key:'issued', label:'Issued Books', count: issuedRows.length, color:'#f59e0b' },
          { key:'late', label:'Late Returns', count: lateRows.length, color:'#ef4444' },
          { key:'students', label:'Students', count: students.length, color:'#10b981' },
          { key:'books', label:'Books', count: books.length, color:'#6366f1' },
        ].map((card) => (
          <motion.button
            key={card.key}
            whileHover={{ y:-2 }}
            onClick={() => setActiveReport(card.key)}
            style={{
              textAlign:'left',
              background: activeReport === card.key ? `${card.color}20` : 'rgba(15,23,42,0.55)',
              border: `1px solid ${activeReport === card.key ? `${card.color}60` : 'rgba(148,163,184,0.22)'}`,
              borderRadius:'14px',
              padding:'14px',
              color:'#e2e8f0',
              cursor:'pointer'
            }}
          >
            <p style={{ margin:'0 0 6px', fontSize:'11px', color:'#94a3b8', textTransform:'uppercase' }}>{card.label}</p>
            <p style={{ margin:0, fontSize:'24px', fontWeight:800, color:card.color }}>{card.count}</p>
          </motion.button>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'12px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder={`Search in ${REPORTS[activeReport].toLowerCase()}...`} />
        <button
          onClick={exportCurrentReport}
          style={{
            border:'none',
            background:'linear-gradient(135deg,#14b8a6,#22d3ee)',
            color:'white',
            borderRadius:'10px',
            padding:'10px 14px',
            fontSize:'12px',
            fontWeight:700,
            cursor:'pointer'
          }}
        >
          Export {REPORTS[activeReport]} PDF
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredRows}
        emptyIcon="RP"
        emptyTitle={`No records in ${REPORTS[activeReport]}`}
      />
    </PageTransition>
  );
};

export default Reports;
