// src/components/Pages/BookCopies.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getBookCopies, createBookCopy, updateBookCopy, deleteBookCopy } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const BookCopies = () => <CrudPage config={{
  entityName:'Book Copy', icon:'📋', gradient:'linear-gradient(135deg,#14b8a6,#2dd4bf)', color:'#14b8a6',
  idField:'copyId', fetchFn:getBookCopies, createFn:createBookCopy, updateFn:updateBookCopy, deleteFn:deleteBookCopy,
  canCreate:PERMISSIONS.CREATE_BOOK_COPY, canEdit:PERMISSIONS.EDIT_BOOK_COPY, canDelete:PERMISSIONS.DELETE_BOOK_COPY,
  searchFields:['copyId','status','location'],
  emptyForm:{ copyId:'', status:'Available', location:'' },
  columns:[
    { header:'Copy ID', render: r => <span style={{ color:'#14b8a6', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.copyId}</span> },
    { header:'Book', render: r => <span style={{ fontWeight:600, fontSize:'12px' }}>📖 {r.book?.title||'N/A'}</span> },
    { header:'Library', render: r => <span style={{ color:'#94a3b8', fontSize:'12px' }}>🏛️ {r.library?.name||'N/A'}</span> },
    { header:'Status', render: r => <StatusBadge status={r.status} /> },
    { header:'Location', render: r => <span style={{ color:'#94a3b8', fontSize:'12px' }}>📍 {r.location}</span> },
  ],
  formFields:[
    { key:'copyId', label:'Copy ID', placeholder:'CP006', isId:true },
    { key:'status', label:'Status', type:'select', options:['Available','Borrowed','Reserved'] },
    { key:'location', label:'Shelf Location', placeholder:'Shelf A-12' },
  ],
  fallbackData:[
    { copyId:'CP001', book:{title:'To Kill a Mockingbird'}, library:{name:'Central Library'}, status:'Available', location:'Shelf A-12' },
    { copyId:'CP002', book:{title:'1984'}, library:{name:'Central Library'}, status:'Borrowed', location:'Shelf B-05' },
    { copyId:'CP003', book:{title:'Pride and Prejudice'}, library:{name:'Westside Library'}, status:'Available', location:'Shelf C-08' },
    { copyId:'CP004', book:{title:'The Great Gatsby'}, library:{name:'University Library'}, status:'Reserved', location:'Shelf D-03' },
    { copyId:'CP005', book:{title:'100 Years of Solitude'}, library:{name:"Children's Library"}, status:'Available', location:'Shelf E-11' },
  ]
}} />;
export default BookCopies;