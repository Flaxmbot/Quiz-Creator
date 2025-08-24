"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ResponsiveTest() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState("desktop");
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      
      if (window.innerWidth < 640) {
        setCurrentBreakpoint("mobile");
      } else if (window.innerWidth < 768) {
        setCurrentBreakpoint("tablet");
      } else {
        setCurrentBreakpoint("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const simulateBreakpoint = (breakpoint: string) => {
    let width = 1200;
    let height = 800;
    
    switch (breakpoint) {
      case "mobile":
        width = 375;
        height = 667;
        break;
      case "tablet":
        width = 768;
        height = 1024;
        break;
      default:
        width = 1200;
        height = 800;
    }
    
    // This is just for demonstration - in a real app you might use CSS transforms or iframe resizing
    window.resizeTo(width, height);
    setCurrentBreakpoint(breakpoint);
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 futuristic-card">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium">Responsive Test</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span>Current Breakpoint:</span>
            <span className="font-medium capitalize">{currentBreakpoint}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Window Size:</span>
            <span className="font-medium">{windowSize.width} × {windowSize.height}</span>
          </div>
          <div className="flex gap-2">
            <Select value={currentBreakpoint} onValueChange={simulateBreakpoint}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select breakpoint" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile (375×667)</SelectItem>
                <SelectItem value="tablet">Tablet (768×1024)</SelectItem>
                <SelectItem value="desktop">Desktop (1200×800)</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="h-8 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}