import { ApplicationForm } from '@/components/application-form/application-form';

interface EditarSolicitudPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditarSolicitudPage({ params }: EditarSolicitudPageProps) {
  const { id } = await params;
  return <ApplicationForm applicationId={id} />;
}
