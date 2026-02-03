import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <div className="flex flex-col min-h-screen font-sans text-(--color-text-primary) bg-(--color-background)">
      <AppRoutes />
    </div>
  );
}

export default App;
