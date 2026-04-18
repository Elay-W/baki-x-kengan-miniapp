export default function BattlePage() {
  return (
    <main style={pageStyle}>
      <h1>Battle</h1>
      <p>The arena will be here.</p>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#050505",
  color: "white",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
};