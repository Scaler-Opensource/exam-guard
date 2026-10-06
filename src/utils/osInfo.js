import { OS_NAME } from '@/constants/system';

export const getOperatingSystemInfo = () => {
  const ua = navigator.userAgent;

  const getOS = () => {
    if (/iPad|iPhone|iPod/.test(ua)) {
      return OS_NAME.IOS;
    }

    if (/Win/.test(ua)) return OS_NAME.WINDOWS;
    if (/Mac/.test(ua)) return OS_NAME.MACOS;
    if (/Android/.test(ua)) return OS_NAME.ANDROID;
    if (/Linux/.test(ua)) return OS_NAME.LINUX;

    return OS_NAME.UNKNOWN;
  };

  const os = getOS();

  return { osName: os };
};
