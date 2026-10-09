'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  Activity,
  ActivityStatus,
  ODApplication,
  ODStatus,
  ODEvent,
  ReviewSession,
  WeeklyProgress,
  AttendanceItem,
  Notification,
  TeamMember,
  StudentStats,
} from '@/types';
import {
  ApiNotification,
} from '@/types/contract';
import { ApiError } from '@/lib/api/client';
import { odApi } from '@/lib/api/odApi';
import { activitiesApi } from '@/lib/api/activitiesApi';
import { reviewsApi } from '@/lib/api/reviewsApi';
import { notificationsApi } from '@/lib/api/notificationsApi';
import { recordsApi } from '@/lib/api/recordsApi';
import { reportsApi } from '@/lib/api/reportsApi';
import {
  GenerateQRResponse,
  CheckInQRResponse,
  FinalizeReviewResponse,
  StudentRecordListResponse,
  StudentRecordQuery,
  StudentSummaryResponse,
  AccreditationReportContract,
  ReportsSummaryContract,
} from '@/lib/api/contractTypes';
import {
  mapODApplicationToApiPayload,
  mapApiODToODApplication,
  mapActivityToApiPayload,
  mapApiActivityToActivity,
  mapWeeklyProgressToApiPayload,
  mapApiReviewToReviewSession,
  formatDateToYYYYMMDD,
} from '@/lib/api/mappers';
import { fixtureApiODs } from '@/data/fixtures/odFixtures';
import { fixtureApiActivities } from '@/data/fixtures/activitiesFixtures';
import { fixtureApiReviews } from '@/data/fixtures/reviewsFixtures';
import { fixtureApiNotifications } from '@/data/fixtures/notificationsFixtures';
import {
  mockActivities,
  mockReviewSessions,
  mockODApplications,
  mockODEvents,
  mockNotifications,
} from '@/data/mock';

// ==========================================
// 1. DOMAIN STATE LIFECYCLE MODEL (RFC 7807)
// ==========================================

export type DomainStateStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export interface DomainState {
  status: DomainStateStatus;
  error: ApiError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isEmpty: boolean;
}

function createDomainState(
  count: number,
  error: ApiError | null = null,
  status: DomainStateStatus = 'success'
): DomainState {
  const effectiveStatus = error ? 'error' : count === 0 ? 'empty' : status;
  return {
    status: effectiveStatus,
    error,
    isLoading: effectiveStatus === 'loading',
    isSuccess: effectiveStatus === 'success',
    isError: effectiveStatus === 'error',
    isEmpty: effectiveStatus === 'empty',
  };
}

// ==========================================
// 2. CONTEXT INTERFACE DEFINITION
// ==========================================

export interface DataContextType {
  // Domain Entities
  activities: Activity[];
  projects: Activity[];
  internships: Activity[];
  hackathons: Activity[];
  reviews: ReviewSession[];
  odApplications: ODApplication[];
  odSubmissions: ODApplication[]; // alias
  odEvents: ODEvent[];
  notifications: Notification[];

  // Domain State Lifecycles
  odState: DomainState;
  activitiesState: DomainState;
  reviewsState: DomainState;
  notificationsState: DomainState;
  lastError: ApiError | null;
  clearError: () => void;

  // Student Actions (Contract-Aligned)
  addActivity: (data: Partial<Activity>) => Activity;
  addProject: (data: Partial<Activity>) => Activity;
  addInternship: (data: Partial<Activity>) => Activity;
  addHackathon: (data: Partial<Activity>) => Activity;
  resubmitActivity: (id: string, notes?: string) => Activity | undefined;
  addODApplication: (data: Partial<ODApplication>) => ODApplication;
  addODSubmission: (data: Partial<ODApplication>) => ODApplication; // alias
  resubmitOD: (id: string, notes?: string) => ODApplication | undefined;
  addODEvent: (event: ODEvent) => ODEvent;
  submitWeeklyProgress: (
    reviewSessionId: string,
    progressData: {
      studentId: string;
      studentName: string;
      completedThisWeek: string;
      currentlyWorkingOn: string;
      nextWeekGoal: string;
      blockers: string;
      githubUrl?: string;
    }
  ) => WeeklyProgress;
  markAttendanceViaQR: (reviewSessionId: string, studentId: string) => boolean;

