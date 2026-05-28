import { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';

import { useEvents } from '@/src/presentation/events/events-context';

export function useEventsRefreshControl() {
  const { refreshEvents } = useEvents();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await refreshEvents();
    } finally {
      setRefreshing(false);
    }
  }, [refreshEvents]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#0a7ea4"
      colors={['#0a7ea4']}
    />
  );
}
