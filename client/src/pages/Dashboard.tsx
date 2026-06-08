import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Mail, MapPin, BarChart3, DollarSign, Plus, Settings, LogOut,
  Loader2, Package, TrendingUp, ArrowRight, FileSpreadsheet,
  CloudLightning, Truck,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  measuring: "bg-yellow-100 text-yellow-700",
  ready: "bg-blue-100 text-blue-700",
  ordered: "bg-violet-100 text-violet-700",
  printing: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();

  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, { enabled: isAuthenticated });
  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.list.useQuery(undefined, { enabled: isAuthenticated });

  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("New campaign created");
      utils.campaigns.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: () => toast.error("Failed to create campaign"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to QuoteMail</h2>
          <p className="text-slate-500 mb-6">Access your contractor dashboard and campaigns.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Q Mails Sent",
      value: statsLoading ? "—" : (stats?.totalAddresses ?? 0).toLocaleString(),
      icon: Mail,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Campaigns",
      value: statsLoading ? "—" : (stats?.totalCampaigns ?? 0).toString(),
      icon: Package,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Total Addresses",
      value: statsLoading ? "—" : (stats?.totalAddresses ?? 0).toLocaleString(),
      icon: MapPin,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Est. Pipeline Value",
      value: statsLoading ? "—" : `$${(stats?.totalSpend ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg">QuoteMail</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <MapPin className="w-4 h-4" /> New Campaign
            </Button>
          </Link>
          <Link href="/storm-data">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <CloudLightning className="w-4 h-4" /> Storm Data
            </Button>
          </Link>
          <Link href="/fulfillment">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <Truck className="w-4 h-4" /> Fulfillment
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="gap-2 text-slate-600" onClick={() => logout()}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </nav>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-slate-500 mt-0.5">Here is your QuoteMail overview.</p>
          </div>
          <Button
            onClick={() => createCampaign.mutate({ name: `Campaign ${new Date().toLocaleDateString()}` })}
            disabled={createCampaign.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {createCampaign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="pt-5 pb-4">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 font-mono">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">Your Campaigns</CardTitle>
              <Link href="/app">
                <Button variant="ghost" size="sm" className="text-blue-600 gap-1 text-xs">
                  New <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {campaignsLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns...
              </div>
            ) : !campaigns || campaigns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium mb-1">No campaigns yet</p>
                <p className="text-slate-400 text-sm mb-4">Create your first campaign to start targeting homeowners.</p>
                <Link href="/app">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <MapPin className="w-4 h-4" /> Start Targeting
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {campaigns.map(c => (
                  <Link key={c.id} href={`/app?campaign=${c.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                          <p className="text-xs text-slate-400">
                            {c.totalAddresses ?? 0} addresses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                
                        <Badge className={`text-xs ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {c.status}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: MapPin, color: "bg-blue-50 text-blue-600", title: "Pin Drop Targeting", desc: "Click on the satellite map to add individual addresses to a campaign.", href: "/app", cta: "Open Map" },
            { icon: FileSpreadsheet, color: "bg-violet-50 text-violet-600", title: "CSV Bulk Import", desc: "Upload a CSV file with hundreds of addresses from storm data or permit records.", href: "/app", cta: "Import CSV" },
            { icon: CloudLightning, color: "bg-orange-50 text-orange-600", title: "Storm Event Targeting", desc: "Browse active NOAA hail and wind alerts to find neighborhoods that need roofing now.", href: "/storm-data", cta: "View Alerts" },
            { icon: Truck, color: "bg-teal-50 text-teal-600", title: "Fulfillment Status", desc: "Track your Q Mail batches from print to delivery via The Addressers.", href: "/fulfillment", cta: "Track Batches" },
            { icon: Settings, color: "bg-emerald-50 text-emerald-600", title: "Set Pitch Rates", desc: "Configure your $/square pricing for each pitch tier before generating estimates.", href: "/settings", cta: "Configure" },
          ].map((a, i) => (
            <Card key={i} className="border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
              <CardContent className="pt-5 pb-5">
                <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center mb-3`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{a.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{a.desc}</p>
                <Link href={a.href}>
                  <Button variant="outline" size="sm" className="text-xs gap-1 border-slate-200">
                    {a.cta} <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
