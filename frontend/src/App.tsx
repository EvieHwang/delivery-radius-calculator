import { ThemeToggle } from "./components/ThemeToggle"
import { InputForm } from "./components/InputForm"
import { SummaryBar } from "./components/SummaryBar"
import { ProgressIndicator } from "./components/ProgressIndicator"
import { ResultsTable } from "./components/ResultsTable"
import { ResultsMap } from "./components/ResultsMap"
import { ExportButtons } from "./components/ExportButtons"
import { NewSearchButton } from "./components/NewSearchButton"
import { useQuery } from "./context/QueryContext"
import { MapPin } from "lucide-react"

function AppContent() {
  const { results, isLoading, progress } = useQuery()
  const hasResults = results.length > 0
  const showProgress = isLoading || (progress.phase !== 'idle' && progress.phase !== 'complete')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto flex h-12 items-center justify-between px-4">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Radius Calculator
          </h1>
          <div className="flex items-center gap-2">
            {hasResults && <NewSearchButton />}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {!hasResults ? (
          // Input view
          <div className="mx-auto max-w-lg">
            <InputForm />
            {showProgress && (
              <div className="mt-4">
                <ProgressIndicator />
              </div>
            )}
          </div>
        ) : (
          // Results view
          <div className="space-y-4">
            {/* Summary and Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <SummaryBar />
              <ExportButtons />
            </div>

            {/* Map and Table - responsive layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Map */}
              <div className="lg:order-2">
                <ResultsMap />
              </div>

              {/* Table */}
              <div className="lg:order-1 max-h-[600px] overflow-auto">
                <ResultsTable />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="container mx-auto px-4 py-3 text-center text-xs text-muted-foreground">
          Delivery Radius Calculator • Distance data from GeoNames • Routing by OSRM
        </div>
      </footer>
    </div>
  )
}

function App() {
  return <AppContent />
}

export default App
