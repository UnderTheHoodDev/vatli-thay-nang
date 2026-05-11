import * as BunnyStorageSDK from '@bunny.net/storage-sdk';

const accessKey = process.env.BUNNY_STORAGE_API_KEY ?? '';
const storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME ?? '';
const storageZoneRegion = (process.env.BUNNY_STORAGE_ZONE_REGION ??
  'de') as BunnyStorageSDK.regions.StorageRegion;

export const storageZone = BunnyStorageSDK.zone.connect_with_accesskey(
  storageZoneRegion,
  storageZoneName,
  accessKey,
);

export { BunnyStorageSDK };
