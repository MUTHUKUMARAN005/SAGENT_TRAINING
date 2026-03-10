// src/components/Pages/BookCopies.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getBookCopies, createBookCopy, updateBookCopy, deleteBookCopy, getBooks, getLibraries } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const FALLBACK_BOOK_OPTIONS = [
  { bookId:'BK001', title:'To Kill a Mockingbird' },
  { bookId:'BK002', title:'1984' },
  { bookId:'BK003', title:'Pride and Prejudice' },
  { bookId:'BK004', title:'The Great Gatsby' },
  { bookId:'BK005', title:'100 Years of Solitude' },
];

const FALLBACK_LIBRARY_OPTIONS = [
  { libraryId:'LIB001', name:'Central Library' },
  { libraryId:'LIB002', name:'Westside Library' },
  { libraryId:'LIB003', name:'University Library' },
  { libraryId:'LIB004', name:"Children's Library" },
];

const BookCopies = () => {
  const [books, setBooks] = useState(FALLBACK_BOOK_OPTIONS);
  const [libraries, setLibraries] = useState(FALLBACK_LIBRARY_OPTIONS);

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

    getLibraries()
      .then((response) => {
        if (!mounted) return;
        const rows = Array.isArray(response?.data) ? response.data : [];
        const normalized = rows
          .map((library) => ({
            libraryId: String(library.libraryId || '').trim(),
            name: String(library.name || '').trim(),
          }))
          .filter((library) => library.libraryId && library.name);

        setLibraries(normalized.length ? normalized : FALLBACK_LIBRARY_OPTIONS);
      })
      .catch(() => {
        if (mounted) setLibraries(FALLBACK_LIBRARY_OPTIONS);
      });

    return () => { mounted = false; };
  }, []);

  const bookOptions = useMemo(() => (
    books.map((book) => ({
      label: `${book.title} (${book.bookId})`,
      value: book.bookId
    }))
  ), [books]);

  const libraryOptions = useMemo(() => (
    libraries.map((library) => ({
      label: `${library.name} (${library.libraryId})`,
      value: library.libraryId
    }))
  ), [libraries]);

  return <CrudPage config={{
    entityName:'Book Copy', icon:'CP', gradient:'linear-gradient(135deg,#14b8a6,#2dd4bf)', color:'#14b8a6',
    idField:'copyId', fetchFn:getBookCopies, createFn:createBookCopy, updateFn:updateBookCopy, deleteFn:deleteBookCopy,
    canCreate:PERMISSIONS.CREATE_BOOK_COPY, canEdit:PERMISSIONS.EDIT_BOOK_COPY, canDelete:PERMISSIONS.DELETE_BOOK_COPY,
    searchFields:['copyId','bookId','libraryId','status','location'],
    emptyForm:{ copyId:'', bookId:'', libraryId:'', status:'Available', location:'' },
    transformSubmit: ({ form }) => {
      const selectedBook = books.find((book) => book.bookId === String(form.bookId || '').trim());
      const selectedLibrary = libraries.find((library) => library.libraryId === String(form.libraryId || '').trim());

      return {
        ...form,
        bookId: selectedBook?.bookId || String(form.bookId || '').trim(),
        libraryId: selectedLibrary?.libraryId || String(form.libraryId || '').trim(),
        book: selectedBook ? { title: selectedBook.title } : undefined,
        library: selectedLibrary ? { name: selectedLibrary.name } : undefined,
      };
    },
    columns:[
      { header:'Copy ID', render: r => <span style={{ color:'#14b8a6', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.copyId}</span> },
      { header:'Book', render: r => <span style={{ fontWeight:600, fontSize:'12px' }}>{r.book?.title||'N/A'}</span> },
      { header:'Library', render: r => <span style={{ color:'#94a3b8', fontSize:'12px' }}>{r.library?.name||'N/A'}</span> },
      { header:'Status', render: r => <StatusBadge status={r.status} /> },
      { header:'Location', render: r => <span style={{ color:'#94a3b8', fontSize:'12px' }}>{r.location}</span> },
    ],
    formFields:[
      { key:'copyId', label:'Copy ID', placeholder:'CP006', isId:true },
      { key:'bookId', label:'Book', type:'select', options:bookOptions },
      { key:'libraryId', label:'Library', type:'select', options:libraryOptions },
      { key:'status', label:'Status', type:'select', options:['Available','Borrowed','Reserved'] },
      { key:'location', label:'Shelf Location', placeholder:'Shelf A-12' },
    ],
    fallbackData:[
      { copyId:'CP001', bookId:'BK001', libraryId:'LIB001', book:{title:'To Kill a Mockingbird'}, library:{name:'Central Library'}, status:'Available', location:'Shelf A-12' },
      { copyId:'CP002', bookId:'BK002', libraryId:'LIB001', book:{title:'1984'}, library:{name:'Central Library'}, status:'Borrowed', location:'Shelf B-05' },
      { copyId:'CP003', bookId:'BK003', libraryId:'LIB002', book:{title:'Pride and Prejudice'}, library:{name:'Westside Library'}, status:'Available', location:'Shelf C-08' },
      { copyId:'CP004', bookId:'BK004', libraryId:'LIB003', book:{title:'The Great Gatsby'}, library:{name:'University Library'}, status:'Reserved', location:'Shelf D-03' },
      { copyId:'CP005', bookId:'BK005', libraryId:'LIB004', book:{title:'100 Years of Solitude'}, library:{name:"Children's Library"}, status:'Available', location:'Shelf E-11' },
    ]
  }} />;
};

export default BookCopies;
