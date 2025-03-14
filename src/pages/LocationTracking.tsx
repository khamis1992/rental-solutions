import { useEffect, useRef, useState } from "react";
import { useLocation } from "@/contexts/LocationContext";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Focus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GeofenceManager } from "@/components/geofencing/GeofenceManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VisitorAnalyticsDashboard } from "@/components/analytics/VisitorAnalyticsDashboard";

const INACTIVE_THRESHOLD = 5 * 60 * 1000;
const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

interface LocationRecord {
  id: string;
  user_id: string;
  full_name: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  device_info: any;
  connection_status: string;
  created_at: string;
  updated_at: string;
  last_updated: string;
  last_pull_timestamp: string;
  profiles?: {
    full_name: string | null;
  }
}

const generateUserColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const getLocationFreshness = (lastUpdated: string) => {
  const ageInMinutes = (new Date().getTime() - new Date(lastUpdated).getTime()) / (1000 * 60);
  if (ageInMinutes < 60) return 'bg-green-500';
  if (ageInMinutes < 120) return 'bg-yellow-500';
  return 'bg-red-500';
};

const LocationTracking = () => {
  const { isTracking, error, permissionStatus, requestPermission } = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [followMode, setFollowMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: mapboxToken } = useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      return data.token;
    }
  });

  const { data: locations, refetch: refetchLocations } = useQuery<LocationRecord[]>({
    queryKey: ["user-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('latest_user_locations')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: REFRESH_INTERVAL
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchLocations();
      toast.success('Location data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh location data');
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLocations = locations?.filter(loc => {
    const name = loc.profiles?.full_name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  const selectedLocation = locations?.find(loc => loc.user_id === selectedUserId);

  const focusOnUser = (userId: string) => {
    const location = locations?.find(loc => loc.user_id === userId);
    if (location && map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        duration: 1000
      });

      // Open popup for selected user
      markersRef.current[userId]?.togglePopup();
    }
  };

  useEffect(() => {
    if (followMode && selectedLocation && map.current) {
      map.current.flyTo({
        center: [selectedLocation.longitude, selectedLocation.latitude],
        duration: 1000
      });
    }
  }, [selectedLocation, followMode]);

  useEffect(() => {
    // Subscribe to realtime updates
    const channel = supabase
      .channel('user-locations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_locations'
        },
        (payload) => {
          console.log('Realtime update:', payload);
          // Trigger a refetch when locations change
          queryClient.invalidateQueries({ queryKey: ['user-locations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [51.5074, 25.2867], // Default to Doha coordinates
        zoom: 12
      });

      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      newMap.on('load', () => {
        map.current = newMap;
        setMapLoaded(true);
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      toast.error('Failed to initialize map');
    }

    return () => {
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!mapLoaded || !map.current || !locations) return;

    const updatedMarkers = new Set<string>();

    locations.forEach((location) => {
      const userId = location.user_id;
      const isActive = new Date().getTime() - new Date(location.last_updated).getTime() < INACTIVE_THRESHOLD;
      const isSelected = selectedUserId === userId;
      
      if (!isActive) {
        if (markersRef.current[userId]) {
          markersRef.current[userId].remove();
          delete markersRef.current[userId];
        }
        return;
      }

      updatedMarkers.add(userId);
      const userColor = generateUserColor(userId);

      if (!markersRef.current[userId]) {
        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.width = isSelected ? '30px' : '20px';
        el.style.height = isSelected ? '30px' : '20px';
        el.style.backgroundColor = userColor;
        el.style.borderRadius = '50%';
        el.style.border = isSelected ? '3px solid white' : '2px solid white';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.3s ease';
        
        if (isSelected) {
          el.style.boxShadow = '0 0 0 8px rgba(255,255,255,0.4)';
        }

        const marker = new mapboxgl.Marker(el)
          .setLngLat([location.longitude, location.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div>
                  <strong>${location.profiles?.full_name || 'Unknown User'}</strong>
                  <p>Updated ${formatDistanceToNow(new Date(location.last_updated), { addSuffix: true })}</p>
                  <p>Status: ${location.connection_status}</p>
                </div>
              `)
          )
          .addTo(map.current);

        markersRef.current[userId] = marker;
      } else {
        const el = markersRef.current[userId].getElement();
        el.style.width = isSelected ? '30px' : '20px';
        el.style.height = isSelected ? '30px' : '20px';
        el.style.border = isSelected ? '3px solid white' : '2px solid white';
        el.style.boxShadow = isSelected ? '0 0 0 8px rgba(255,255,255,0.4)' : 'none';
        
        markersRef.current[userId]
          .setLngLat([location.longitude, location.latitude])
          .getPopup()
          .setHTML(`
            <div>
              <strong>${location.profiles?.full_name || 'Unknown User'}</strong>
              <p>Updated ${formatDistanceToNow(new Date(location.last_updated), { addSuffix: true })}</p>
              <p>Status: ${location.connection_status}</p>
            </div>
          `);
      }
    });

    Object.keys(markersRef.current).forEach(userId => {
      if (!updatedMarkers.has(userId)) {
        markersRef.current[userId].remove();
        delete markersRef.current[userId];
      }
    });

  }, [locations, mapLoaded, selectedUserId]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Location Tracking</h1>
        <div className="flex items-center gap-2">
          {permissionStatus === 'prompt' && (
            <Button
              variant="default"
              size="sm"
              onClick={requestPermission}
            >
              Enable Tracking
            </Button>
          )}
          <Badge 
            variant={isTracking ? "success" : "destructive"}
            className="px-3 py-1"
          >
            {isTracking ? "Active" : "Inactive"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {permissionStatus === 'denied' && (
        <Card className="p-4 border-destructive bg-destructive/10 mb-4">
          <div className="flex items-start gap-2">
            <div className="text-sm">
              <p className="font-semibold text-destructive">Location Access Required</p>
              <p className="text-muted-foreground">
                Location tracking is disabled. To enable tracking:
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click the location icon in your browser's address bar</li>
                  <li>Select "Allow" for location access</li>
                  <li>Refresh the page</li>
                </ol>
              </p>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="tracking">
        <TabsList>
          <TabsTrigger value="tracking">Location Tracking</TabsTrigger>
          <TabsTrigger value="geofencing">Geofencing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracking" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select
                value={selectedUserId || "all"}
                onValueChange={(value) => {
                  setSelectedUserId(value === "all" ? null : value);
                  if (value !== "all") focusOnUser(value);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {filteredLocations?.filter(loc => 
                    new Date().getTime() - new Date(loc.last_updated).getTime() < INACTIVE_THRESHOLD
                  ).map((location) => (
                    <SelectItem key={location.user_id} value={location.user_id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: generateUserColor(location.user_id) }}
                        />
                        {location.profiles?.full_name || 'Unknown'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFollowMode(!followMode)}
                  className={followMode ? "bg-primary text-primary-foreground" : ""}
                >
                  {followMode ? "Following" : "Follow"}
                </Button>
              )}
            </div>

            <Card className="w-full h-[400px] overflow-hidden">
              <div className="w-full h-full" ref={mapContainer}>
                {!mapboxToken && (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="mt-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Active Users</h2>
                  <div className="text-sm text-muted-foreground">
                    Last updated: {locations && locations.length > 0 ? 
                      format(new Date(locations[0].last_pull_timestamp), 'dd/MM/yyyy HH:mm:ss') : 
                      'Never'}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Latitude</TableHead>
                        <TableHead>Longitude</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Update</TableHead>
                        <TableHead>Freshness</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLocations?.filter(loc => 
                        new Date().getTime() - new Date(loc.last_updated).getTime() < INACTIVE_THRESHOLD
                      ).map((location) => (
                        <TableRow 
                          key={location.id}
                          className={selectedUserId === location.user_id ? "bg-muted/50" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: generateUserColor(location.user_id) }}
                              />
                              {location.profiles?.full_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>{location.latitude.toFixed(6)}</TableCell>
                          <TableCell>{location.longitude.toFixed(6)}</TableCell>
                          <TableCell>
                            <Badge variant={location.connection_status === 'active' ? 'success' : 'secondary'}>
                              {location.connection_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger>
                                {formatDistanceToNow(new Date(location.last_updated), { addSuffix: true })}
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(new Date(location.last_updated), 'dd/MM/yyyy HH:mm:ss')}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className={`w-3 h-3 rounded-full ${getLocationFreshness(location.last_updated)}`} />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(location.user_id);
                                focusOnUser(location.user_id);
                              }}
                            >
                              <Focus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredLocations || filteredLocations.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            No location history available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geofencing">
          <GeofenceManager />
        </TabsContent>

        <TabsContent value="analytics">
          <VisitorAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {error && (
        <Card className="p-6 border-destructive">
          <div className="text-sm text-destructive">
            Error: {error}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationTracking;
