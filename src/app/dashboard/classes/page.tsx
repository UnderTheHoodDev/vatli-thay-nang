import { listClasses } from '@/actions/v1/classes/list-classes';
import StudentClassesClient from './StudentClassesClient';

export default async function StudentClassesPage() {
  const result = await listClasses({ page: 1, pageSize: 100 });

  return <StudentClassesClient rows={result.data} errors={result.errors} />;
}
