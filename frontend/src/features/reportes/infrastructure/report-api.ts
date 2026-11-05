import type {ReportSource} from '../application/report-source';
export const reportSource:ReportSource={async load(type,from,to,signal){
  const query=new URLSearchParams({tipo:type,desde:from,hasta:to});
  const response=await fetch(`/api/reportes/detalle?${query}`,{credentials:'same-origin',cache:'no-store',signal});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'No se pudo consultar el reporte.');return data;
}};
