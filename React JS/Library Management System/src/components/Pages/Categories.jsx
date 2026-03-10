import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Categories = () => (
  <CrudPage config={{
    entityName:'Category',
    icon:'CT',
    gradient:'linear-gradient(135deg,#06b6d4,#22d3ee)',
    color:'#06b6d4',
    idField:'categoryId',
    fetchFn:getCategories,
    createFn:createCategory,
    updateFn:updateCategory,
    deleteFn:deleteCategory,
    canCreate:PERMISSIONS.CREATE_CATEGORY,
    canEdit:PERMISSIONS.EDIT_CATEGORY,
    canDelete:PERMISSIONS.DELETE_CATEGORY,
    searchFields:['categoryId','name','description','status'],
    emptyForm:{ categoryId:'', name:'', description:'', status:'Active' },
    columns:[
      { header:'ID', render: (row) => <span style={{ color:'#06b6d4', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{row.categoryId}</span> },
      { header:'Category', render: (row) => <span style={{ fontWeight:700 }}>{row.name}</span> },
      { header:'Description', render: (row) => <span style={{ color:'#94a3b8', fontSize:'12px' }}>{row.description || 'N/A'}</span> },
      { header:'Status', render: (row) => <StatusBadge status={row.status || 'Active'} /> },
    ],
    formFields:[
      { key:'categoryId', label:'Category ID', placeholder:'CAT006', isId:true },
      { key:'name', label:'Category Name', placeholder:'Science Fiction' },
      { key:'description', label:'Description', placeholder:'Category details...', type:'textarea', required:false },
      { key:'status', label:'Status', type:'select', options:['Active','Inactive'] },
    ],
    fallbackData:[
      { categoryId:'CAT001', name:'Fiction', description:'General fiction titles', status:'Active' },
      { categoryId:'CAT002', name:'Science Fiction', description:'Futuristic and speculative titles', status:'Active' },
      { categoryId:'CAT003', name:'Romance', description:'Romantic fiction and literature', status:'Active' },
      { categoryId:'CAT004', name:'History', description:'Historical studies and biographies', status:'Active' },
      { categoryId:'CAT005', name:'Reference', description:'Reference manuals and encyclopedias', status:'Inactive' },
    ]
  }} />
);

export default Categories;
