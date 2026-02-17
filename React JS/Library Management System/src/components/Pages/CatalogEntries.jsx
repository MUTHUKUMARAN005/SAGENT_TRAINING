// src/components/Pages/CatalogEntries.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getCatalogEntries, createCatalogEntry, updateCatalogEntry, deleteCatalogEntry } from '../../api/api';
import CrudPage from './CrudPage';

const CatalogEntries = () => <CrudPage config={{
  entityName:'Catalog Entry', icon:'🗂️', gradient:'linear-gradient(135deg,#6366f1,#818cf8)', color:'#6366f1',
  idField:'entryId', fetchFn:getCatalogEntries, createFn:createCatalogEntry, updateFn:updateCatalogEntry, deleteFn:deleteCatalogEntry,
  canCreate:PERMISSIONS.MANAGE_CATALOG, canEdit:PERMISSIONS.MANAGE_CATALOG, canDelete:PERMISSIONS.MANAGE_CATALOG,
  emptyForm:{ entryId:'', dateAdded:'', lastUpdated:'' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#6366f1', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.entryId}</span> },
    { header:'Book', render: r => <span style={{ fontWeight:600, fontSize:'12px' }}>📖 {r.book?.title||'N/A'}</span> },
    { header:'Library', render: r => <span style={{ fontSize:'12px' }}>🏛️ {r.library?.name||'N/A'}</span> },
    { header:'Added', accessor:'dateAdded' },
    { header:'Updated', accessor:'lastUpdated' },
  ],
  formFields:[
    { key:'entryId', label:'Entry ID', placeholder:'CAT006', isId:true },
    { key:'dateAdded', label:'Date Added', type:'date' },
    { key:'lastUpdated', label:'Last Updated', type:'date', required:false },
  ],
  fallbackData:[
    { entryId:'CAT001', book:{title:'To Kill a Mockingbird'}, library:{name:'Central Library'}, dateAdded:'2022-06-15', lastUpdated:'2024-01-10' },
    { entryId:'CAT002', book:{title:'1984'}, library:{name:'Central Library'}, dateAdded:'2022-07-20', lastUpdated:'2024-02-15' },
    { entryId:'CAT003', book:{title:'Pride and Prejudice'}, library:{name:'Westside Library'}, dateAdded:'2023-01-05', lastUpdated:'2024-03-01' },
    { entryId:'CAT004', book:{title:'The Great Gatsby'}, library:{name:'University Library'}, dateAdded:'2023-04-12', lastUpdated:'2024-01-20' },
    { entryId:'CAT005', book:{title:'100 Years of Solitude'}, library:{name:"Children's Library"}, dateAdded:'2023-08-30', lastUpdated:'2024-04-05' },
  ]
}} />;
export default CatalogEntries;