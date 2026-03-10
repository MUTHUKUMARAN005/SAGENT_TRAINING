// src/components/Pages/Requests.jsx
import React, { useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/permissions';
import { getRequests, createRequest, updateRequest, deleteRequest } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Requests = () => {
  const { checkPermission } = useAuth();
  const canManageRequests = checkPermission(PERMISSIONS.MANAGE_REQUESTS);

  const filterRequestsByRole = useCallback((rows, currentUser) => {
    if (canManageRequests) return rows;
    if (!currentUser) return [];

    const currentEmail = currentUser.email?.toLowerCase();

    return rows.filter((request) => (
      (currentUser.memberId && request.member?.memberId === currentUser.memberId) ||
      (currentEmail && request.member?.email?.toLowerCase() === currentEmail)
    ));
  }, [canManageRequests]);

  return (
    <CrudPage config={{
      entityName:'Request', icon:'RQ', gradient:'linear-gradient(135deg,#8b5cf6,#a78bfa)', color:'#8b5cf6',
      idField:'requestId', fetchFn:getRequests, createFn:createRequest, updateFn:updateRequest, deleteFn:deleteRequest,
      canCreate:PERMISSIONS.CREATE_REQUEST, canEdit:PERMISSIONS.MANAGE_REQUESTS, canDelete:[PERMISSIONS.MANAGE_REQUESTS, PERMISSIONS.CREATE_REQUEST],
      filterData: filterRequestsByRole,
      canDeleteRow: (row) => canManageRequests || ['Pending', 'Approved'].includes(row.status),
      searchFields:['requestId','type','status','message'],
      emptyForm:{ requestId:'', type:'', message:'', requestDate:'', status:'Pending' },
      columns:[
        { header:'ID', render: r => <span style={{ color:'#8b5cf6', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.requestId}</span> },
        { header:'Member', render: r => <span style={{ fontSize:'12px' }}>{r.member?.name||'N/A'}</span> },
        { header:'Type', render: r => <span style={{ padding:'2px 10px', borderRadius:'16px', fontSize:'10px', fontWeight:600, background:'rgba(139,92,246,0.1)', color:'#a78bfa' }}>{r.type}</span> },
        { header:'Message', render: r => <span style={{ color:'#94a3b8', fontSize:'11px' }}>{r.message?.substring(0,40)}...</span> },
        { header:'Date', accessor:'requestDate' },
        { header:'Status', render: r => <StatusBadge status={r.status} /> },
      ],
      formFields:[
        { key:'requestId', label:'Request ID', placeholder:'REQ006', isId:true },
        { key:'type', label:'Type', type:'select', options:['Book Request','Book Reservation','Renewal'] },
        { key:'message', label:'Message', placeholder:'Request details...', type:'textarea' },
        { key:'requestDate', label:'Date', type:'date' },
        { key:'status', label:'Status', type:'select', options:['Pending','Approved','Completed','Rejected','Cancelled'] },
      ],
      fallbackData:[
        { requestId:'REQ001', member:{memberId:'MEM001', name:'Alice Johnson', email:'alice@email.com'}, type:'Book Reservation', message:'Reserve The Great Gatsby.', requestDate:'2024-10-08', status:'Pending' },
        { requestId:'REQ002', member:{memberId:'MEM002', name:'Bob Williams', email:'bob@email.com'}, type:'Book Request', message:'Request Dune by Frank Herbert.', requestDate:'2024-09-25', status:'Approved' },
        { requestId:'REQ003', member:{memberId:'MEM003', name:'Clara Chen', email:'clara@email.com'}, type:'Renewal', message:'Renew current borrowing for one week.', requestDate:'2024-10-01', status:'Completed' },
        { requestId:'REQ004', member:{memberId:'MEM004', name:'David Martinez', email:'david@email.com'}, type:'Book Reservation', message:'Reserve clean science fiction copy.', requestDate:'2024-10-12', status:'Pending' },
        { requestId:'REQ005', member:{memberId:'MEM005', name:'Eva Thompson', email:'eva@email.com'}, type:'Book Reservation', message:'Reserve first available copy.', requestDate:'2024-10-15', status:'Rejected' },
      ]
    }} />
  );
};
export default Requests;
