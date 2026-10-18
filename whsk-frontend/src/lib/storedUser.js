export function readStoredUser() {
  try {
    const stored = JSON.parse(sessionStorage.getItem("currentUser"));
    const data = stored?._doc || stored;
    const timestamp = stored?.timeStamp || data?.timeStamp;
    if (timestamp && Date.now() - Number(timestamp) >= 12000000) return null;
    const id = stored?.id || stored?._id || data?._id || data?.id;
    if (!id || !data || typeof data !== "object") return null;
    return { ...stored, ...data, id, _id: id, _doc: { ...data, _id: id } };
  } catch { return null; }
}