  // HOD Actions (Contract-Aligned)
  approveActivity: (id: string, remarks?: string) => void;
  rejectActivity: (id: string, reason: string) => void;
  requestRevisionActivity: (id: string, notes: string) => void;
  bulkApproveActivities: (ids: string[]) => void;
  approveOD: (id: string, remarks?: string) => void;
  rejectOD: (id: string, reason: string) => void;
  requestRevisionOD: (id: string, notes: string) => void;
  bulkApproveOD: (ids: string[]) => void;
  scheduleRecurringReviews: (params: {
    projectId: string;
    dayOfWeek?: string;
    time: string;
    startDate: string; // YYYY-MM-DD
    venue: string;
    count: number;
    intervalWeeks?: number;
  }) => ReviewSession[];
  updateReviewSession: (id: string, updates: Partial<ReviewSession>) => void;
  cancelReviewSession: (id: string) => void;
  recordReviewAttendance: (reviewSessionId: string, attendance: AttendanceItem[]) => void;
  saveMeetingNotes: (reviewSessionId: string, meetingNotes: string, nextWeekGoal?: string) => void;
  checkInReviewQR: (
    reviewSessionId: string,
    token: string,
    studentId?: string,
    studentRegNo?: string
  ) => Promise<CheckInQRResponse>;
  generateReviewQR: (reviewSessionId: string) => Promise<GenerateQRResponse>;
  finalizeReviewSession: (
    reviewSessionId: string,
    notes?: { meetingNotes?: string; nextWeekGoal?: string }
  ) => Promise<FinalizeReviewResponse>;
  broadcastReminder: (title: string, message: string, targetType?: 'ALL' | 'STUDENT') => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Phase 6 Records & Reports Contract APIs
  fetchStudentRecords: (query?: StudentRecordQuery) => Promise<StudentRecordListResponse>;
  fetchStudentSummary: (id: string) => Promise<StudentSummaryResponse>;
  exportStudentRecords: (query?: StudentRecordQuery) => Promise<string>;
  fetchAccreditationReport: (academicYear?: string) => Promise<AccreditationReportContract>;
  fetchReportsSummary: (academicYear?: string) => Promise<ReportsSummaryContract>;
  exportAccreditationReportCSV: (academicYear?: string) => Promise<string>;

  // Query Helpers
  getActivityById: (id: string) => Activity | undefined;
  getReviewById: (id: string) => ReviewSession | undefined;
  getODById: (id: string) => ODApplication | undefined;
  getEventById: (id: string) => ODEvent | undefined;
  getStudentStats: (studentRegNo: string) => StudentStats;
  getPendingApprovals: () => Activity[];
  getPendingODSubmissions: () => ODApplication[];
  getScheduledReviews: () => ReviewSession[];
  getReviewsForProject: (projectId: string) => ReviewSession[];
  checkODConflict: (studentRegNo: string, date?: string) => {
    hasConflict: boolean;
    conflictingEventName?: string;
    conflictingDate?: string;
    conflictingTime?: string;
  } | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ==========================================
// 3. CONTRACT-COMPATIBLE INITIALIZERS
// ==========================================

function buildInitialActivities(): Activity[] {
  const contractActs = fixtureApiActivities.map(mapApiActivityToActivity);
  const contractIds = new Set(contractActs.map((a) => a.id));
  const remainingMocks = mockActivities.filter((a) => !contractIds.has(a.id));
  return [...contractActs, ...remainingMocks];
}

function buildInitialODApplications(): ODApplication[] {
  const contractODs = fixtureApiODs.map(mapApiODToODApplication);
  const contractIds = new Set(contractODs.map((o) => o.id));
  const remainingMocks = mockODApplications.filter((o) => !contractIds.has(o.id));
  return [...contractODs, ...remainingMocks];
}

function buildInitialReviews(): ReviewSession[] {
  const contractRevs = fixtureApiReviews.map(mapApiReviewToReviewSession);
  const contractIds = new Set(contractRevs.map((r) => r.id));
  const remainingMocks = mockReviewSessions.filter((r) => !contractIds.has(r.id));
  return [...contractRevs, ...remainingMocks];
}

function buildInitialNotifications(): Notification[] {
  const contractNotifs: Notification[] = fixtureApiNotifications.map((n: ApiNotification) => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.isRead,
    createdAt: n.createdAt,
    linkUrl: n.linkUrl,
  }));
  const contractIds = new Set(contractNotifs.map((n) => n.id));
  const remainingMocks = mockNotifications.filter((n) => !contractIds.has(n.id));
  return [...contractNotifs, ...remainingMocks];
}

