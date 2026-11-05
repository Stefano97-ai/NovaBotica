import { ReportesView } from '../presentation/pages/reportes.page';
import { reportSource } from '../infrastructure/report-api';
import { downloadTable } from '../../../shared/infrastructure/table-export';
export default function ReportesPage() { return <ReportesView source={reportSource} exportTable={downloadTable} />; }