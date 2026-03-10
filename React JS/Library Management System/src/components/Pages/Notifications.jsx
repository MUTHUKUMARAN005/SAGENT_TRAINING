// src/components/Pages/Notifications.jsx
import React, { useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS } from '../../auth/permissions';
import { getNotifications, createNotification, updateNotification, deleteNotification } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Notifications = () => {
  const { checkPermission } = useAuth();
  const canViewAllNotifications = checkPermission(PERMISSIONS.VIEW_NOTIFICATIONS);

  const filterNotificationsByRole = useCallback((rows, currentUser) => {
    if (canViewAllNotifications) return rows;
    if (!currentUser) return [];

    const currentEmail = currentUser.email?.toLowerCase();

    return rows.filter((notification) => (
      (currentUser.memberId && notification.member?.memberId === currentUser.memberId) ||
      (currentEmail && notification.member?.email?.toLowerCase() === currentEmail)
    ));
  }, [canViewAllNotifications]);

  return (
    <CrudPage config={{
      entityName:'Notification', icon:'NT', gradient:'linear-gradient(135deg,#ec4899,#f472b6)', color:'#ec4899',
      idField:'notificationId', fetchFn:getNotifications, createFn:createNotification, updateFn:updateNotification, deleteFn:deleteNotification,
      canCreate:PERMISSIONS.SEND_NOTIFICATION, canEdit:PERMISSIONS.SEND_NOTIFICATION, canDelete:PERMISSIONS.SEND_NOTIFICATION,
      filterData: filterNotificationsByRole,
      searchFields:['notificationId','type','status','message'],
      emptyForm:{ notificationId:'', type:'', message:'', sentDate:'', status:'Sent' },
      columns:[
        { header:'ID', render: r => <span style={{ color:'#ec4899', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.notificationId}</span> },
        { header:'Member', render: r => <span style={{ fontSize:'12px' }}>{r.member?.name||'N/A'}</span> },
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
        { notificationId:'NOT001', member:{memberId:'MEM001', name:'Alice Johnson', email:'alice@email.com'}, type:'Due Date Reminder', message:'Your issued book "1984" is due on 2024-10-15.', sentDate:'2024-10-13', status:'Sent' },
        { notificationId:'NOT002', member:{memberId:'MEM004', name:'David Martinez', email:'david@email.com'}, type:'Fine Notification', message:'Your account has an overdue fine of $3.50.', sentDate:'2024-09-04', status:'Sent' },
        { notificationId:'NOT003', member:{memberId:'MEM002', name:'Bob Williams', email:'bob@email.com'}, type:'Book Approval', message:'Your request for "Dune" has been approved.', sentDate:'2024-09-28', status:'Read' },
        { notificationId:'NOT004', member:{memberId:'MEM003', name:'Clara Chen', email:'clara@email.com'}, type:'Due Date Reminder', message:'Please return "Pride and Prejudice" by 2024-10-19.', sentDate:'2024-10-16', status:'Read' },
        { notificationId:'NOT005', member:{memberId:'MEM005', name:'Eva Thompson', email:'eva@email.com'}, type:'Book Approval', message:'Your reservation is ready for pickup.', sentDate:'2024-10-11', status:'Sent' },
      ]
    }} />
  );
};
export default Notifications;
