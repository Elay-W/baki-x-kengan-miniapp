export default function ShopPage() {
  return (
    <main style={pageStyle}>
      <h1>Shop</h1>
      <p>Packs and offers will be here.</p>
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