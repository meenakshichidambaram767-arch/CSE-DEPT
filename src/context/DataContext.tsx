'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Activity,
  ActivityType,
  ActivityStatus,
  ODApplication,
  ODStatus,
  ODEvent,
  AuditLog,
  ReviewSession,
  WeeklyProgress,
  AttendanceItem,
  Notification,
  TeamMember,
  StudentStats,
} from '@/types';
import {
  mockActivities,
  mockReviewSessions,
  mockODApplications,
  mockODEvents,
  mockNotifications,
  mockUsers,
} from '@/data/mock';

export interface DataContextType {
  activities: Activity[];
  projects: Activity[];
  internships: Activity[];
  hackathons: Activity[];
  reviews: ReviewSession[];
  odApplications: ODApplication[];
  odSubmissions: ODApplication[]; // alias
  odEvents: ODEvent[];
  notifications: Notification[];

  // Student Actions
  addActivity: (data: Partial<Activity>) => Activity;
  addProject: (data: Partial<Activity>) => Activity;
  addInternship: (data: Partial<Activity>) => Activity;
  addHackathon: (data: Partial<Activity>) => Activity;
  addODApplication: (data: Partial<ODApplication>) => ODApplication;
  addODSubmission: (data: Partial<ODApplication>) => ODApplication; // alias
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

