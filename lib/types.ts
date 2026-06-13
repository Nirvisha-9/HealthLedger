export interface ProcedureInfo {
  name: string;
  cptCode: string;
  stickerPrice: number;
  waitDays: number;
  surpriseCost?: number;
}

export interface ReviewFlag {
  type: "ok" | "warning" | "danger";
  summary: string;
  sourceCount: number;
}

export interface Provider {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  procedures: Record<string, ProcedureInfo>;
  reviewFlag: ReviewFlag;
  networkStatus?: Record<string, boolean>;
}
