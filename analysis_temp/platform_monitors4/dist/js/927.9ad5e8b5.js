"use strict";(self["webpackChunkplatform_monitors4"]=self["webpackChunkplatform_monitors4"]||[]).push([[927],{6365:function(e,t,a){a.d(t,{$d:function(){return o},DL:function(){return c},Ex:function(){return u},Kb:function(){return i},Zd:function(){return d},dN:function(){return r}});var n=a(1076);const l="http://67.205.164.216:3000/api/v1";function o(e){return n.Z.post(`${l}/listAccounts`,{cod_cuenta:e})}function i(e,t){return n.Z.post(`${l}/listClients`,{cod_cuenta:e,empresa:t})}function c(e){return n.Z.post(`${l}/createClient`,e)}function r(e){return n.Z.put(`${l}/editClient`,e)}function d(e){return n.Z.post(`${l}/deleteClient`,e)}function u(e){return n.Z.post(`${l}/repeatUser`,{usuario:e})}},3518:function(e,t,a){a.d(t,{bo:function(){return o},cD:function(){return c},di:function(){return i},md:function(){return r}});var n=a(1076);const l="http://67.205.164.216:3000/api/v1";function o(e,t){return n.Z.post(`${l}/allUnits`,{cod_cuenta:e,cod_cliente:t})}function i(e){return n.Z.post(`${l}/createUnits`,e)}function c(e){return n.Z.put(`${l}/editUnits`,e)}function r(e){return n.Z.post(`${l}/deleteUnits`,e)}},3187:function(e,t,a){a.d(t,{Z:function(){return C}});var n=a(3396),l=a(7312),o=a(11),i=a(1888),c=a(1334),r=a(3601),d=a(8521),u=a(9234),s=a(3104),m=a(165),p=a(1328);const f=(0,n._)("span",{class:"px-4 w-full text-center text-blue-400 font-bold title_views"},"Editar vehículo",-1);function v(e,t,a,v,_,g){return(0,n.wg)(),(0,n.j4)(r.B,{modelValue:v.dialog,"onUpdate:modelValue":t[3]||(t[3]=e=>v.dialog=e),width:"500","onClick:outside":v.cancelItem},{default:(0,n.w5)((()=>[(0,n.Wm)(o._,null,{default:(0,n.w5)((()=>[(0,n.Wm)(p.i,null,{default:(0,n.w5)((()=>[f])),_:1}),(0,n.Wm)(i.Z,null,{default:(0,n.w5)((()=>[(0,n.Wm)(d.D,{cols:"12"},{default:(0,n.w5)((()=>[(0,n.Wm)(m.h,{variant:"outlined",label:"Placa","prepend-inner-icon":"mdi-card-bulleted",color:"indigo",modelValue:v.plate,"onUpdate:modelValue":t[0]||(t[0]=e=>v.plate=e),"hide-details":""},null,8,["modelValue"]),(0,n.Wm)(s.G,{label:"Estado",modelValue:v.estado,"onUpdate:modelValue":t[1]||(t[1]=e=>v.estado=e),color:"blue","hide-details":""},null,8,["modelValue"])])),_:1})])),_:1}),(0,n.Wm)(c.h,null,{default:(0,n.w5)((()=>[(0,n.Wm)(u.C),(0,n.Wm)(l.T,{color:"blue-grey-lighten-2",variant:"tonal",onClick:t[2]||(t[2]=e=>v.dialog=!1)},{default:(0,n.w5)((()=>[(0,n.Uk)(" Cancelar ")])),_:1}),(0,n.Wm)(l.T,{color:"blue-lighten-1",variant:"tonal",onClick:v.editItem},{default:(0,n.w5)((()=>[(0,n.Uk)(" Aceptar ")])),_:1},8,["onClick"])])),_:1})])),_:1})])),_:1},8,["modelValue","onClick:outside"])}var _=a(4870),g=a(4239),h={props:{itemEdit:Object,openModal:Boolean},emits:["edit-item","cancel-item"],setup(e,{emit:t}){const a=(0,_.iH)(!1),l=(0,_.iH)(""),o=(0,_.iH)(!1);(0,n.YP)((()=>e.openModal),(e=>{a.value=e})),(0,n.YP)((()=>e.itemEdit),(e=>{0!==Object.keys(e).length&&(l.value=e.item.placa,o.value=e.item.status)}));const i=()=>{t("edit-item",{cod_cuenta:g.Z.state.codcuenta,cod_cliente:g.Z.state.codcliente,cod_unidad:e.itemEdit.item.cod_unidad,placa:l.value,status:o.value}),l.value="",o.value=!1,c()},c=()=>{t("cancel-item")};return{dialog:a,plate:l,estado:o,editItem:i,cancelItem:c}}},w=a(89);const b=(0,w.Z)(h,[["render",v]]);var C=b},8632:function(e,t,a){a.r(t),a.d(t,{default:function(){return z}});var n=a(3396);const l={class:"flex justify-between w-full"},o=(0,n._)("div",null,[(0,n._)("h1",{class:"font-bold text-xl title_poppins pb-5"},"Vehiculos")],-1);function i(e,t,a,i,c,r){const d=(0,n.up)("CreateVehiclesAccountsVue"),u=(0,n.up)("TableVehiclesAccountsVue"),s=(0,n.up)("EditVehiclesVue");return(0,n.wg)(),(0,n.iD)(n.HY,null,[(0,n._)("div",null,[(0,n._)("div",l,[o,(0,n.Wm)(d,{onCreateItem:i.onCreateItem},null,8,["onCreateItem"])]),(0,n.Wm)(u,{desserts:i.listUnitsData,onEditItem:i.onEditItem,onDeleteItem:i.onDeleteItem},null,8,["desserts","onEditItem","onDeleteItem"])]),(0,n.Wm)(s,{openModal:i.editDialog,itemEdit:i.editItem,onCancelItem:t[0]||(t[0]=e=>i.editDialog=!1),onEditItem:i.onUpdateItem},null,8,["openModal","itemEdit","onEditItem"])],64)}var c=a(3518),r=a(6365),d=a(7139),u=a(7312),s=a(7103),m=a(678);const p={class:"flex gap-1 justify-center"},f=["onClick"],v=["onClick"];function _(e,t,a,l,o,i){const c=(0,n.up)("v-data-table");return(0,n.wg)(),(0,n.j4)(c,{headers:o.headers,items:a.desserts,class:"elevation-1 text-sm rounded-lg"},{["item.status"]:(0,n.w5)((({item:e})=>[(0,n.Wm)(s.v,{color:e.status?"green":"red"},{default:(0,n.w5)((()=>[(0,n.Uk)((0,d.zw)(e.status?"Activo":"Desactivado"),1)])),_:2},1032,["color"])])),["item.actions"]:(0,n.w5)((({item:e})=>[(0,n._)("div",p,[(0,n._)("span",{onClick:t=>l.editItem(e)},[(0,n.Wm)(u.T,{icon:"mdi-pencil",size:"small",variant:"text",color:"green"}),(0,n.Wm)(m.N,{activator:"parent",location:"top"},{default:(0,n.w5)((()=>[(0,n.Uk)("Editar")])),_:1})],8,f),(0,n._)("span",{onClick:t=>l.deleteItem(e)},[(0,n.Wm)(u.T,{icon:"mdi-delete-empty",size:"small",variant:"text",color:"red"}),(0,n.Wm)(m.N,{activator:"parent",location:"top"},{default:(0,n.w5)((()=>[(0,n.Uk)("Eliminar")])),_:1})],8,v)])])),_:2},1032,["headers","items"])}var g=a(5470),h={props:{desserts:Array},components:{VDataTable:g.y_},emits:["delete-item","edit-item"],data(){return{headers:[{title:"Empresa",align:"start",key:"empresa"},{title:"Placa",align:"start",key:"placa"},{title:"Fecha creación",align:"start",key:"fecha_creacion"},{title:"Estado",align:"start",key:"status"},{title:"Acción",align:"center",key:"actions"}]}},setup(e,{emit:t}){const a=e=>{t("edit-item",{item:e})},n=e=>{t("delete-item",{item:e})};return{editItem:a,deleteItem:n}}},w=a(89);const b=(0,w.Z)(h,[["render",_]]);var C=b,V=a(11),k=a(1888),W=a(1334),I=a(3601),y=a(8521),Z=a(9234),U=a(3289),E=a(240),D=a(165),A=a(1328);const H=(0,n._)("span",{class:"px-4 w-full text-center text-blue-400 font-bold title_views"},"Crear vehículo",-1);function $(e,t,a,l,o,i){return(0,n.wg)(),(0,n.iD)(n.HY,null,[(0,n.Wm)(u.T,{size:"small",color:"blue",onClick:t[0]||(t[0]=e=>l.dialog=!0)},{default:(0,n.w5)((()=>[(0,n.Wm)(U.t,{icon:"mdi-plus"}),(0,n.Uk)(" Crear Nuevo")])),_:1}),(0,n.Wm)(I.B,{modelValue:l.dialog,"onUpdate:modelValue":t[4]||(t[4]=e=>l.dialog=e),width:"500"},{default:(0,n.w5)((()=>[(0,n.Wm)(V._,null,{default:(0,n.w5)((()=>[(0,n.Wm)(A.i,null,{default:(0,n.w5)((()=>[H])),_:1}),(0,n.Wm)(k.Z,null,{default:(0,n.w5)((()=>[(0,n.Wm)(y.D,{cols:"12"},{default:(0,n.w5)((()=>[(0,n.Wm)(E.rL,{"prepend-inner-icon":"mdi-domain",label:"Empresa",items:l.clientsAdmin.map((e=>e.empresa)),variant:"outlined",class:"col-span-2",color:"indigo",modelValue:l.business,"onUpdate:modelValue":t[1]||(t[1]=e=>l.business=e)},null,8,["items","modelValue"]),(0,n.Wm)(D.h,{variant:"outlined",label:"Placa","prepend-inner-icon":"mdi-card-bulleted",color:"indigo",modelValue:l.plate,"onUpdate:modelValue":t[2]||(t[2]=e=>l.plate=e)},null,8,["modelValue"])])),_:1})])),_:1}),(0,n.Wm)(W.h,null,{default:(0,n.w5)((()=>[(0,n.Wm)(Z.C),(0,n.Wm)(u.T,{color:"blue-grey-lighten-2",variant:"tonal",onClick:t[3]||(t[3]=e=>l.dialog=!1)},{default:(0,n.w5)((()=>[(0,n.Uk)(" Cancelar ")])),_:1}),(0,n.Wm)(u.T,{color:"blue-lighten-1",variant:"tonal",onClick:l.createItem},{default:(0,n.w5)((()=>[(0,n.Uk)(" Aceptar ")])),_:1},8,["onClick"])])),_:1})])),_:1})])),_:1},8,["modelValue"])],64)}var x=a(4870),T=a(4239),M={emits:["create-item"],setup(e,{emit:t}){const a=(0,x.iH)(!1),l=(0,x.iH)(""),o=(0,x.iH)(""),i=(0,x.iH)([]);(0,n.YP)((()=>a.value),(async e=>{if(1==e){const e=await(0,r.$d)(T.Z.state.codcuenta),t=e.data.data[0].clientes?e.data.data[0].clientes:[];i.value=t.filter((e=>"Administrador"==e.rol))}}));const c=()=>{const e=new Date,n=e.getDate().toString().padStart(2,"0"),c=(e.getMonth()+1).toString().padStart(2,"0"),r=e.getFullYear(),d=`${n}-${c}-${r}`;t("create-item",{cod_cuenta:T.Z.state.codcuenta,cod_cliente:i.value.find((e=>e.empresa==o.value)).cod_cliente,cod_unidad:"",fecha_creacion:d,placa:l.value,status:!0}),l.value="",a.value=!1};return{dialog:a,plate:l,business:o,clientsAdmin:i,createItem:c}}};const N=(0,w.Z)(M,[["render",$]]);var P=N,S=a(3187),j=a(3512),Y={components:{TableVehiclesAccountsVue:C,CreateVehiclesAccountsVue:P,EditVehiclesVue:S.Z},setup(){const e=(0,x.iH)([]),t=(0,x.iH)({}),a=(0,x.iH)(!1),l=(0,x.iH)("");(0,n.bv)((async()=>{await o()}));const o=async()=>{const[t,a]=await Promise.all([(0,c.bo)(T.Z.state.codcuenta,T.Z.state.codclienteAdmin),(0,r.$d)(T.Z.state.codcuenta)]),n=a.data.data[0].clientes?a.data.data[0].clientes:[];l.value=n.filter((e=>"Administrador"==e.rol));const o=t.data.data?t.data.data:[];e.value=o.flatMap((e=>{const t=l.value.find((t=>t.cod_cliente==e.cod_cliente)),a=e.unidades.map((e=>({...e,empresa:t.empresa})));return a}))},i=e=>{""!=e.placa?(0,c.di)(e).then((()=>{(0,j.y)((async()=>{await o()}),"success","Logrado","Se ha registrado el vehiculo correctamente")})).catch((()=>{(0,j.y)((()=>{}),"error","Hubo un error","No se logro registrar el vehiculo")})):(0,j.y)((()=>{}),"warning","Advertencia","Rellene todos los campos")},d=e=>{const t={placa:e.item.placa,cod_unidad:e.item.cod_unidad,cod_cuenta:T.Z.state.codcuenta,cod_cliente:l.value.find((t=>t.empresa==e.item.empresa)).cod_cliente};(0,j.M)((async()=>{await(0,c.md)(t).then((()=>{(0,j.y)((async()=>{await o()}),"success","Logrado","Se ha eliminado el vehículo correctamente")})).catch((e=>{console.log(e),(0,j.y)((()=>{}),"error","Hubo un error","No se logro eliminar")}))}),"¿Estás seguro de eliminar este vehículo?","Aceptar")},u=e=>{t.value=e,a.value=!0},s=e=>{e.cod_cliente=l.value.find((e=>e.empresa==t.value.item.empresa)).cod_cliente,(0,c.cD)(e).then((()=>{(0,j.y)((async()=>{await o()}),"success","Logrado","Se ha editado el vehículo correctamente")})).catch((()=>{(0,j.y)((()=>{}),"error","Hubo un error","No se logro editar el vehículo")}))};return{listUnitsData:e,editDialog:a,editItem:t,onUpdateItem:s,onDeleteItem:d,onCreateItem:i,onEditItem:u}}};const L=(0,w.Z)(Y,[["render",i]]);var z=L}}]);
//# sourceMappingURL=927.9ad5e8b5.js.map