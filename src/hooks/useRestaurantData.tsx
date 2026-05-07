import { useContext } from 'react';
import { RestaurantContext } from './restaurantDataContext';

export const useRestaurantData = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurantData must be used inside RestaurantDataProvider');
  return context;
};
