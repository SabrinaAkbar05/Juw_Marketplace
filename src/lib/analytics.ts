import type {Product,Order,CustomerRecord,SellerRecord,SupportTicket} from '../types';
export function buildAnalytics(products:Product[],orders:Order[],customers:CustomerRecord[],sellers:SellerRecord[],tickets:SupportTicket[]){
 const completed=orders.filter(o=>o.status==='DELIVERED');
 const totalRevenue=completed.reduce((sum,o)=>sum+(Number(o.total)||0),0);
 const monthKeys=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));return {key:d.toISOString().slice(0,7),month:d.toLocaleString('en-US',{month:'short'})}});
 const monthlySalesData=monthKeys.map(({key,month})=>{const matching=completed.filter(o=>o.createdAt?.startsWith(key));return {month,revenue:matching.reduce((s,o)=>s+(Number(o.total)||0),0),orders:matching.length}});
 const previous=monthlySalesData.at(-2)?.revenue||0,current=monthlySalesData.at(-1)?.revenue||0;
 const monthlyGrowth=previous>0?Math.round(((current-previous)/previous)*1000)/10:0;
 const categoryTotals=new Map<string,number>();for(const o of completed)for(const item of o.items){categoryTotals.set(item.category,(categoryTotals.get(item.category)||0)+item.price*item.quantity)}
 const categoryPerformance=[...categoryTotals].map(([category,revenue])=>({category,revenue,percentage:totalRevenue?Math.round(revenue/totalRevenue*100):0}));
 const departments=new Map<string,{studentCount:number,salesVolume:number}>();for(const s of sellers){const department=s.department||'Unspecified';const entry=departments.get(department)||{studentCount:0,salesVolume:0};entry.studentCount++;departments.set(department,entry)}
 for(const o of completed)for(const item of o.items){const s=sellers.find(x=>x.id===item.sellerId);if(s){const entry=departments.get(s.department)||{studentCount:0,salesVolume:0};entry.salesVolume+=item.price*item.quantity;departments.set(s.department,entry)}}
 return {totalRevenue,monthlyGrowth,totalOrders:orders.length,activeCustomers:customers.filter(c=>c.status==='ACTIVE').length,registeredSellers:sellers.length,approvedProducts:products.filter(p=>p.status==='ACTIVE').length,pendingApprovalsCount:products.filter(p=>p.status==='PENDING').length,openDisputesCount:tickets.filter(t=>t.status==='OPEN'||t.status==='IN_PROGRESS').length,monthlySalesData,categoryPerformance,departmentBreakdown:[...departments].map(([department,item])=>({department,studentCount:item.studentCount,salesVolume:`Rs. ${item.salesVolume.toLocaleString()}`}))};
}
