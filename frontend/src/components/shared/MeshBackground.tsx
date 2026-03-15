

interface Props {
  theme: string;
}

export default function MeshBackground({ theme }: Props) {
  return (
    <div className={`mesh-bg mesh-${theme}`}>
      <div className="mesh-blob" />
    </div>
  );
}
