// src/components/Pages/Requests.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getRequests, createRequest, updateRequest, deleteRequest } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Requests = () => <CrudPage config={{
  entityName:'Request', icon:'📩', gradient:'linear-gradient(135deg,#8b5cf6,#a78bfa)', color:'#8b5cf6',
  idField:'requestId', fetchFn:getRequests, createFn:createRequest, updateFn:updateRequest, deleteFn:deleteRequest,
  canCreate:PERMISSIONS.CREATE_REQUEST, canEdit:PERMISSIONS.MANAGE_REQUESTS, canDelete:PERMISSIONS.MANAGE_REQUESTS,
  searchFields:['requestId','type','status','message'],
  emptyForm:{ requestId:'', type:'', message:'', requestDate:'', status:'Pending' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#8b5cf6', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.requestId}</span> },
    { header:'Member', render: r => <span style={{ fontSize:'12px' }}>👤 {r.member?.name||'N/A'}</span> },
    { header:'Type', render: r => <span style={{ padding:'2px 10px', borderRadius:'16px', fontSize:'10px', fontWeight:600, background:'rgba(139,92,246,0.1)', color:'#a78bfa' }}>{r.type}</span> },
    { header:'Message', render: r => <span style={{ color:'#94a3b8', fontSize:'11px' }}>{r.message?.substring(0,40)}...</span> },
    { header:'Date', accessor:'requestDate' },
    { header:'Status', render: r => <StatusBadge status={r.status} /> },
  ],
  formFields:[
    { key:'requestId', label:'Request ID', placeholder:'REQ006', isId:true },
    { key:'type', label:'Type', placeholder:'Book Reservation' },
    { key:'message', label:'Message', placeholder:'Request details...', type:'textarea' },
    { key:'requestDate', label:'Date', type:'date' },
    { key:'status', label:'Status', type:'select', options:['Pending','Approved','Completed','Rejected'] },
  ],
  fallbackData:[
    { requestId:'REQ001', member:{name:'Alice Johnson'}, type:'Book Reservation', message:'Reserve The Great Gatsby.', requestDate:'2024-10-08', status:'Pending' },
    { requestId:'REQ002', member:{name:'Bob Williams'}, type:'New Book', message:'Acquire Dune please.', requestDate:'2024-09-25', status:'Approved' },
    { requestId:'REQ003', member:{name:'Clara Chen'}, type:'Renewal', message:'Renew membership.', requestDate:'2024-10-01', status:'Completed' },
    { requestId:'REQ004', member:{name:'David Martinez'}, type:'Inter-Library Loan', message:'Need rare manuscript.', requestDate:'2024-10-12', status:'Pending' },
    { requestId:'REQ005', member:{name:'Eva Thompson'}, type:'Extension', message:'Extend borrowing.', requestDate:'2024-10-15', status:'Approved' },
  ]
}} />;
export default Requests;