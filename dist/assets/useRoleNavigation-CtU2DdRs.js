import{c as y,f as n,k as u,m as o,a as b,r as c}from"./index-DHRYP3hj.js";import{e as T,r as k,v as h}from"./roleNavigation-cVwAQvrV.js";/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]],N=y("download",g);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],D=y("file-text",v);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}]],F=y("pen",M);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]],V=y("search",P);/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]],x=y("trending-up",A),L={async getFiles(s){const e=await n(`/patients/${s}/files`),t=o(e);return Array.isArray(t)?t:[]},async getFile(s,e){const t=await n(`/patients/${s}/files/${e}`);return o(t)},async getSessions(s){const e=await n(`/patient-files/${s}/sessions`),t=o(e);return Array.isArray(t)?t:[]},async createSession(s,e){const t=await n(`/patient-files/${s}/sessions`,{method:"POST",body:e});return o(t)},async updateSession(s,e,t){const i=await n(`/patient-files/${s}/sessions/${e}`,{method:"PUT",body:t});return o(i)},async deleteSession(s,e){await n(`/patient-files/${s}/sessions/${e}`,{method:"DELETE"})},async getPhotos(s){const e=await n(`/patient-files/${s}/photos`),t=o(e);return Array.isArray(t)?t:[]},async uploadPhoto(s,e,t,i,a){const r=new FormData;return r.append("photo",e),r.append("type",t),i&&r.append("notes",i),a&&r.append("session_id",a),u(`/patient-files/${s}/photos`,r)},async deletePhoto(s,e){await n(`/patient-files/${s}/photos/${e}`,{method:"DELETE"})},async getPrescriptions(s){const e=await n(`/patient-files/${s}/prescriptions`),t=o(e);return Array.isArray(t)?t:[]},async createPrescription(s,e){const t=await n(`/patient-files/${s}/prescriptions`,{method:"POST",body:e});return o(t)},async updatePrescription(s,e,t){const i=await n(`/patient-files/${s}/prescriptions/${e}`,{method:"PUT",body:t});return o(i)},async deletePrescription(s,e){await n(`/patient-files/${s}/prescriptions/${e}`,{method:"DELETE"})},async getAttachments(s){const e=await n(`/patient-files/${s}/attachments`),t=o(e);return Array.isArray(t)?t:[]},async uploadAttachment(s,e,t,i){const a=new FormData;return a.append("file",e),t&&a.append("name",t),i&&a.append("session_id",i),u(`/patient-files/${s}/attachments`,a)},async deleteAttachment(s,e){await n(`/patient-files/${s}/attachments/${e}`,{method:"DELETE"})}};function O(s){const{user:e}=b(),t=(e==null?void 0:e.moduleVisibility)??{},i=(e==null?void 0:e.permissions)??T(),a=c.useMemo(()=>JSON.stringify(t),[t]),r=c.useMemo(()=>JSON.stringify(i),[i]),p=c.useMemo(()=>JSON.parse(a),[a]),l=c.useMemo(()=>JSON.parse(r),[r]),d=c.useMemo(()=>k(s,p,l),[s,p,l]),f=c.useMemo(()=>h(s,p,l,"sidebar"),[s,p,l]),w=c.useMemo(()=>h(s,p,l,"footer"),[s,p,l]);return{moduleVisibility:p,permissions:l,allTabs:d,sidebarTabs:f,footerTabs:w,isTabVisible:$=>d.some(m=>m.id===$&&m.visible)}}function q(s,e,t){const i=t.map(a=>a.id).join("|");c.useEffect(()=>{const a=i?i.split("|"):[];a.length!==0&&(a.includes(s)||e(a[0]))},[s,e,i])}export{N as D,D as F,F as P,V as S,x as T,q as a,L as p,O as u};
