import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { datasetApi } from '@/lib/api';

interface Dataset {
  id: string;
  name: string;
  created_at: string;
}

interface DatasetContextType {
  datasets: Dataset[];
  activeDatasetId: string | null;
  setActiveDatasetId: (id: string) => void;
  refreshDatasets: () => Promise<void>;
  isLoading: boolean;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetIdState] = useState<string | null>(
    localStorage.getItem('osaifill_active_dataset_id')
  );
  const [isLoading, setIsLoading] = useState(true);

  const setActiveDatasetId = useCallback((id: string) => {
    setActiveDatasetIdState(id);
    localStorage.setItem('osaifill_active_dataset_id', id);
  }, []);

  const refreshDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await datasetApi.list();
      setDatasets(data);
      
      // アクティブなデータセットがない場合、または存在しないIDの場合は最新のものをセット
      if (data.length > 0) {
        if (!activeDatasetId || !data.find((d: Dataset) => d.id === activeDatasetId)) {
          setActiveDatasetId(data[0].id);
        }
      } else {
        setActiveDatasetIdState(null);
      }
    } catch (e) {
      console.error("Failed to fetch datasets", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeDatasetId, setActiveDatasetId]);

  useEffect(() => {
    refreshDatasets();
  }, [refreshDatasets]);

  return (
    <DatasetContext.Provider value={{ datasets, activeDatasetId, setActiveDatasetId, refreshDatasets, isLoading }}>
      {children}
    </DatasetContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDatasets = () => {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error('useDatasets must be used within a DatasetProvider');
  }
  return context;
};
