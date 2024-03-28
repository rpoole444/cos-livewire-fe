import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const EditEventPage = () => {
  const [event, setEvent] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      const response = await fetch(`http://localhost:3000/api/events/${id}`); // Adjust URL as necessary
      const eventData = await response.json();
      setEvent(eventData);
    };

    fetchEvent();
  }, [id]);

  if (!event) return <div>Loading...</div>;

  return (
    <div>
      {/* Your form here, pre-populated with event data */}
    </div>
  );
};

export default EditEventPage;
