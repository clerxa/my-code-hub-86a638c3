import { useParams } from "react-router-dom";
import { useProspectPresentationByToken } from "@/hooks/useProspectPresentations";
import { PresentationViewer } from "@/components/presentations/PresentationViewer";

export default function ProspectPresentation() {
  const { token } = useParams<{ token: string }>();
  const { data: presentation, isLoading, error } = useProspectPresentationByToken(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
      </div>
    );
  }

  if (error || !presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Présentation non trouvée</h1>
          <p className="text-gray-400">Ce lien est invalide ou la présentation n'est pas publiée.</p>
        </div>
      </div>
    );
  }

  return <PresentationViewer presentation={presentation} />;
}
