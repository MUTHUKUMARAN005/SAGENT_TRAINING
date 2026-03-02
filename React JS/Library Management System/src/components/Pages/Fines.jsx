// src/components/Pages/Fines.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getFines, createFine, updateFine, deleteFine } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Fines = () => <CrudPage config={{
  entityName:'Fine', icon:'💰', gradient:'linear-gradient(135deg,#ef4444,#f87171)', color:'#ef4444',
  idField:'fineId', fetchFn:getFines, createFn:createFine, updateFn:updateFine, deleteFn:deleteFine,
  canCreate:PERMISSIONS.MANAGE_FINES, canEdit:PERMISSIONS.MANAGE_FINES, canDelete:PERMISSIONS.MANAGE_FINES,
  searchFields:['fineId','status'],
  emptyForm:{ fineId:'', amount:'', status:'Unpaid', dueDate:'', paidDate:'' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#ef4444', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.fineId}</span> },
    { header:'Member', render: r => <span style={{ fontSize:'12px' }}>👤 {r.member?.name||'N/A'}</span> },
    { header:'Amount', render: r => <span style={{ fontWeight:700, color:'#f59e0b' }}>${r.amount}</span> },
    { header:'Status', render: r => <StatusBadge status={r.status} /> },
    { header:'Due', accessor:'dueDate' },
    { header:'Paid', render: r => r.paidDate || <span style={{ color:'#475569' }}>—</span> },
  ],
  formFields:[
    { key:'fineId', label:'Fine ID', placeholder:'FN006', isId:true },
    { key:'amount', label:'Amount ($)', placeholder:'0.00', type:'number' },
    { key:'status', label:'Status', type:'select', options:['Unpaid','Paid','Waived'] },
    { key:'dueDate', label:'Due Date', type:'date' },
    { key:'paidDate', label:'Paid Date', type:'date', required:false },
  ],
  fallbackData:[
    { fineId:'FN001', member:{name:'David Martinez'}, amount:3.50, status:'Unpaid', dueDate:'2024-09-03', paidDate:null },
    { fineId:'FN002', member:{name:'Alice Johnson'}, amount:1.00, status:'Paid', dueDate:'2024-07-15', paidDate:'2024-07-20' },
    { fineId:'FN003', member:{name:'Bob Williams'}, amount:0.50, status:'Paid', dueDate:'2024-05-10', paidDate:'2024-05-12' },
    { fineId:'FN004', member:{name:'Clara Chen'}, amount:5.00, status:'Unpaid', dueDate:'2024-10-19', paidDate:null },
    { fineId:'FN005', member:{name:'Eva Thompson'}, amount:2.00, status:'Waived', dueDate:'2024-06-01', paidDate:null },
  ]
}} />;
export default Fines;