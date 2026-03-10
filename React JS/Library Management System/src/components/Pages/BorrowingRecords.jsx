// src/components/Pages/BorrowingRecords.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/permissions';
import { getBorrowingRecords, createBorrowingRecord, updateBorrowingRecord, deleteBorrowingRecord, getBooks } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const LATE_RETURN_PENALTY_PER_DAY = 2;
const FALLBACK_BOOK_OPTIONS = [
  { bookId:'BK001', title:'To Kill a Mockingbird' },
  { bookId:'BK002', title:'1984' },
  { bookId:'BK003', title:'Pride and Prejudice' },
  { bookId:'BK004', title:'The Great Gatsby' },
  { bookId:'BK005', title:'100 Years of Solitude' },
];

const BorrowingRecords = () => {
  const { checkPermission } = useAuth();
  const canViewAllBorrowings = checkPermission(PERMISSIONS.VIEW_BORROWINGS);
  const [books, setBooks] = useState(FALLBACK_BOOK_OPTIONS);

  useEffect(() => {
    let mounted = true;
    getBooks()
      .then((response) => {
        if (!mounted) return;
        const rows = Array.isArray(response?.data) ? response.data : [];
        const normalized = rows
          .map((book) => ({
            bookId: String(book.bookId || '').trim(),
            title: String(book.title || '').trim(),
          }))
          .filter((book) => book.bookId && book.title);

        setBooks(normalized.length ? normalized : FALLBACK_BOOK_OPTIONS);
      })
      .catch(() => {
        if (mounted) setBooks(FALLBACK_BOOK_OPTIONS);
      });

    return () => { mounted = false; };
  }, []);

  const bookSelectOptions = useMemo(() => (
    books.map((book) => ({
      label: `${book.title} (${book.bookId})`,
      value: book.bookId
    }))
  ), [books]);

  const filterBorrowingsByRole = useCallback((rows, currentUser) => {
    if (canViewAllBorrowings) return rows;
    if (!currentUser) return [];

    const currentEmail = currentUser.email?.toLowerCase();

    return rows.filter((record) => (
      (currentUser.memberId && (record.member?.memberId === currentUser.memberId || record.memberId === currentUser.memberId)) ||
      (currentEmail && (record.member?.email?.toLowerCase() === currentEmail || record.memberEmail?.toLowerCase() === currentEmail))
    ));
  }, [canViewAllBorrowings]);

  return (
    <CrudPage config={{
      entityName:'Borrowing', icon:'BR', gradient:'linear-gradient(135deg,#f97316,#fb923c)', color:'#f97316',
      idField:'recordId', fetchFn:getBorrowingRecords, createFn:createBorrowingRecord, updateFn:updateBorrowingRecord, deleteFn:deleteBorrowingRecord,
      canCreate:PERMISSIONS.CREATE_BORROWING, canEdit:PERMISSIONS.EDIT_BORROWING, canDelete:PERMISSIONS.DELETE_BORROWING,
      filterData: filterBorrowingsByRole,
      searchFields:['recordId','status','bookTitle','bookId','memberName','memberId'],
      emptyForm:{ recordId:'', memberId:'', memberName:'', memberEmail:'', bookId:'', bookTitle:'', borrowDate:'', dueDate:'', returnDate:'', fineAmount:'', status:'Issued' },
      transformSubmit: ({ form }) => {
        const msPerDay = 24 * 60 * 60 * 1000;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const dueDate = form.dueDate ? new Date(form.dueDate) : null;
        const returnDate = form.returnDate ? new Date(form.returnDate) : null;
        if (dueDate) dueDate.setHours(0, 0, 0, 0);
        if (returnDate) returnDate.setHours(0, 0, 0, 0);

        let status = form.status || 'Issued';
        let fineAmount = Number(form.fineAmount || 0);

        if (returnDate) {
          const lateDays = dueDate && returnDate > dueDate
            ? Math.ceil((returnDate - dueDate) / msPerDay)
            : 0;
          fineAmount = lateDays > 0 ? lateDays * LATE_RETURN_PENALTY_PER_DAY : 0;
          status = 'Returned';
        } else if (dueDate && now > dueDate) {
          const lateDays = Math.ceil((now - dueDate) / msPerDay);
          fineAmount = lateDays > 0 ? lateDays * LATE_RETURN_PENALTY_PER_DAY : 0;
          status = 'Overdue';
        } else {
          fineAmount = 0;
          status = 'Issued';
        }

        const memberId = form.memberId?.trim();
        const memberName = form.memberName?.trim();
        const memberEmail = form.memberEmail?.trim().toLowerCase();
        const selectedBook = books.find((book) => book.bookId === String(form.bookId || '').trim());
        const bookId = selectedBook?.bookId || String(form.bookId || '').trim();
        const bookTitle = selectedBook?.title || String(form.bookTitle || '').trim();

        return {
          ...form,
          memberId,
          memberName,
          memberEmail,
          bookId,
          bookTitle,
          returnDate: form.returnDate || '',
          fineAmount,
          status,
          member: {
            memberId,
            name: memberName,
            email: memberEmail,
          },
        };
      },
      columns:[
        { header:'ID', render: r => <span style={{ color:'#f97316', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.recordId}</span> },
        { header:'Member', render: r => <span style={{ fontSize:'12px' }}>{r.member?.name || r.memberName || 'N/A'}</span> },
        { header:'Book', render: r => <span style={{ color:'#e2e8f0', fontSize:'12px' }}>{r.bookTitle || 'N/A'}</span> },
        { header:'Issue Date', accessor:'borrowDate' },
        { header:'Due', accessor:'dueDate' },
        { header:'Return Date', render: r => r.returnDate || <span style={{ color:'#475569' }}>—</span> },
        { header:'Fine', render: r => <span style={{ color:'#f59e0b', fontWeight:600 }}>${(r.fineAmount || 0).toFixed(2)}</span> },
        { header:'Status', render: r => <StatusBadge status={r.status} /> },
      ],
      formFields:[
        { key:'recordId', label:'Record ID', placeholder:'BR006', isId:true },
        { key:'memberId', label:'Student ID', placeholder:'MEM006' },
        { key:'memberName', label:'Student Name', placeholder:'Student full name' },
        { key:'memberEmail', label:'Student Email', placeholder:'student@email.com', type:'email', required:false },
        { key:'bookId', label:'Book', type:'select', options:bookSelectOptions },
        { key:'borrowDate', label:'Borrow Date', type:'date' },
        { key:'dueDate', label:'Due Date', type:'date' },
        { key:'returnDate', label:'Return Date', type:'date', required:false },
        { key:'status', label:'Status', type:'select', options:['Issued','Returned','Overdue'] },
      ],
      fallbackData:[
        { recordId:'BR001', member:{memberId:'MEM001', name:'Alice Johnson', email:'alice@email.com'}, bookTitle:'1984', borrowDate:'2024-10-01', dueDate:'2024-10-15', returnDate:null, fineAmount:0, status:'Issued' },
        { recordId:'BR002', member:{memberId:'MEM002', name:'Bob Williams', email:'bob@email.com'}, bookTitle:'To Kill a Mockingbird', borrowDate:'2024-09-15', dueDate:'2024-09-29', returnDate:'2024-09-28', fineAmount:0, status:'Returned' },
        { recordId:'BR003', member:{memberId:'MEM003', name:'Clara Chen', email:'clara@email.com'}, bookTitle:'Pride and Prejudice', borrowDate:'2024-10-05', dueDate:'2024-10-19', returnDate:null, fineAmount:0, status:'Issued' },
        { recordId:'BR004', member:{memberId:'MEM004', name:'David Martinez', email:'david@email.com'}, bookTitle:'100 Years of Solitude', borrowDate:'2024-08-20', dueDate:'2024-09-03', returnDate:'2024-09-10', fineAmount:3.50, status:'Overdue' },
        { recordId:'BR005', member:{memberId:'MEM005', name:'Eva Thompson', email:'eva@email.com'}, bookTitle:'The Great Gatsby', borrowDate:'2024-10-10', dueDate:'2024-10-24', returnDate:null, fineAmount:1.00, status:'Issued' },
      ]
    }} />
  );
};
export default BorrowingRecords;
