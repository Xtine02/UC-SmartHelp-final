import { useState } from "react";
import Navbar from "@/components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BuildingFloors {
  [key: string]: string[];
}

const BUILDINGS: BuildingFloors = {
  "Admin Building": ["1st Floor", "2nd Floor", "3rd Floor"],
  "Gotianoy Building": ["Ground Floor", "1st Floor", "2nd Floor"],
  "Engineering Building": ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"],
};

const Map = () => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  // Get available floors for the selected building
  const availableFloors = selectedBuilding ? BUILDINGS[selectedBuilding] : [];

  // Reset floor and image when building changes
  const handleBuildingChange = (value: string) => {
    setSelectedBuilding(value);
    setSelectedFloor("");
    setImageUrl("");
  };

  // Handle floor selection
  const handleFloorChange = (value: string) => {
    setSelectedFloor(value);
    // You can construct the image path based on building and floor
    // For now, showing placeholder structure
    setImageUrl(`/maps/${selectedBuilding}/${value}.png`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-12 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Campus Map</h1>
          <p className="text-muted-foreground">
            Navigate through different buildings and floors of University of Cebu
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Building Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Building</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBuilding} onValueChange={handleBuildingChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a building..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(BUILDINGS).map((building) => (
                    <SelectItem key={building} value={building}>
                      {building}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBuilding && (
                <p className="text-sm text-muted-foreground mt-3">
                  Selected: <span className="font-semibold text-foreground">{selectedBuilding}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Floor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Floor</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedFloor}
                onValueChange={handleFloorChange}
                disabled={!selectedBuilding}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedBuilding ? "Choose a floor..." : "Select a building first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableFloors.map((floor) => (
                    <SelectItem key={floor} value={floor}>
                      {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFloor && (
                <p className="text-sm text-muted-foreground mt-3">
                  Selected: <span className="font-semibold text-foreground">{selectedFloor}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Display Area */}
        {selectedBuilding && selectedFloor ? (
          <Card className="border-2">
            <CardHeader>
              <CardTitle>
                {selectedBuilding} - {selectedFloor}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-muted/20 rounded-lg flex items-center justify-center min-h-[500px]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${selectedBuilding} - ${selectedFloor}`}
                    className="max-w-full h-auto rounded-lg"
                    onError={() => (
                      <div className="text-center text-muted-foreground">
                        <p>Map image not found</p>
                        <p className="text-sm">Place your image at: {imageUrl}</p>
                      </div>
                    )}
                  />
                ) : (
                  <div className="text-center text-muted-foreground space-y-2">
                    <p className="text-lg font-semibold">Map Coming Soon</p>
                    <p className="text-sm">Floor map for {selectedBuilding} - {selectedFloor}</p>
                    <p className="text-xs text-muted-foreground/70 mt-4">
                      Expected image path: {imageUrl}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="text-center text-muted-foreground space-y-2">
                <p className="text-lg font-semibold">Select a Building and Floor</p>
                <p className="text-sm">Choose a building above and then select a floor to view the map</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Map;
