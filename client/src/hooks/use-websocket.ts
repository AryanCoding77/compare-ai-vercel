import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Check if we're in a Vercel production environment
const isVercelProduction =
  process.env.NODE_ENV === "production" &&
  (window.location.hostname.endsWith("vercel.app") ||
    window.location.hostname.includes(".vercel."));

export function useWebSocket() {
  const socket = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [usingPolling, setUsingPolling] = useState(isVercelProduction);
  const pollingInterval = useRef<number | null>(null);

  // Setup polling as a fallback for environments that don't support WebSockets (like Vercel)
  const setupPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Poll every 10 seconds
    pollingInterval.current = window.setInterval(() => {
      // Invalidate and refetch matches query
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });

      // If we're on a specific match page, get the ID from the URL
      const matchIdMatch =
        window.location.pathname.match(/\/matches\/([^\/]+)/);
      if (matchIdMatch && matchIdMatch[1]) {
        queryClient.invalidateQueries({
          queryKey: [`/api/matches/${matchIdMatch[1]}`],
        });
      }
    }, 10000) as unknown as number;

    console.log("Using polling fallback for real-time updates");
  }, [queryClient]);

  const connect = useCallback(() => {
    // If we're in Vercel production, use polling instead of WebSockets
    if (isVercelProduction) {
      setUsingPolling(true);
      setupPolling();
      return;
    }

    if (socket.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      socket.current = new WebSocket(wsUrl);

      socket.current.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;
        setUsingPolling(false);
      };

      socket.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              console.log("WebSocket connected");
              break;
            case "match_created":
            case "match_updated":
              // Invalidate and refetch matches query
              queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
              // If we're on a specific match page, invalidate that query too
              if (data.match?.id) {
                queryClient.invalidateQueries({
                  queryKey: [`/api/matches/${data.match.id}`],
                });
              }
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      socket.current.onclose = () => {
        console.log("WebSocket disconnected");

        // Implement reconnection with backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            10000
          );
          reconnectAttempts.current++;

          setTimeout(() => {
            console.log(
              `Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`
            );
            connect();
          }, timeout);
        } else {
          // Fall back to polling if WebSocket connection fails repeatedly
          setUsingPolling(true);
          setupPolling();

          toast({
            title: "Connection Mode Changed",
            description:
              "Switched to polling mode for updates. Some features may be delayed.",
            variant: "default",
          });
        }
      };

      socket.current.onerror = (error) => {
        console.error("WebSocket error:", error);

        // If we get an error on the first connection attempt, switch to polling
        if (reconnectAttempts.current === 0) {
          setUsingPolling(true);
          setupPolling();
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setUsingPolling(true);
      setupPolling();
    }
  }, [queryClient, toast, setupPolling]);

  useEffect(() => {
    connect();

    return () => {
      if (socket.current) {
        socket.current.close();
      }

      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [connect]);

  return { socket: socket.current, usingPolling };
}
