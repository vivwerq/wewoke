import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, AlertTriangle, User, Calendar } from "lucide-react";
import { reportsAPI } from "@/lib/api";

interface Report {
  id: string;
  category: string;
  description: string;
  created_at: string;
  resolved: boolean;
  reporter: { username: string };
  reported_user: { username: string; avatar_url?: string };
}

const Moderation = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    loadReports(false);
  }, []);

  const loadReports = async (resolved: boolean) => {
    setLoading(true);
    try {
      const data = await reportsAPI.getReports(resolved);
      setReports(data.reports || []);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string) => {
    try {
      // TODO: Replace with actual authentication context
      // Example: const { user } = useAuth();
      // const userId = user?.id || '';
      const userId = "admin-user-id"; // Get from auth context
      await reportsAPI.resolveReport(reportId, userId);
      // Reload reports
      loadReports(activeTab === "resolved");
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "harassment": return "destructive";
      case "nudity": return "destructive";
      case "violence": return "destructive";
      case "spam": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      
      <header className="relative border-b border-border glass-morphism">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Moderation Dashboard</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          loadReports(v === "resolved");
        }}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="resolved">
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolved
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {loading ? (
              <Card className="glass-morphism p-8 text-center">
                <p className="text-muted-foreground">Loading reports...</p>
              </Card>
            ) : reports.length === 0 ? (
              <Card className="glass-morphism p-8 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">No pending reports</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="glass-morphism p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.reported_user.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          Reported by {report.reporter.username}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getCategoryColor(report.category) as "destructive" | "secondary" | "outline"}>
                      {report.category}
                    </Badge>
                  </div>

                  {report.description && (
                    <p className="text-sm mb-4 text-muted-foreground">{report.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(report.id)}
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4 mt-6">
            {loading ? (
              <Card className="glass-morphism p-8 text-center">
                <p className="text-muted-foreground">Loading reports...</p>
              </Card>
            ) : reports.length === 0 ? (
              <Card className="glass-morphism p-8 text-center">
                <p className="text-muted-foreground">No resolved reports</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="glass-morphism p-6 opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.reported_user.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          Reported by {report.reporter.username}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolved
                    </Badge>
                  </div>

                  {report.description && (
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  )}
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Moderation;
