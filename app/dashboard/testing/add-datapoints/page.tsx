"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createDatapoint } from "@/lib/front_end_api_service"

interface LastDatapoint {
  value: number;
  battery: number;
}

export default function AddDatapointsPage() {
  const [deviceId, setDeviceId] = useState("")
  const [value, setValue] = useState("3300")
  const [battery, setBattery] = useState("100")
  const [isLoading, setIsLoading] = useState(false)
  const [lastDatapoint, setLastDatapoint] = useState<LastDatapoint | null>(null)

  // Load last datapoint from localStorage when deviceId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`lastDatapoint_${deviceId}`)
      if (stored) {
        try {
          setLastDatapoint(JSON.parse(stored))
        } catch (e) {
          console.error('Error parsing stored datapoint:', e)
          setLastDatapoint(null)
        }
      } else {
        setLastDatapoint(null)
      }
    }
  }, [deviceId])

  const handleSubmitDatapoint = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem("authToken")
      if (!token) {
        toast.error("Please log in first")
        return
      }

      // Parse input values
      const numericValue = parseInt(value)
      const numericBattery = parseInt(battery)

      // Validate inputs
      if (isNaN(numericValue) || isNaN(numericBattery)) {
        toast.error("Value and battery must be numbers")
        return
      }

      // Ensure values are within valid ranges
      const validValue = Math.max(0, Math.min(3300, numericValue))
      const validBattery = Math.max(0, Math.min(100, numericBattery))

      const datapoint = {
        value: validValue,
        battery: validBattery,
        deviceHashedMACAddress: deviceId
      }

      await createDatapoint(datapoint)
      
      // Update last datapoint
      const newLastDatapoint = { value: validValue, battery: validBattery }
      setLastDatapoint(newLastDatapoint)
      localStorage.setItem(`lastDatapoint_${deviceId}`, JSON.stringify(newLastDatapoint))

      toast.success(`Created datapoint: Value = ${validValue}, Battery = ${validBattery}%`)
    } catch (error) {
      console.error("Failed to generate datapoint:", error)
      toast.error("Failed to generate datapoint")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (typeof window === 'undefined') return;
      
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in first");
        return;
      }

      // Use the same format as other datapoints but with fixed value of -1
      const datapoint = {
        value: -1,
        battery: lastDatapoint?.battery ?? 100, // Use current battery or default to 100
        deviceHashedMACAddress: deviceId
      };

      await createDatapoint(datapoint);
      toast.success("Started new session with value: -1");
    } catch (error) {
      console.error("Failed to start session:", error);
      toast.error("Failed to start session");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Datapoint Testing</h1>
          <p className="text-muted-foreground mt-1">Generate test datapoints for a device</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <h3 className="font-medium mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Enter the device ID (hashedMACAddress)</li>
              <li>Click &quot;Start Session&quot; to start a new session</li>
              <li>Enter custom value (0-3300) and battery (0-100)</li>
              <li>Click &quot;Submit Datapoint&quot; to add your values</li>
            </ol>
          </div>

          {lastDatapoint && (
            <div className="rounded-md bg-blue-50 p-4 text-sm">
              <p>Last datapoint:</p>
              <p>Value: {lastDatapoint.value}</p>
              <p>Battery: {lastDatapoint.battery}</p>
            </div>
          )}

          <form onSubmit={handleSubmitDatapoint} className="flex flex-col space-y-4">
            <Input
              type="text"
              placeholder="Device ID (hashedMACAddress)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              required
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="value" className="text-sm text-muted-foreground block mb-1">
                  Value (0-3300)
                </label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  max="3300"
                  placeholder="Value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="battery" className="text-sm text-muted-foreground block mb-1">
                  Battery (0-100)
                </label>
                <Input
                  id="battery"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Battery"
                  value={battery}
                  onChange={(e) => setBattery(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleStartSession}
              variant="outline"
            >
              {isLoading ? "Starting..." : "Start Session"}
            </Button>
            
            <div className="border-t my-2" />
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Datapoint"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}