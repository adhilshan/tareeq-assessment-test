import config from '../config/env';

export const getRouteDistance = async (
  fromLng: number,
  fromLat: number,
  toLng: number,
  toLat: number
): Promise<number> => {
  const url = `${config.OSRM_ENDPOINT}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) return 0;
  return data.routes[0].distance / 1000;
};
