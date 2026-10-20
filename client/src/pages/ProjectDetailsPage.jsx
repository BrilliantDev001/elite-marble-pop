import { useParams } from "react-router-dom";
import PageStub from "../components/shared/PageStub";

export default function ProjectDetailsPage() {
  const { slug } = useParams(); // the part of the URL after /gallery/
  return <PageStub title="Project" note={`Project page for: ${slug}`} />;
}
