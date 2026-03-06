import apiClient from "@/api/client";

export interface IceServersConfig {
  iceServers: RTCIceServer[];
}

export async function getIceServers(): Promise<RTCConfiguration> {
  const { data } = await apiClient.get<IceServersConfig>("/calls/ice-servers/");
  return { iceServers: data.iceServers };
}
