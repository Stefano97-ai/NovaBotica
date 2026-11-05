export interface ProductRecord {
  id:number;codigo:string;nombre:string;categoriaId:number;categoriaNombre:string;unidadBase:string;
  precioVenta:number;stockMinimo:number;stockDisponible:number;activo:boolean;requiereSerie:boolean;imagenUrl:string|null;
}
export async function productRequest<T>(path:string,method:string,body:BodyInit){
  const response=await fetch(`/api/productos/${path}`,{method,credentials:'same-origin',headers:body instanceof FormData?{'X-Nova-Client':'web'}:{'Content-Type':'application/json','X-Nova-Client':'web'},body,signal:AbortSignal.timeout(30000)});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||'No se pudo guardar el producto.');return data as T;
}
export function editProduct(id:number,data:unknown,image:File|null){const form=new FormData();form.append('datos',new Blob([JSON.stringify(data)],{type:'application/json'}));if(image)form.append('imagen',image);return productRequest<ProductRecord>(`${id}/edicion`,'POST',form);}
export function changeProductStatus(id:number,activo:boolean){return productRequest<ProductRecord>(`${id}/activo`,'PATCH',JSON.stringify({activo}));}
