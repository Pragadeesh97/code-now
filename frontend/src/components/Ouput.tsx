export const Output = ({ project_name }: { project_name: string }) => {
  const INSTANCE_URI = `http://${project_name}.pragadeesh97.com/output`;
  return (
    <div style={{ height: "40vh", background: "white" }}>
      <iframe width={"100%"} height={"100%"} src={`${INSTANCE_URI}`} />
    </div>
  );
};
