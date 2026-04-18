export default function DeckPage() {
  return (
    <main style={pageStyle}>
      <h1>Deck</h1>
      <p>Your battle deck will be here.</p>
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