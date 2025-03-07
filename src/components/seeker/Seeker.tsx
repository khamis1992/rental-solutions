
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSeekerTargets } from '@/hooks/use-seeker-targets';
import { useLocation } from '@/contexts/LocationContext';
import { SeekerTarget } from '@/types/seeker';
import { Plus, Search, MapPin, Bell, Navigation } from 'lucide-react';
import { SeekerMap } from './SeekerMap';
import { SeekerTargetList } from './SeekerTargetList';
import { SeekerAlerts } from './SeekerAlerts';
import { CreateTargetDialog } from './CreateTargetDialog';

export function Seeker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { targets, alerts, isLoading } = useSeekerTargets();
  const { isTracking, requestPermission, permissionStatus } = useLocation();

  const filteredTargets = targets?.filter(target => 
    target.target_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTargets = targets?.filter(target => target.status === 'active') || [];
  const unreadAlerts = alerts?.filter(alert => !alert.is_read) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seeker System</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your targets in real-time
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="h-7 px-3">
            <MapPin className="w-4 h-4 mr-1" />
            {activeTargets.length} Active
          </Badge>
          <Badge variant="secondary" className="h-7 px-3">
            <Bell className="w-4 h-4 mr-1" />
            {unreadAlerts.length} Alerts
          </Badge>
          <Button 
            variant={isTracking ? "secondary" : "default"}
            onClick={requestPermission}
          >
            <Navigation className={`w-4 h-4 mr-2 ${isTracking ? 'text-green-500' : ''}`} />
            {isTracking ? 'Tracking Active' : 'Enable Tracking'}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Target
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12">
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="map">
              <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search targets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {permissionStatus === 'denied' && (
                    <p className="text-sm text-red-500">
                      Please enable location access in your browser settings to use tracking features.
                    </p>
                  )}
                </div>
                <SeekerMap targets={filteredTargets} />
              </div>
            </TabsContent>
            <TabsContent value="list">
              <div className="p-4">
                <div className="mb-4">
                  <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search targets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <SeekerTargetList targets={filteredTargets} />
              </div>
            </TabsContent>
            <TabsContent value="alerts">
              <div className="p-4">
                <SeekerAlerts />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <CreateTargetDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
