// src/components/Pages/Notifications.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Notifications = () => <CrudPage config={{
  entityName:'Notification', icon:'🔔', gradient:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#ec4899',
  idField:'notificationId', fetchFn:getNotifications, createFn:createNotification, updateFn:updateNotification, deleteFn:deleteNotification,
  canCreate:PERMISSIONS.SEND_NOTIFICATION, canEdit:PERMISSIONS.SEND_NOTIFICATION, canDelete:PERMISSIONS.SEND_NOTIFICATION,
  searchFields:['notificationId','type','status','message'],
  emptyForm:{ notificationId:'', type:'', message:'', sentDate:'', status:'Sent' },
  columns:[
    { header:'ID', render: r => <span style={{ color:'#ec4899', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.notificationId}</span> },
    { header:'Member', render: r => <span style={{ fontSize:'12px' }}>👤 {r.member?.name||'N/A'}</span> },
    { header:'Type', render: r => <span style={{ padding:'2px 10px', borderRadius:'16px', fontSize:'10px', fontWeight:600, background:'rgba(236,72,153,0.1)', color:'#f472b6' }}>{r.type}</span> },
    { header:'Message', render: r => <span style={{ color:'#94a3b8', fontSize:'11px' }}>{r.message?.substring(0,45)}...</span> },
    { header:'Sent', accessor:'sentDate' },
    { header:'Status', render: r => <StatusBadge status={r.status} /> },
  ],
  formFields:[
    { key:'notificationId', label:'ID', placeholder:'NOT006', isId:true },
    { key:'type', label:'Type', placeholder:'Due Date Reminder' },
    { key:'message', label:'Message', placeholder:'Message...', type:'textarea' },
    { key:'sentDate', label:'Sent Date', type:'date' },
    { key:'status', label:'Status', type:'select', options:['Sent','Read'] },
  ],
  fallbackData:[
    { notificationId:'NOT001', member:{name:'Alice Johnson'}, type:'Due Reminder', message:'Book "1984" is due on 2024-10-15.', sentDate:'2024-10-13', status:'Sent' },
    { notificationId:'NOT002', member:{name:'David Martinez'}, type:'Overdue Notice', message:'Book overdue. Fine: $3.50.', sentDate:'2024-09-04', status:'Sent' },
    { notificationId:'NOT003', member:{name:'Bob Williams'}, type:'Approved', message:'"Dune" request approved.', sentDate:'2024-09-28', status:'Read' },
    { notificationId:'NOT004', member:{name:'Clara Chen'}, type:'Renewed', message:'Membership renewed.', sentDate:'2024-10-02', status:'Read' },
    { notificationId:'NOT005', member:{name:'Eva Thompson'}, type:'Ready', message:'"Great Gatsby" ready for pickup.', sentDate:'2024-10-11', status:'Sent' },
  ]
}} />;
export default Notifications;