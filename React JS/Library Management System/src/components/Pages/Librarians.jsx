// src/components/Pages/Librarians.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getLibrarians, createLibrarian, updateLibrarian, deleteLibrarian } from '../../api/api';
import CrudPage from './CrudPage';

const Librarians = () => <CrudPage config={{
  entityName:'Librarian', icon:'👨‍💼', gradient:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#f59e0b',
  idField:'librarianId', fetchFn:getLibrarians, createFn:createLibrarian, updateFn:updateLibrarian, deleteFn:deleteLibrarian,
  canCreate:PERMISSIONS.CREATE_LIBRARIAN, canEdit:PERMISSIONS.EDIT_LIBRARIAN, canDelete:PERMISSIONS.DELETE_LIBRARIAN,
  searchFields:['librarianId','name','role'],
  emptyForm:{ librarianId:'', name:'', email:'', password:'', role:'' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#f59e0b', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.librarianId}</span> },
    { header:'Name', render: r => <span style={{ fontWeight:600 }}>👨‍💼 {r.name}</span> },
    { header:'Email', render: r => <span style={{ color:'#94a3b8', fontSize:'12px' }}>{r.email}</span> },
    { header:'Role', render: r => <span style={{ padding:'2px 10px', borderRadius:'16px', fontSize:'10px', fontWeight:600, background:'rgba(245,158,11,0.1)', color:'#fbbf24' }}>{r.role}</span> },
  ],
  formFields:[
    { key:'librarianId', label:'ID', placeholder:'LBRN006', isId:true },
    { key:'name', label:'Name', placeholder:'Full Name' },
    { key:'email', label:'Email', placeholder:'email@lib.org', type:'email' },
    { key:'password', label:'Password', placeholder:'Password', type:'password' },
    { key:'role', label:'Role', placeholder:'Head Librarian' },
  ],
  fallbackData:[
    { librarianId:'LBRN001', name:'Sarah Mitchell', email:'sarah@citylib.org', role:'Head Librarian' },
    { librarianId:'LBRN002', name:'James Cooper', email:'james@citylib.org', role:'Assistant Librarian' },
    { librarianId:'LBRN003', name:'Maria Gonzalez', email:'maria@unilib.edu', role:'Research Librarian' },
    { librarianId:'LBRN004', name:'Tom Baker', email:'tom@discoverylib.org', role:"Children's Librarian" },
    { librarianId:'LBRN005', name:'Linda Park', email:'linda@medialib.org', role:'Digital Services' },
  ]
}} />;
export default Librarians;