  // HOD Actions
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
  broadcastReminder: (title: string, message: string, targetType?: 'ALL' | 'STUDENT') => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

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
  checkODConflict: (studentRegNo: string, date?: string) => { hasConflict: boolean; conflictingEventName?: string; conflictingDate?: string; conflictingTime?: string } | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_PREFIX = 'siet_portal_data_v2_';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}activities`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return mockActivities;
  });

  const [reviews, setReviews] = useState<ReviewSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}reviews`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return mockReviewSessions;
  });

  const [odApplications, setODApplications] = useState<ODApplication[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}od`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return mockODApplications;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}notifs`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return mockNotifications;
  });

  // Sync state to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}activities`, JSON.stringify(activities));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}reviews`, JSON.stringify(reviews));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}od`, JSON.stringify(odApplications));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifs`, JSON.stringify(notifications));
    }
  }, [activities, reviews, odApplications, notifications]);

  // Filtered views
  const projects = activities.filter((a) => a.type === 'PROJECT');
  const hackathons = activities.filter((a) => a.type === 'HACKATHON');
  const internships = activities.filter((a) => a.type === 'INTERNSHIP');

  // Add Unified Activity
  const addActivity = (data: Partial<Activity>): Activity => {
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
      type: data.type || 'PROJECT',
      title: data.title || 'Untitled Activity',
      description: data.description || '',
      organization: data.organization || (data.type === 'HACKATHON' ? 'National Tech Sprint' : 'CSE Department Lab'),
      eventName: data.eventName,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || '2026-12-15',
      technologies: data.technologies || ['Python', 'FastAPI'],
      githubUrl: data.githubUrl,
      demoUrl: data.demoUrl,
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
          title: `${data.type === 'PROJECT' ? 'Project' : data.type === 'HACKATHON' ? 'Hackathon Entry' : 'Internship NOC'} Submitted`,
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
      guideName: data.guideName || 'Dr. Priya Kumar',
      category: data.category || 'Computer Science & AI',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActivities((prev) => [newActivity, ...prev]);

    // Send notification to HOD
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

    return newActivity;
  };

  const addProject = (data: Partial<Activity>) => addActivity({ ...data, type: 'PROJECT' });
  const addHackathon = (data: Partial<Activity>) => addActivity({ ...data, type: 'HACKATHON' });
  const addInternship = (data: Partial<Activity>) => addActivity({ ...data, type: 'INTERNSHIP' });

  // Add OD Application
  const addODApplication = (data: Partial<ODApplication>): ODApplication => {
    const newId = `OD-2026-${String(odApplications.length + 1).padStart(3, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newOD: ODApplication = {
      id: newId,
      studentId: data.studentId || 'usr-student-001',
      studentName: data.studentName || 'Meena C',
      studentRegNo: data.studentRegNo || '714023104088',
      department: data.department || 'CSE',
      year: data.year || 'II',
      purpose: data.purpose || 'HACKATHON',
      activityId: data.activityId,
      activityTitle: data.activityTitle,
      activityType: data.activityType,
      reason: data.reason || 'Attending approved departmental academic milestone / event',
      eventName: data.eventName || 'Department Technical Event',
      date: data.date || todayStr,
      fromTime: data.fromTime || '09:00 AM',
      toTime: data.toTime || '05:00 PM',
      venue: data.venue || 'CSE Department',
      proofUrl: data.proofUrl || '/docs/od-proof.pdf',
      proofDocName: data.proofDocName || 'OD_Proof_Document.pdf',
      additionalNotes: data.additionalNotes,
      status: 'PENDING',
      submittedDate: todayStr,
    };

    setODApplications((prev) => [newOD, ...prev]);

    // If attached to activity, update activity's odStatus
    if (data.activityId) {
      setActivities((prev) =>
        prev.map((a) => (a.id === data.activityId ? { ...a, odStatus: 'PENDING' } : a))
      );
    }

    // Add notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId: 'usr-hod-001',
      title: `New OD Request: ${newOD.studentName}`,
      message: `OD requested for "${newOD.eventName}" on ${newOD.date} (${newOD.fromTime} - ${newOD.toTime}).`,
      type: 'OD_UPDATE',
      isRead: false,
      createdAt: new Date().toISOString(),
      linkUrl: '/hod/od-submissions',
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newOD;
  };

  const addODSubmission = addODApplication;

  // Submit Weekly Progress
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
    const newProgress: WeeklyProgress = {
      id: `prog-${Date.now()}`,
      reviewSessionId,
      studentId: progressData.studentId,
      studentName: progressData.studentName,
      completedThisWeek: progressData.completedThisWeek,
      currentlyWorkingOn: progressData.currentlyWorkingOn,
      nextWeekGoal: progressData.nextWeekGoal,
      blockers: progressData.blockers,
      githubUrl: progressData.githubUrl,
      submittedAt: new Date().toISOString(),
    };

    setReviews((prev) =>
      prev.map((r) => (r.id === reviewSessionId ? { ...r, progress: newProgress } : r))
    );

    // Notify HOD
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

    return newProgress;
  };

  // Mark Attendance via QR Code
  const markAttendanceViaQR = (reviewSessionId: string, studentId: string): boolean => {
    let success = false;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewSessionId) return r;
        const updatedAttendance = r.attendance.map((att) => {
          if (att.studentId === studentId || att.name.toLowerCase() === studentId.toLowerCase()) {
            success = true;
            return { ...att, attended: true, checkInTime: nowTime };
          }
          return att;
        });
        return { ...r, attendance: updatedAttendance };
      })
    );
    return success;
  };

  // Approve Activity
  const approveActivity = (id: string, remarks?: string) => {
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
  };

  // Reject Activity
  const rejectActivity = (id: string, reason: string) => {
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
  };

  // Request Revision Activity (Non-punitive revision request)
  const requestRevisionActivity = (id: string, notes: string) => {
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
  };

  const bulkApproveActivities = (ids: string[]) => {
    ids.forEach((id) => approveActivity(id));
  };

  // Approve OD
  const approveOD = (id: string, remarks?: string) => {
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
  };

  // Reject OD
  const rejectOD = (id: string, reason: string) => {
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
  };

  // Request Revision OD
  const requestRevisionOD = (id: string, notes: string) => {
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
  };

  const bulkApproveOD = (ids: string[]) => {
    ids.forEach((id) => approveOD(id));
  };

  // Automatic Weekly Review Scheduling
  const scheduleRecurringReviews = (params: {
    projectId: string;
    dayOfWeek?: string;
    time: string;
    startDate: string; // YYYY-MM-DD
    venue: string;
    count: number;
    intervalWeeks?: number;
  }): ReviewSession[] => {
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

    // Append to reviews
    setReviews((prev) => [...generated, ...prev]);

    // Update project timeline
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

    // Notify student team
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

    return generated;
  };

  // Update Review Session
  const updateReviewSession = (id: string, updates: Partial<ReviewSession>) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  // Cancel Review Session
  const cancelReviewSession = (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)));
  };

  // Record Attendance
  const recordReviewAttendance = (reviewSessionId: string, attendance: AttendanceItem[]) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewSessionId ? { ...r, attendance, status: 'COMPLETED' } : r))
    );
  };

  // Save Meeting Notes
  const saveMeetingNotes = (reviewSessionId: string, meetingNotes: string, nextWeekGoal?: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewSessionId
          ? { ...r, meetingNotes, nextWeekGoal: nextWeekGoal || r.nextWeekGoal, status: 'COMPLETED' }
          : r
      )
    );
  };

  // Broadcast Reminder
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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const [odEvents, setODEvents] = useState<ODEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}od_events`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
      }
    }
    return mockODEvents;
  });

  // Sync state to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}activities`, JSON.stringify(activities));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}reviews`, JSON.stringify(reviews));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}od`, JSON.stringify(odApplications));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}od_events`, JSON.stringify(odEvents));
      localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}notifs`, JSON.stringify(notifications));
    }
  }, [activities, reviews, odApplications, odEvents, notifications]);

  // Query Helpers
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

    // Review attendance calculation
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
        addActivity,
        addProject,
        addInternship,
        addHackathon,
        addODApplication,
        addODSubmission,
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
