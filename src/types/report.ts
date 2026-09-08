export type ReportType = 'issue' | 'query' | 'feature_request' | 'other';
export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ReportAttachment {
  name: string;
  url: string;
  type?: string;
}

export interface IssueReportItem {
  _id: string;
  ticketId: string;
  agencyId?: string | null;
  agencyName?: string;
  userId?: string | null;
  reportType: ReportType;
  title: string;
  description: string;
  module: string;
  priority: ReportPriority;
  status: ReportStatus;
  reporterName: string;
  reporterEmail?: string;
  reporterPhone?: string;
  attachments: ReportAttachment[];
  resolutionNotes?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  issuesCount: number;
  queriesCount: number;
}
