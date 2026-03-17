/** Payload shape for company-level real-time events */
export interface CompanyEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/** Publishes company-level events to Redis for real-time WebSocket delivery */
export interface ICompanyEventPublisher {
  publishCompanyEvent(companyId: string, event: CompanyEvent): Promise<void>;
}

export const COMPANY_EVENT_PUBLISHER = 'COMPANY_EVENT_PUBLISHER';
