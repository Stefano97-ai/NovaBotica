import type {ReportData,ReportType} from '../domain/report';
export interface ReportSource {load(type:ReportType,from:string,to:string,signal:AbortSignal):Promise<ReportData>}
