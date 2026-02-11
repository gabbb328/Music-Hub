import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Laptop, Smartphone, Speaker, Radio, Check } from "lucide-react";
import { useAvailableDevices, useTransferPlaybackMutation } from "@/hooks/useSpotify";
import { SpotifyDevice } from "@/types/spotify";
import { useToast } from "@/hooks/use-toast";

const DeviceIcon = ({ type }: { type: string }) => {
  switch (type.toLowerCase()) {
    case "computer":
      return <Laptop className="h-5 w-5" />;
    case "smartphone":
      return <Smartphone className="h-5 w-5" />;
    case "speaker":
      return <Speaker className="h-5 w-5" />;
    default:
      return <Radio className="h-5 w-5" />;
  }
};

const DevicesContent = () => {
  const { data: devicesData, isLoading } = useAvailableDevices();
  const transferPlayback = useTransferPlaybackMutation();
  const { toast } = useToast();

  const devices: SpotifyDevice[] = devicesData?.devices || [];

  const handleTransferPlayback = async (deviceId: string, deviceName: string) => {
    try {
      await transferPlayback.mutateAsync({ deviceId, play: true });
      toast({
        title: "Playback transferred",
        description: `Now playing on ${deviceName}`,
      });
    } catch (error) {
      toast({
        title: "Transfer failed",
        description: "Could not transfer playback to this device",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Devices</h1>
        <p className="text-muted-foreground">
          Manage your listening experience across devices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg border animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8">
              <Speaker className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No devices found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open Spotify on another device or start playing music to see available devices
              </p>
              <p className="text-xs text-muted-foreground">
                Make sure Spotify is running on your device and you're logged in with the same account
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    device.is_active
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        device.is_active ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <DeviceIcon type={device.type} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{device.name}</h3>
                        {device.is_active && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Check className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {device.type.replace("_", " ")} • Volume: {device.volume_percent}%
                      </p>
                    </div>
                  </div>
                  {!device.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransferPlayback(device.id, device.name)}
                      disabled={transferPlayback.isPending}
                    >
                      Transfer Here
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Harmony Hub Web Player</h4>
            <p className="text-xs text-muted-foreground">
              This browser is also a playback device. If you don't see it in the list above,
              try playing a song to activate it.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="text-primary">•</div>
            <p>
              Switch playback between devices seamlessly without interrupting your music
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-primary">•</div>
            <p>
              Spotify Premium is required to use the Web Player and transfer playback
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-primary">•</div>
            <p>
              Make sure your devices are connected to the internet and logged in to Spotify
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevicesContent;