// ==========================================
// 4. DATA PROVIDER COMPONENT
// ==========================================

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Domain Entity Collections initialized from Contract Fixtures
  const [activities, setActivities] = useState<Activity[]>(buildInitialActivities);
  const [reviews, setReviews] = useState<ReviewSession[]>(buildInitialReviews);
  const [odApplications, setODApplications] = useState<ODApplication[]>(buildInitialODApplications);
  const [notifications, setNotifications] = useState<Notification[]>(buildInitialNotifications);
  const [odEvents, setODEvents] = useState<ODEvent[]>(() => [...mockODEvents]);

  // Domain Lifecycle State & RFC 7807 Error Tracking
  const [odError, setOdError] = useState<ApiError | null>(null);
  const [activitiesError, setActivitiesError] = useState<ApiError | null>(null);
  const [reviewsError, setReviewsError] = useState<ApiError | null>(null);
  const [notificationsError, setNotificationsError] = useState<ApiError | null>(null);
  const [lastError, setLastError] = useState<ApiError | null>(null);

  const clearError = () => {
    setOdError(null);
    setActivitiesError(null);
    setReviewsError(null);
    setNotificationsError(null);
    setLastError(null);
  };

  const odState = createDomainState(odApplications.length, odError);
  const activitiesState = createDomainState(activities.length, activitiesError);
  const reviewsState = createDomainState(reviews.length, reviewsError);
  const notificationsState = createDomainState(notifications.length, notificationsError);

  // Filtered views
  const projects = activities.filter((a) => a.type === 'PROJECT');
  const hackathons = activities.filter((a) => a.type === 'HACKATHON');
  const internships = activities.filter((a) => a.type === 'INTERNSHIP');

  // ==========================================
  // ACTIVITIES ACTIONS (API CONTRACT ALIGNED)
  // ==========================================

  const addActivity = (data: Partial<Activity>): Activity => {
    try {
      const payload = mapActivityToApiPayload(data);
      // Route through Phase 1 API abstraction (offline fixture resolver)
      activitiesApi.createActivity(payload);

      const typePrefix = data.type === 'PROJECT' ? 'PRJ' : data.type === 'HACKATHON' ? 'HCK' : 'INT';
      const typeCount = activities.filter((a) => a.type === data.type).length + 1;
      const newId = `${typePrefix}-2026-${String(typeCount).padStart(3, '0')}`;
      const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const newActivity: Activity = {
        id: newId,
        studentId: data.studentId || 'usr-student-001',
        studentName: data.studentName || 'Meena C',
        studentRegNo: data.studentRegNo || '714023104088',
        department: data.department || 'CSE',
        year: data.year || 'II',
        type: payload.type,
        title: payload.title || 'Untitled Activity',
        description: payload.description || '',
        organization: payload.organization || (payload.type === 'HACKATHON' ? 'National Tech Sprint' : 'CSE Department Lab'),
        eventName: data.eventName,
        startDate: payload.start_date,
        endDate: payload.end_date || '2026-12-15',
        technologies: payload.technologies || ['Python', 'FastAPI'],
        githubUrl: payload.github_url,
        demoUrl: payload.demo_url,
        proofUrl: data.proofUrl || '/docs/submitted-proof.pdf',
        proofDocName: data.proofDocName || 'Proposal_Document.pdf',
        additionalNotes: data.additionalNotes,
        teamMembers: data.teamMembers && data.teamMembers.length > 0 ? data.teamMembers : [
          { name: data.studentName || 'Meena C', regNo: data.studentRegNo || '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' }
        ],
        status: 'SUBMITTED',
        timeline: [
          {
            id: `t-${Date.now()}-1`,
            date: todayStr,
            title: `${payload.type === 'PROJECT' ? 'Project' : payload.type === 'HACKATHON' ? 'Hackathon Entry' : 'Internship NOC'} Submitted`,
            description: `Submitted by ${data.studentName || 'Meena C'} for HOD review.`,
            status: 'COMPLETED',
          },
          {
            id: `t-${Date.now()}-2`,
            date: 'Pending',
            title: 'Under HOD Review',
            description: 'Awaiting department evaluation and clearance.',
            status: 'CURRENT',
          },
        ],
        guideName: payload.guide_name || 'Dr. Priya Kumar',
        category: data.category || 'Computer Science & AI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActivities((prev) => [newActivity, ...prev]);

      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: 'usr-hod-001',
        title: `New ${newActivity.type} Submission Awaiting Approval`,
        message: `${newActivity.studentName} (${newActivity.studentRegNo}) submitted "${newActivity.title}".`,
        type: 'SUBMISSION_UPDATE',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkUrl: '/hod/approvals',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      setActivitiesError(null);
      return newActivity;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('ACTIVITY_CREATION_FAILED', String(err));
      setActivitiesError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const addProject = (data: Partial<Activity>) => addActivity({ ...data, type: 'PROJECT' });
  const addHackathon = (data: Partial<Activity>) => addActivity({ ...data, type: 'HACKATHON' });
  const addInternship = (data: Partial<Activity>) => addActivity({ ...data, type: 'INTERNSHIP' });

  const resubmitActivity = (id: string, notes?: string): Activity | undefined => {
    try {
      activitiesApi.resubmitActivity(id, { revision_notes: notes });
      let updatedAct: Activity | undefined;
      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          updatedAct = {
            ...a,
            status: 'SUBMITTED',
            revisionNotes: undefined,
            updatedAt: new Date().toISOString(),
          };
          return updatedAct;
        })
      );
      setActivitiesError(null);
      return updatedAct;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('ACTIVITY_RESUBMISSION_FAILED', String(err));
      setActivitiesError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const approveActivity = (id: string, remarks?: string) => {
    try {
      activitiesApi.executeDecision(id, { decision: 'ACTIVE', remarks });
      const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const newTimeline = [
            ...a.timeline.filter((t) => t.status === 'COMPLETED'),
            {
              id: `t-${Date.now()}`,
              date: todayStr,
              title: 'HOD Approved',
              description: remarks || 'Endorsed by HOD. Project transitioned to ACTIVE.',
              status: 'COMPLETED' as const,
            },
          ];
          return {
            ...a,
            status: 'ACTIVE' as ActivityStatus,
            rejectionReason: undefined,
            timeline: newTimeline,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const act = activities.find((a) => a.id === id);
      if (act) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: act.studentId,
          title: `Submission Approved: ${act.title}`,
          message: `Dr. Priya Kumar (HOD) approved your ${act.type.toLowerCase()}. Status is now ACTIVE.`,
          type: 'SUBMISSION_UPDATE',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkUrl: `/student/projects/${act.id}`,
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      setActivitiesError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('ACTIVITY_DECISION_FAILED', String(err));
      setActivitiesError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const rejectActivity = (id: string, reason: string) => {
    try {
      activitiesApi.executeDecision(id, { decision: 'REJECTED', rejection_reason: reason });
      const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const newTimeline = [
            ...a.timeline.filter((t) => t.status === 'COMPLETED'),
            {
              id: `t-${Date.now()}`,
              date: todayStr,
              title: 'HOD Rejected',
              description: `Reason: ${reason}`,
              status: 'COMPLETED' as const,
            },
          ];
          return {
            ...a,
            status: 'REJECTED' as ActivityStatus,
            rejectionReason: reason,
            timeline: newTimeline,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const act = activities.find((a) => a.id === id);
      if (act) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: act.studentId,
          title: `Submission Rejected: ${act.title}`,
          message: `HOD Review note: "${reason}".`,
          type: 'SUBMISSION_UPDATE',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkUrl: `/student/projects/${act.id}`,
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      setActivitiesError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('ACTIVITY_DECISION_FAILED', String(err));
      setActivitiesError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const requestRevisionActivity = (id: string, notes: string) => {
    try {
      activitiesApi.executeDecision(id, { decision: 'REVISION_REQUESTED', revision_notes: notes });
      const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const newTimeline = [
            ...a.timeline.filter((t) => t.status === 'COMPLETED'),
            {
              id: `t-${Date.now()}`,
              date: todayStr,
              title: 'Clarification & Revision Requested',
              description: `HOD Directive: "${notes}"`,
              status: 'CURRENT' as const,
            },
          ];
          return {
            ...a,
            status: 'REVISION_REQUESTED' as ActivityStatus,
            revisionNotes: notes,
            timeline: newTimeline,
            updatedAt: new Date().toISOString(),
          };
        })
      );

      const act = activities.find((a) => a.id === id);
      if (act) {
        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: act.studentId,
          title: `Action Required: Revision Requested for "${act.title}"`,
          message: `Dr. Priya Kumar requested updates: "${notes}". Please adjust your submission.`,
          type: 'SUBMISSION_UPDATE',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkUrl: `/student/projects/${act.id}`,
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      setActivitiesError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('ACTIVITY_DECISION_FAILED', String(err));
      setActivitiesError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const bulkApproveActivities = (ids: string[]) => {
    ids.forEach((id) => approveActivity(id));
  };

  // ==========================================
  // ON-DUTY (OD) ACTIONS (API CONTRACT ALIGNED)
  // ==========================================

  const addODApplication = (data: Partial<ODApplication>): ODApplication => {
    try {
      const payload = mapODApplicationToApiPayload(data);
      // Route through Phase 1 API abstraction (offline fixture resolver)
      odApi.createODRequest(payload);

      const newId = `OD-2026-${String(odApplications.length + 1).padStart(3, '0')}`;
      const todayStr = formatDateToYYYYMMDD(data.startDate || data.date);

      const newOD: ODApplication = {
        id: newId,
        studentId: data.studentId || 'usr-student-001',
        studentName: data.studentName || 'Meena C',
        studentRegNo: data.studentRegNo || '714023104088',
        department: data.department || 'CSE',
        year: data.year || 'II',
        purpose: payload.purpose,
        activityId: data.activityId,
        activityTitle: data.activityTitle,
        activityType: data.activityType,
        reason: payload.reason || 'Attending approved departmental academic milestone / event',
        eventName: payload.event_name,
        date: todayStr,
        startDate: payload.start_date,
        endDate: payload.end_date,
        fromTime: payload.from_time,
        toTime: payload.to_time,
        slotType: payload.slot_type,
        totalDays: payload.total_days,
        venue: payload.venue,
        registrationId: payload.registration_id,
        teamMembers: data.teamMembers && data.teamMembers.length > 0 ? data.teamMembers : [
          { name: data.studentName || 'Meena C', regNo: data.studentRegNo || '714023104088', email: 'meena.23cse@siet.ac.in', role: 'Team Lead' }
        ],
        documentIds: payload.document_ids || [],
        proofUrl: data.proofUrl || '/docs/od-proof.pdf',
        proofDocName: data.proofDocName || 'OD_Proof_Document.pdf',
        additionalNotes: payload.additional_notes,
        status: 'PENDING',
        submittedDate: todayStr,
      };

      setODApplications((prev) => [newOD, ...prev]);

      if (data.activityId) {
        setActivities((prev) =>
          prev.map((a) => (a.id === data.activityId ? { ...a, odStatus: 'PENDING' } : a))
        );
      }

      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        userId: 'usr-hod-001',
        title: `New OD Request: ${newOD.studentName}`,
        message: `OD requested for "${newOD.eventName}" on ${newOD.startDate} (${newOD.fromTime} - ${newOD.toTime}).`,
        type: 'OD_UPDATE',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkUrl: '/hod/od-submissions',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      setOdError(null);
      return newOD;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('OD_CREATION_FAILED', String(err));
      setOdError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const addODSubmission = addODApplication;

  const resubmitOD = (id: string, notes?: string): ODApplication | undefined => {
    try {
      odApi.resubmitODRequest(id, { revision_notes: notes });
      let updatedOD: ODApplication | undefined;
      setODApplications((prev) =>
        prev.map((od) => {
          if (od.id !== id) return od;
          updatedOD = {
            ...od,
            status: 'PENDING',
            revisionNotes: undefined,
          };
          return updatedOD;
        })
      );
      setOdError(null);
      return updatedOD;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('OD_RESUBMISSION_FAILED', String(err));
      setOdError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const approveOD = (id: string, remarks?: string) => {
    try {
      odApi.executeDecision(id, { decision: 'APPROVED', remarks });
      const todayStr = new Date().toISOString().split('T')[0];

      setODApplications((prev) =>
        prev.map((od) => {
          if (od.id !== id) return od;
          return {
            ...od,
            status: 'APPROVED' as ODStatus,
            approvedDate: todayStr,
            remarks: remarks || 'Approved by HOD. Academic attendance granted.',
            rejectionReason: undefined,
            revisionNotes: undefined,
          };
        })
      );

      const od = odApplications.find((o) => o.id === id);
      if (od) {
        if (od.activityId) {
          setActivities((prev) =>
            prev.map((a) => (a.id === od.activityId ? { ...a, odStatus: 'APPROVED' } : a))
          );
        }

        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: od.studentId,
          title: `OD Request Approved: ${od.eventName}`,
          message: `Your OD for ${od.date} (${od.fromTime} - ${od.toTime}) has been approved by HOD.`,
          type: 'OD_UPDATE',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkUrl: '/student/od-requests',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      setOdError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('OD_DECISION_FAILED', String(err));
      setOdError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const rejectOD = (id: string, reason: string) => {
    try {
      odApi.executeDecision(id, { decision: 'REJECTED', rejection_reason: reason });
      setODApplications((prev) =>
        prev.map((od) => {
          if (od.id !== id) return od;
          return {
            ...od,
            status: 'REJECTED' as ODStatus,
            rejectionReason: reason,
          };
        })
      );

      const od = odApplications.find((o) => o.id === id);
      if (od) {
        if (od.activityId) {
          setActivities((prev) =>
            prev.map((a) => (a.id === od.activityId ? { ...a, odStatus: 'REJECTED' } : a))
          );
        }

        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: od.studentId,
          title: `OD Request Rejected: ${od.eventName}`,
          message: `Reason: ${reason}`,
          type: 'OD_UPDATE',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkUrl: '/student/od-requests',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      setOdError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('OD_DECISION_FAILED', String(err));
      setOdError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const requestRevisionOD = (id: string, notes: string) => {
    try {
      odApi.executeDecision(id, { decision: 'REVISION_REQUESTED', revision_notes: notes });
      setODApplications((prev) =>
        prev.map((od) => {
          if (od.id !== id) return od;
          return {
            ...od,
            status: 'REVISION_REQUESTED' as ODStatus,
            revisionNotes: notes,
          };
        })
      );

      const od = odApplications.find((o) => o.id === id);
      if (od) {
        if (od.activityId) {
          setActivities((prev) =>
            prev.map((a) => (a.id === od.activityId ? { ...a, odStatus: 'REVISION_REQUESTED' } : a))
          );
        }

        const notif: Notification = {
          id: `notif-${Date.now()}`,
          userId: od.studentId,
          title: `OD Revision Requested: ${od.eventName}`,
          message: `HOD requested clarification: "${notes}".`,
          type: 'OD_UPDATE',
          isRead: false,
          createdAt: new Date().toISOString(),
          linkUrl: '/student/od-requests',
        };
        setNotifications((prev) => [notif, ...prev]);
      }
      setOdError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('OD_DECISION_FAILED', String(err));
      setOdError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const bulkApproveOD = (ids: string[]) => {
    try {
      odApi.executeBulkDecision({ od_ids: ids, decision: 'APPROVED' });
      ids.forEach((id) => approveOD(id));
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('OD_BULK_DECISION_FAILED', String(err));
      setOdError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  // ==========================================
  // REVIEW ACTIONS (NON-EVALUATIVE CONTRACT)
  // ==========================================

  const submitWeeklyProgress = (
    reviewSessionId: string,
    progressData: {
      studentId: string;
      studentName: string;
      completedThisWeek: string;
      currentlyWorkingOn: string;
      nextWeekGoal: string;
      blockers: string;
      githubUrl?: string;
    }
  ): WeeklyProgress => {
    try {
      const payload = mapWeeklyProgressToApiPayload(progressData);
      // Route through Phase 1 API abstraction (offline fixture resolver)
      reviewsApi.submitProgress(reviewSessionId, payload);

      const newProgress: WeeklyProgress = {
        id: `prog-${Date.now()}`,
        reviewSessionId,
        studentId: progressData.studentId,
        studentName: progressData.studentName,
        completedThisWeek: payload.completed_this_week,
        currentlyWorkingOn: payload.currently_working_on,
        nextWeekGoal: payload.next_week_goal,
        blockers: payload.blockers,
        githubUrl: payload.github_url,
        submittedAt: new Date().toISOString(),
      };

      setReviews((prev) =>
        prev.map((r) => (r.id === reviewSessionId ? { ...r, progress: newProgress } : r))
      );

      const rev = reviews.find((r) => r.id === reviewSessionId);
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: 'usr-hod-001',
        title: `Progress Submitted: Review #${rev?.reviewNumber || 1}`,
        message: `${progressData.studentName} submitted weekly progress for "${rev?.activityTitle}".`,
        type: 'PROGRESS_DUE',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkUrl: `/hod/reviews/${reviewSessionId}`,
      };
      setNotifications((prev) => [notif, ...prev]);

      setReviewsError(null);
      return newProgress;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('PROGRESS_SUBMISSION_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const markAttendanceViaQR = (reviewSessionId: string, studentId: string): boolean => {
    try {
      reviewsApi.checkIn(reviewSessionId, studentId);
      let success = false;
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewSessionId) return r;
          const updatedAttendance = r.attendance.map((att) => {
            if (att.studentId === studentId || att.name.toLowerCase() === studentId.toLowerCase() || att.regNo === studentId) {
              success = true;
              return { ...att, attended: true, checkInTime: nowTime };
            }
            return att;
          });
          return { ...r, attendance: updatedAttendance };
        })
      );
      setReviewsError(null);
      return success;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('QR_CHECKIN_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const scheduleRecurringReviews = (params: {
    projectId: string;
    dayOfWeek?: string;
    time: string;
    startDate: string; // YYYY-MM-DD
    venue: string;
    count: number;
    intervalWeeks?: number;
  }): ReviewSession[] => {
    try {
      reviewsApi.scheduleReviews({
        activity_id: params.projectId,
        start_date: params.startDate,
        time: params.time,
        venue: params.venue,
        count: params.count,
        review_type: 'PROJECT_WEEKLY',
      });

      const project = activities.find((a) => a.id === params.projectId);
      if (!project) return [];

      const generated: ReviewSession[] = [];
      const baseDate = new Date(params.startDate);
      const stepWeeks = params.intervalWeeks || 1;

      const teamRoster: TeamMember[] =
        project.teamMembers.length > 0
          ? project.teamMembers
          : [{ name: project.studentName, regNo: project.studentRegNo, email: 'student@siet.ac.in', role: 'Lead' }];

      for (let i = 1; i <= params.count; i++) {
        const reviewDate = new Date(baseDate);
        reviewDate.setDate(baseDate.getDate() + (i - 1) * 7 * stepWeeks);

        const rawDateStr = reviewDate.toISOString().split('T')[0];
        const formattedDate = reviewDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });

        const initialAttendance: AttendanceItem[] = teamRoster.map((m, idx) => ({
          studentId: `usr-team-${idx + 1}`,
          name: m.name,
          regNo: m.regNo,
          attended: false,
        }));

        const session: ReviewSession = {
          id: `REV-${project.id.replace('PRJ-', '')}-${String(i).padStart(3, '0')}`,
          activityId: project.id,
          activityTitle: project.title,
          activityType: 'PROJECT',
          reviewNumber: i,
          reviewType: 'PROJECT_WEEKLY',
          date: formattedDate,
          rawDate: rawDateStr,
          time: params.time,
          venue: params.venue,
          status: 'SCHEDULED',
          studentTeam: teamRoster,
          attendance: initialAttendance,
          qrCodeToken: `QR-${project.id}-REV${i}-${rawDateStr}`,
          createdAt: new Date().toISOString(),
        };

        generated.push(session);
      }

      setReviews((prev) => [...generated, ...prev]);

      const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== params.projectId) return a;
          return {
            ...a,
            reviewCount: params.count,
            timeline: [
              ...a.timeline,
              {
                id: `t-${Date.now()}`,
                date: todayStr,
                title: 'Review Schedule Created',
                description: `${params.count} ${stepWeeks === 2 ? 'bi-weekly' : 'weekly'} review sessions generated for ${params.time} in ${params.venue}.`,
                status: 'COMPLETED' as const,
              },
            ],
          };
        })
      );

      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: project.studentId,
        title: `Weekly Review Schedule Created: ${project.title}`,
        message: `${params.count} weekly review sessions scheduled starting ${generated[0].date} at ${params.time} (${params.venue}).`,
        type: 'REVIEW_REMINDER',
        isRead: false,
        createdAt: new Date().toISOString(),
        linkUrl: `/student/projects/${project.id}`,
      };
      setNotifications((prev) => [notif, ...prev]);

      setReviewsError(null);
      return generated;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('SCHEDULE_REVIEWS_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const updateReviewSession = (id: string, updates: Partial<ReviewSession>) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const cancelReviewSession = (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
  };

  const recordReviewAttendance = (reviewSessionId: string, attendance: AttendanceItem[]) => {
    try {
      reviewsApi.finalizeSession(reviewSessionId, {
        attendance: attendance.map((a) => ({ student_id: a.studentId, attended: a.attended })),
        meeting_notes: 'Attendance recorded',
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewSessionId ? { ...r, attendance, status: 'COMPLETED' } : r))
      );
      setReviewsError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('RECORD_ATTENDANCE_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const saveMeetingNotes = (reviewSessionId: string, meetingNotes: string, nextWeekGoal?: string) => {
    try {
      reviewsApi.finalizeSession(reviewSessionId, {
        meeting_notes: meetingNotes,
        next_week_goal: nextWeekGoal,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewSessionId
            ? { ...r, meetingNotes, nextWeekGoal: nextWeekGoal || r.nextWeekGoal, status: 'COMPLETED' }
            : r
        )
      );
      setReviewsError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('SAVE_NOTES_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const checkInReviewQR = async (
    reviewSessionId: string,
    token: string,
    studentId?: string,
    studentRegNo?: string
  ): Promise<CheckInQRResponse> => {
    try {
      const res = await reviewsApi.checkInQR(reviewSessionId, {
        token,
        student_id: studentId || 'usr-student-001',
        student_reg_no: studentRegNo,
      });
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id !== reviewSessionId) return r;
          const updatedAttendance = r.attendance.map((att) => {
            if (
              att.studentId === studentId ||
              att.regNo === studentRegNo ||
              (studentId && att.name.toLowerCase().includes(studentId.toLowerCase()))
            ) {
              return { ...att, attended: true, checkInTime: nowTime };
            }
            return att;
          });
          return { ...r, attendance: updatedAttendance };
        })
      );
      setReviewsError(null);
      return res;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('QR_CHECKIN_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const generateReviewQR = async (reviewSessionId: string): Promise<GenerateQRResponse> => {
    try {
      const res = await reviewsApi.generateQR(reviewSessionId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewSessionId
            ? { ...r, qrCodeToken: res.token, qrExpiresAt: res.expires_at }
            : r
        )
      );
      setReviewsError(null);
      return res;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('GENERATE_QR_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const finalizeReviewSession = async (
    reviewSessionId: string,
    notes?: { meetingNotes?: string; nextWeekGoal?: string }
  ): Promise<FinalizeReviewResponse> => {
    try {
      const res = await reviewsApi.finalizeReview(reviewSessionId, {
        meeting_notes: notes?.meetingNotes,
        next_week_goal: notes?.nextWeekGoal,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewSessionId
            ? {
                ...r,
                status: 'COMPLETED',
                meetingNotes: notes?.meetingNotes || r.meetingNotes,
                nextWeekGoal: notes?.nextWeekGoal || r.nextWeekGoal,
              }
            : r
        )
      );
      setReviewsError(null);
      return res;
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('FINALIZE_REVIEW_FAILED', String(err));
      setReviewsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  // ==========================================
  // PHASE 6 RECORDS & REPORTS (API CONTRACT ALIGNED)
  // ==========================================

  const fetchStudentRecords = async (query?: StudentRecordQuery): Promise<StudentRecordListResponse> => {
    return recordsApi.getStudents(query);
  };

  const fetchStudentSummary = async (id: string): Promise<StudentSummaryResponse> => {
    return recordsApi.getStudentSummary(id);
  };

  const exportStudentRecords = async (query?: StudentRecordQuery): Promise<string> => {
    return recordsApi.exportRecords(query);
  };

  const fetchAccreditationReport = async (academicYear?: string): Promise<AccreditationReportContract> => {
    return reportsApi.getAccreditationReport(academicYear);
  };

  const fetchReportsSummary = async (academicYear?: string): Promise<ReportsSummaryContract> => {
    return reportsApi.getReportsSummary(academicYear);
  };

  const exportAccreditationReportCSV = async (academicYear?: string): Promise<string> => {
    return reportsApi.exportReportCSV(academicYear);
  };

  // ==========================================
  // NOTIFICATIONS ACTIONS (API CONTRACT ALIGNED)
  // ==========================================

  const broadcastReminder = (title: string, message: string, targetType: 'ALL' | 'STUDENT' = 'STUDENT') => {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: targetType === 'ALL' ? 'all' : 'usr-student-001',
      title,
      message,
      type: 'REVIEW_REMINDER',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    try {
      notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setNotificationsError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('MARK_NOTIFICATION_FAILED', String(err));
      setNotificationsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  const clearAllNotifications = () => {
    try {
      notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setNotificationsError(null);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : new ApiError('CLEAR_NOTIFICATIONS_FAILED', String(err));
      setNotificationsError(apiErr);
      setLastError(apiErr);
      throw apiErr;
    }
  };

  // ==========================================
  // QUERY HELPERS (PRESERVED UI BEHAVIOR)
  // ==========================================

  const getActivityById = (id: string) => activities.find((a) => a.id === id);
  const getReviewById = (id: string) => reviews.find((r) => r.id === id);
  const getODById = (id: string) => odApplications.find((o) => o.id === id);
  const getEventById = (id: string) => odEvents.find((e) => e.id === id);
  const getPendingApprovals = () => activities.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW');
  const getPendingODSubmissions = () => odApplications.filter((o) => o.status === 'PENDING');
  const getScheduledReviews = () => reviews.filter((r) => r.status === 'SCHEDULED');
  const getReviewsForProject = (projectId: string) =>
    reviews.filter((r) => r.activityId === projectId).sort((a, b) => a.reviewNumber - b.reviewNumber);

  const checkODConflict = (studentRegNo: string, date?: string) => {
    if (!date) return null;
    const existingApproved = odApplications.find(
      (od) =>
        (od.studentRegNo === studentRegNo || od.teamMembers?.some((tm) => tm.regNo === studentRegNo)) &&
        od.status === 'APPROVED' &&
        od.date === date
    );
    if (existingApproved) {
      return {
        hasConflict: true,
        conflictingEventName: existingApproved.eventName,
        conflictingDate: existingApproved.date,
        conflictingTime: `${existingApproved.fromTime || '09:00 AM'} – ${existingApproved.toTime || '05:00 PM'}`,
      };
    }
    return null;
  };

  const getStudentStats = (studentRegNo: string): StudentStats => {
    const studentActs = activities.filter(
      (a) => a.studentRegNo === studentRegNo || a.teamMembers?.some((m) => m.regNo === studentRegNo)
    );
    const approvedActs = studentActs.filter((a) => a.status === 'APPROVED' || a.status === 'ACTIVE' || a.status === 'COMPLETED');
    const studentODs = odApplications.filter((o) => o.studentRegNo === studentRegNo);
    const approvedODs = studentODs.filter((o) => o.status === 'APPROVED');

    const totalDays = approvedODs.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);

    const relevantReviews = reviews.filter((r) =>
      r.studentTeam?.some((m) => m.regNo === studentRegNo) || r.attendance?.some((att) => att.regNo === studentRegNo)
    );
    const attendedReviews = relevantReviews.filter((r) =>
      r.attendance?.some((att) => att.regNo === studentRegNo && att.attended)
    );
    const attendanceRate =
      relevantReviews.length > 0
        ? `${Math.round((attendedReviews.length / relevantReviews.length) * 100)}%`
        : '100%';

    return {
      totalActivities: studentActs.length,
      approvedActivities: approvedActs.length,
      totalODs: studentODs.length,
      approvedODs: approvedODs.length,
      totalODDays: totalDays,
      attendanceRate,
      standing: 'Exemplary Clearance',
      recentActivityTitles: studentActs.map((a) => a.title).slice(0, 3),
    };
  };

  const addODEvent = (event: ODEvent): ODEvent => {
    setODEvents((prev) => [event, ...prev]);
    return event;
  };

  return (
    <DataContext.Provider
      value={{
        activities,
        projects,
        internships,
        hackathons,
        reviews,
        odApplications,
        odSubmissions: odApplications,
        odEvents,
        notifications,
        odState,
        activitiesState,
        reviewsState,
        notificationsState,
        lastError,
        clearError,
        addActivity,
        addProject,
        addInternship,
        addHackathon,
        resubmitActivity,
        addODApplication,
        addODSubmission,
        resubmitOD,
        addODEvent,
        submitWeeklyProgress,
        markAttendanceViaQR,
        approveActivity,
        rejectActivity,
        requestRevisionActivity,
        bulkApproveActivities,
        approveOD,
        rejectOD,
        requestRevisionOD,
        bulkApproveOD,
        scheduleRecurringReviews,
        updateReviewSession,
        cancelReviewSession,
        recordReviewAttendance,
        saveMeetingNotes,
        checkInReviewQR,
        generateReviewQR,
        finalizeReviewSession,
        fetchStudentRecords,
        fetchStudentSummary,
        exportStudentRecords,
        fetchAccreditationReport,
        fetchReportsSummary,
        exportAccreditationReportCSV,
        broadcastReminder,
        markNotificationAsRead,
        clearAllNotifications,
        getActivityById,
        getReviewById,
        getODById,
        getEventById,
        checkODConflict,
        getStudentStats,
        getPendingApprovals,
        getPendingODSubmissions,
        getScheduledReviews,
        getReviewsForProject,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
