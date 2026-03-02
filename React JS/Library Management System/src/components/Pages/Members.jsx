// src/components/Pages/Members.jsx
import React from 'react';
import { PERMISSIONS } from '../../auth/permissions';
import { getMembers, createMember, updateMember, deleteMember } from '../../api/api';
import StatusBadge from '../Common/StatusBadge';
import CrudPage from './CrudPage';

const Members = () => (
  <CrudPage config={{
    entityName:'Member', icon:'👥', gradient:'linear-gradient(135deg,#10b981,#34d399)', color:'#10b981',
    idField:'memberId', fetchFn:getMembers, createFn:createMember, updateFn:updateMember, deleteFn:deleteMember,
    canCreate:PERMISSIONS.CREATE_MEMBER, canEdit:PERMISSIONS.EDIT_MEMBER, canDelete:PERMISSIONS.DELETE_MEMBER,
    searchFields:['memberId','name','email','status'],
    emptyForm:{ memberId:'', name:'', email:'', phone:'', membershipDate:'', status:'Active' },
    columns:[
      { header:'ID', render: r => <span style={{ color:'#10b981', fontWeight:700, fontFamily:'monospace', fontSize:'11px' }}>{r.memberId}</span> },
      { header:'Member', render: r => (
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'9px', background:`linear-gradient(135deg, hsl(${(r.name?.charCodeAt(0)||0)*3},65%,55%), hsl(${(r.name?.charCodeAt(0)||0)*3+50},65%,45%))`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'white' }}>{r.name?.[0]}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:'12px' }}>{r.name}</div>
            <div style={{ fontSize:'10px', color:'#64748b' }}>{r.email}</div>
          </div>
        </div>
      )},
      { header:'Phone', render: r => <span style={{ color:'#94a3b8', fontSize:'12px' }}>{r.phone}</span> },
      { header:'Since', accessor:'membershipDate' },
      { header:'Status', render: r => <StatusBadge status={r.status} /> },
    ],
    formFields:[
      { key:'memberId', label:'Member ID', placeholder:'MEM006', isId:true },
      { key:'name', label:'Full Name', placeholder:'John Doe' },
      { key:'email', label:'Email', placeholder:'john@email.com', type:'email' },
      { key:'phone', label:'Phone', placeholder:'555-0106', required:false },
      { key:'membershipDate', label:'Member Since', type:'date' },
      { key:'status', label:'Status', type:'select', options:['Active','Inactive'] },
    ],
    fallbackData:[
      { memberId:'MEM001', name:'Alice Johnson', email:'alice@email.com', phone:'555-0101', membershipDate:'2023-01-15', status:'Active' },
      { memberId:'MEM002', name:'Bob Williams', email:'bob@email.com', phone:'555-0102', membershipDate:'2023-03-22', status:'Active' },
      { memberId:'MEM003', name:'Clara Chen', email:'clara@email.com', phone:'555-0103', membershipDate:'2022-11-08', status:'Active' },
      { memberId:'MEM004', name:'David Martinez', email:'david@email.com', phone:'555-0104', membershipDate:'2024-01-10', status:'Inactive' },
      { memberId:'MEM005', name:'Eva Thompson', email:'eva@email.com', phone:'555-0105', membershipDate:'2023-06-30', status:'Active' },
    ]
  }} />
);
export default Members;