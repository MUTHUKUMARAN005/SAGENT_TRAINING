// src/components/Pages/BorrowingRecords.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getBorrowingRecords, createBorrowingRecord, updateBorrowingRecord, deleteBorrowingRecord } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const BorrowingRecords = () => <CrudPage config={{
  entityName:'Borrowing', icon:'🔄', gradient:'linear-gradient(135deg,#f97316,#fb923c)', color:'#f97316',
  idField:'recordId', fetchFn:getBorrowingRecords, createFn:createBorrowingRecord, updateFn:updateBorrowingRecord, deleteFn:deleteBorrowingRecord,
  canCreate:PERMISSIONS.CREATE_BORROWING, canEdit:PERMISSIONS.EDIT_BORROWING, canDelete:PERMISSIONS.DELETE_BORROWING,
  searchFields:['recordId','status'],
  emptyForm:{ recordId:'', borrowDate:'', dueDate:'', returnDate:'', status:'Active' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#f97316', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.recordId}</span> },
    { header:'Member', render: r => <span style={{ fontSize:'12px' }}>👤 {r.member?.name||'N/A'}</span> },
    { header:'Copy', render: r => <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#94a3b8' }}>{r.copy?.copyId||'N/A'}</span> },
    { header:'Borrow', accessor:'borrowDate' },
    { header:'Due', accessor:'dueDate' },
    { header:'Return', render: r => r.returnDate || <span style={{ color:'#475569' }}>—</span> },
    { header:'Status', render: r => <StatusBadge status={r.status} /> },
  ],
  formFields:[
    { key:'recordId', label:'Record ID', placeholder:'BR006', isId:true },
    { key:'borrowDate', label:'Borrow Date', type:'date' },
    { key:'dueDate', label:'Due Date', type:'date' },
    { key:'returnDate', label:'Return Date', type:'date', required:false },
    { key:'status', label:'Status', type:'select', options:['Active','Returned','Overdue'] },
  ],
  fallbackData:[
    { recordId:'BR001', member:{name:'Alice Johnson'}, copy:{copyId:'CP002'}, borrowDate:'2024-10-01', dueDate:'2024-10-15', returnDate:null, status:'Active' },
    { recordId:'BR002', member:{name:'Bob Williams'}, copy:{copyId:'CP001'}, borrowDate:'2024-09-15', dueDate:'2024-09-29', returnDate:'2024-09-28', status:'Returned' },
    { recordId:'BR003', member:{name:'Clara Chen'}, copy:{copyId:'CP003'}, borrowDate:'2024-10-05', dueDate:'2024-10-19', returnDate:null, status:'Active' },
    { recordId:'BR004', member:{name:'David Martinez'}, copy:{copyId:'CP005'}, borrowDate:'2024-08-20', dueDate:'2024-09-03', returnDate:'2024-09-10', status:'Overdue' },
    { recordId:'BR005', member:{name:'Eva Thompson'}, copy:{copyId:'CP004'}, borrowDate:'2024-10-10', dueDate:'2024-10-24', returnDate:null, status:'Active' },
  ]
}} />;
export default BorrowingRecords;