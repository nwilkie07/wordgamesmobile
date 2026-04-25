import { useAppNavigation, ScreenName } from '../context/NavigationContext';

type NavigationProp = {
  navigate: (screen: string, params?: Record<string, any>) => void;
  goBack: () => void;
};

type RouteProp<T> = {
  params: T;
};

export function useNavigation<T = any>(): NavigationProp {
  const { navigate } = useAppNavigation();
  return {
    navigate: (screen: string, params?: any) => {
      navigate(screen as ScreenName, params);
    },
    goBack: () => {
      navigate('Home');
    },
  };
}

export function useRoute<T = any>(): RouteProp<T> {
  return {
    params: {} as T,
  };
}