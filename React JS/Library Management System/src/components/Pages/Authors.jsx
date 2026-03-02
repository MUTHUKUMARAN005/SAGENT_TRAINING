// src/components/Pages/Authors.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from '../../api/api';
import CrudPage from './CrudPage';

const Authors = () => <CrudPage config={{
  entityName:'Author', icon:'✍️', gradient:'linear-gradient(135deg,#8b5cf6,#a78bfa)', color:'#8b5cf6',
  idField:'authorId', fetchFn:getAuthors, createFn:createAuthor, updateFn:updateAuthor, deleteFn:deleteAuthor,
  canCreate:PERMISSIONS.CREATE_AUTHOR, canEdit:PERMISSIONS.EDIT_AUTHOR, canDelete:PERMISSIONS.DELETE_AUTHOR,
  searchFields:['authorId','name','biography'],
  emptyForm:{ authorId:'', name:'', biography:'' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#8b5cf6', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.authorId}</span> },
    { header:'Name', render: r => <span style={{ fontWeight:600 }}>✍️ {r.name}</span> },
    { header:'Biography', render: r => <span style={{ color:'#94a3b8', fontSize:'11px' }}>{r.biography?.substring(0,80)}...</span> },
  ],
  formFields:[
    { key:'authorId', label:'Author ID', placeholder:'AUT006', isId:true },
    { key:'name', label:'Name', placeholder:'Author Name' },
    { key:'biography', label:'Biography', placeholder:'Brief biography...', type:'textarea', required:false },
  ],
  fallbackData:[
    { authorId:'AUT001', name:'Harper Lee', biography:'American novelist known for To Kill a Mockingbird.' },
    { authorId:'AUT002', name:'George Orwell', biography:'English novelist known for 1984.' },
    { authorId:'AUT003', name:'Jane Austen', biography:'English novelist known for Pride and Prejudice.' },
    { authorId:'AUT004', name:'F. Scott Fitzgerald', biography:'American novelist of the Jazz Age.' },
    { authorId:'AUT005', name:'Gabriel García Márquez', biography:'Colombian novelist and Nobel laureate.' },
  ]
}} />;
export default Authors;