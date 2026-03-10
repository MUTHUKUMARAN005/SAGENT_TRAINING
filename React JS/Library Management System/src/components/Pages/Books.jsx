// src/components/Pages/Books.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getBooks, createBook, updateBook, deleteBook } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Books = () => (
  <CrudPage config={{
    entityName:'Book', icon:'BK', gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#6366f1',
    idField:'bookId', fetchFn:getBooks, createFn:createBook, updateFn:updateBook, deleteFn:deleteBook,
    // RBAC
    canCreate: PERMISSIONS.CREATE_BOOK,
    canEdit: PERMISSIONS.EDIT_BOOK,
    canDelete: PERMISSIONS.DELETE_BOOK,
    buildQuickFilters: (rows) => {
      const categories = Array.from(new Set(
        (rows || [])
          .map((row) => row.category || row.subject)
          .filter(Boolean)
      )).sort();

      return [
        {
          key: 'category',
          label: 'Category',
          defaultValue: '',
          options: [
            { label: 'All Categories', value: '' },
            ...categories.map((category) => ({ label: category, value: category })),
          ],
          predicate: (row, value) => (row.category || row.subject || '').toLowerCase() === String(value).toLowerCase()
        },
        {
          key: 'availability',
          label: 'Availability',
          defaultValue: '',
          options: [
            { label: 'All Availability', value: '' },
            { label: 'Available', value: 'Available' },
            { label: 'Issued', value: 'Issued' },
          ],
          predicate: (row, value) => {
            const status = row.status || ((row.availableCopies || 0) > 0 ? 'Available' : 'Issued');
            return status.toLowerCase() === String(value).toLowerCase();
          }
        }
      ];
    },
    searchFields:['bookId','title','author','category','subject','isbn','edition','status'],
    emptyForm:{ bookId:'', isbn:'', title:'', author:'', category:'', edition:'', publicationYear:'', totalCopies:'', availableCopies:'', status:'Available', bookImage:'' },
    transformSubmit: ({ form }) => {
      const totalCopies = Number(form.totalCopies || 0);
      const safeTotal = totalCopies > 0 ? totalCopies : 0;
      const requestedAvailable = Number(form.availableCopies || 0);
      const availableCopies = Math.min(Math.max(requestedAvailable, 0), safeTotal);

      return {
        ...form,
        subject: form.category || form.subject || '',
        totalCopies: safeTotal,
        availableCopies,
        status: availableCopies > 0 ? 'Available' : 'Issued',
      };
    },
    columns:[
      { header:'ID', render: r => <span style={{ color:'#6366f1', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.bookId}</span> },
      { header:'Title', render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          {r.bookImage ? (
            <img
              src={r.bookImage}
              alt={`${r.title} cover`}
              style={{ width:'30px', height:'40px', borderRadius:'6px', objectFit:'cover', border:'1px solid rgba(255,255,255,0.1)' }}
            />
          ) : <span style={{ fontSize:'10px', fontWeight:800, color:'#9fb4ca' }}>BK</span>}
          <div>
            <div style={{ fontWeight:600, fontSize:'12px' }}>{r.title}</div>
            <div style={{ fontSize:'10px', color:'#64748b' }}>by {r.author}</div>
          </div>
        </div>
      )},
      { header:'ISBN', render: r => <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#94a3b8' }}>{r.isbn}</span> },
      { header:'Edition', accessor:'edition' },
      { header:'Category', render: r => <span style={{ padding:'2px 10px', borderRadius:'16px', fontSize:'10px', fontWeight:600, background:'rgba(99,102,241,0.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.2)' }}>{r.category || r.subject}</span> },
      { header:'Copies', render: r => <span style={{ fontSize:'12px', color:'#94a3b8' }}>{r.availableCopies ?? 0}/{r.totalCopies ?? 0}</span> },
      { header:'Status', render: r => <StatusBadge status={r.status || ((r.availableCopies || 0) > 0 ? 'Available' : 'Issued')} /> },
      { header:'Year', render: r => <span style={{ fontWeight:600 }}>{r.publicationYear}</span> },
    ],
    formFields:[
      { key:'bookId', label:'Book ID', placeholder:'BK006', isId:true },
      { key:'isbn', label:'ISBN', placeholder:'978-0000000000' },
      { key:'title', label:'Title', placeholder:'Book title' },
      { key:'author', label:'Author', placeholder:'Author name' },
      { key:'category', label:'Category', placeholder:'Fiction, Science...', required:false },
      { key:'edition', label:'Edition', placeholder:'2nd Edition', required:false },
      { key:'publicationYear', label:'Year', placeholder:'2024', type:'number', required:false },
      { key:'totalCopies', label:'Total Copies', placeholder:'10', type:'number', required:false },
      { key:'availableCopies', label:'Available Copies', placeholder:'6', type:'number', required:false },
      { key:'status', label:'Status', type:'select', options:['Available','Issued'] },
      { key:'bookImage', label:'Book Image', type:'file-image', required:false },
    ],
    fallbackData:[
      { bookId:'BK001', isbn:'978-0061120084', title:'To Kill a Mockingbird', author:'Harper Lee', category:'Fiction', edition:'1st', publicationYear:1960, totalCopies:5, availableCopies:2, status:'Available' },
      { bookId:'BK002', isbn:'978-0451524935', title:'1984', author:'George Orwell', category:'Science Fiction', edition:'3rd', publicationYear:1949, totalCopies:4, availableCopies:0, status:'Issued' },
      { bookId:'BK003', isbn:'978-0141439518', title:'Pride and Prejudice', author:'Jane Austen', category:'Romance', edition:'2nd', publicationYear:1813, totalCopies:6, availableCopies:3, status:'Available' },
      { bookId:'BK004', isbn:'978-0743273565', title:'The Great Gatsby', author:'F. Scott Fitzgerald', category:'Classic', edition:'1st', publicationYear:1925, totalCopies:3, availableCopies:1, status:'Available' },
      { bookId:'BK005', isbn:'978-0060883287', title:'100 Years of Solitude', author:'Gabriel García Márquez', category:'Magical Realism', edition:'4th', publicationYear:1967, totalCopies:4, availableCopies:0, status:'Issued' },
    ]
  }} />
);
export default Books;
