import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (!eventId) { setEvent(null); return; }
    supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()
      .then(({ data }) => setEvent(data));
  }, [eventId]);

  return (
    <EventContext.Provider value={{ event, setEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  return useContext(EventContext);
}
