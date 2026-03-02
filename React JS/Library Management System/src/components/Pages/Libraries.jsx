// src/components/Pages/Libraries.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getLibraries, createLibrary, updateLibrary, deleteLibrary } from '../../api/api';
import CrudPage from './CrudPage';

const Libraries = () => <CrudPage config={{
  entityName:'Library', icon:'🏛️', gradient:'linear-gradient(135deg,#06b6d4,#22d3ee)', color:'#06b6d4',
  idField:'libraryId', fetchFn:getLibraries, createFn:createLibrary, updateFn:updateLibrary, deleteFn:deleteLibrary,
  canCreate:PERMISSIONS.CREATE_LIBRARY, canEdit:PERMISSIONS.EDIT_LIBRARY, canDelete:PERMISSIONS.DELETE_LIBRARY,
  searchFields:['libraryId','name','location'],
  emptyForm:{ libraryId:'', name:'', location:'', contactEmail:'' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#06b6d4', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.libraryId}</span> },
    { header:'Name', render: r => <span style={{ fontWeight:600 }}>🏛️ {r.name}</span> },
    { header:'Location', render: r => <span style={{ color:'#94a3b8' }}>📍 {r.location}</span> },
    { header:'Email', render: r => <span style={{ color:'#06b6d4', fontSize:'12px' }}>{r.contactEmail}</span> },
  ],
  formFields:[
    { key:'libraryId', label:'Library ID', placeholder:'LIB006', isId:true },
    { key:'name', label:'Name', placeholder:'Library Name' },
    { key:'location', label:'Location', placeholder:'Address' },
    { key:'contactEmail', label:'Email', placeholder:'email@lib.org', type:'email' },
  ],
  fallbackData:[
    { libraryId:'LIB001', name:'Central City Library', location:'123 Main Street', contactEmail:'central@citylib.org' },
    { libraryId:'LIB002', name:'Westside Community Library', location:'456 West Avenue', contactEmail:'west@citylib.org' },
    { libraryId:'LIB003', name:'University Research Library', location:'789 Campus Drive', contactEmail:'research@unilib.edu' },
    { libraryId:'LIB004', name:"Children's Discovery Library", location:'321 Park Lane', contactEmail:'kids@discoverylib.org' },
    { libraryId:'LIB005', name:'Digital Media Library', location:'654 Tech Boulevard', contactEmail:'digital@medialib.org' },
  ]
}} />;
export default Libraries;