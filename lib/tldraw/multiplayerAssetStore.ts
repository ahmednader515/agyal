import { TLAssetStore, uniqueId } from "tldraw";

export function createMultiplayerAssetStore(syncUrl: string, token: string): TLAssetStore {
  const base = syncUrl.replace(/\/$/, "");

  return {
    async upload(_asset, file) {
      const id = uniqueId();
      const objectName = encodeURIComponent(id.replace(/[^a-zA-Z0-9_-]+/g, "_"));
      const url = `${base}/api/uploads/${objectName}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          Authorization: `Bearer ${token}`,
        },
        body: file,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      return { src: `${base}/api/uploads/${objectName}` };
    },
    resolve(asset) {
      return asset.props.src;
    },
  };
}
