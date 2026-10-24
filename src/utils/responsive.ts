import { useWindowDimensions, Platform } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isWeb: number | boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  contentMaxWidth: number;
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const contentMaxWidth = isDesktop ? 1040 : isTablet ? 840 : 720;

  return {
    width,
    height,
    isWeb,
    isTablet,
    isDesktop,
    isLargeScreen,
    contentMaxWidth,
  };
}
