// src/components/Pages/Books.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getBooks, createBook, updateBook, deleteBook } from '../../api/api';
import CrudPage from './CrudPage';

const Books = () => (
  <CrudPage config={{
    entityName:'Book', icon:'📚', gradient:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#6366f1',
    idField:'bookId', fetchFn:getBooks, createFn:createBook, updateFn:updateBook, deleteFn:deleteBook,
    // RBAC
    canCreate: PERMISSIONS.CREATE_BOOK,
    canEdit: PERMISSIONS.EDIT_BOOK,
    canDelete: PERMISSIONS.DELETE_BOOK,
    searchFields:['bookId','title','author','subject','isbn'],
    emptyForm:{ bookId:'', isbn:'', title:'', author:'', subject:'', publicationYear:'' },
    columns:[
      { header:'ID', render: r => <span style={{ color:'#6366f1', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.bookId}</span> },
      { header:'Title', render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <span style={{ fontSize:'18px' }}>📖</span>
          <div>
            <div style={{ fontWeight:600, fontSize:'12px' }}>{r.title}</div>
            <div style={{ fontSize:'10px', color:'#64748b' }}>by {r.author}</div>
          </div>
        </div>
      )},
      { header:'ISBN', render: r => <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#94a3b8' }}>{r.isbn}</span> },
      { header:'Subject', render: r => <span style={{ padding:'2px 10px', borderRadius:'16px', fontSize:'10px', fontWeight:600, background:'rgba(99,102,241,0.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.2)' }}>{r.subject}</span> },
      { header:'Year', render: r => <span style={{ fontWeight:600 }}>{r.publicationYear}</span> },
    ],
    formFields:[
      { key:'bookId', label:'Book ID', placeholder:'BK006', isId:true },
      { key:'isbn', label:'ISBN', placeholder:'978-0000000000' },
      { key:'title', label:'Title', placeholder:'Book title' },
      { key:'author', label:'Author', placeholder:'Author name' },
      { key:'subject', label:'Subject', placeholder:'Fiction, Science...', required:false },
      { key:'publicationYear', label:'Year', placeholder:'2024', type:'number', required:false },
    ],
    fallbackData:[
      { bookId:'BK001', isbn:'978-0061120084', title:'To Kill a Mockingbird', author:'Harper Lee', subject:'Fiction', publicationYear:1960 },
      { bookId:'BK002', isbn:'978-0451524935', title:'1984', author:'George Orwell', subject:'Dystopian', publicationYear:1949 },
      { bookId:'BK003', isbn:'978-0141439518', title:'Pride and Prejudice', author:'Jane Austen', subject:'Romance', publicationYear:1813 },
      { bookId:'BK004', isbn:'978-0743273565', title:'The Great Gatsby', author:'F. Scott Fitzgerald', subject:'Classic', publicationYear:1925 },
      { bookId:'BK005', isbn:'978-0060883287', title:'100 Years of Solitude', author:'Gabriel García Márquez', subject:'Magical Realism', publicationYear:1967 },
    ]
  }} />
);
export default Books;