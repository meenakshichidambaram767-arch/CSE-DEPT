'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { DatePicker } from '@/components/ui/DatePicker';
import { FileUpload } from '@/components/ui/FileUpload';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import { ActivityType, TeamMember } from '@/types';
import {
  FolderKanban,
  Trophy,
  BriefcaseBusiness,
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  AlertOctagon,
  Send,
  FileCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';

export default function UnifiedActivitySubmissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addActivity } = useData();
  const { user } = useSession();
  const { showToast } = useToast();

  const initialType = (searchParams.get('type') as ActivityType) || 'PROJECT';
  const [activityType, setActivityType] = useState<ActivityType>(initialType);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organization, setOrganization] = useState('');
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2026-12-15');
  const [technologies, setTechnologies] = useState<string[]>(['Python', 'OpenCV', 'PyTorch']);
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [proofDocName, setProofDocName] = useState('Synopsis_Signed_Proof.pdf');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [guideName, setGuideName] = useState('Dr. Priya Kumar');
  const [category, setCategory] = useState('Computer Vision & AI');
  const [internshipRole, setInternshipRole] = useState('Software Engineering Intern');
  const [internshipMode, setInternshipMode] = useState('Hybrid');
  const [agreed, setAgreed] = useState(false);

  // Team Members list
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: user?.name || 'Meena C',
      regNo: user?.registerNumber || '714023104088',
      email: user?.email || 'meena.23cse@siet.ac.in',
      role: 'Team Lead',
    },
  ]);

  // Validation state
  const [missingErrors, setMissingErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial type from query params
  useEffect(() => {
    const qType = searchParams.get('type') as ActivityType;
    if (qType && ['PROJECT', 'HACKATHON', 'INTERNSHIP'].includes(qType)) {
      setActivityType(qType);
    }
  }, [searchParams]);

  const addTeamMember = () => {
    if (teamMembers.length >= 4) {
      showToast('Maximum 4 members allowed per team.', 'warning');
      return;
    }
    setTeamMembers([
      ...teamMembers,
      { name: '', regNo: '', email: '', role: 'Developer' },
    ]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length === 1) {
      showToast('At least one lead member is required.', 'warning');
      return;
    }
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, val: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: val };
    setTeamMembers(updated);
  };

  // Pre-submission validation function (Section 4)
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push('Activity / Project Title');
    }

    if (!description.trim()) {
      errors.push('Project Description / Scope');
    }

    // Validate team members
    const incompleteMember = teamMembers.some(
      (m) => !m.name.trim() || !m.regNo.trim() || !m.email.trim()
    );
    if (teamMembers.length === 0 || incompleteMember) {
      errors.push('Complete Team Members details (Name, Register Number, Email)');
    }

    if (activityType === 'HACKATHON' && !eventName.trim() && !organization.trim()) {
      errors.push('Hackathon Event Name & Organizing Body');
    }

    if (activityType === 'INTERNSHIP' && !organization.trim()) {
      errors.push('Company / Sponsoring Organization Name');
    }

    if (!startDate) {
      errors.push('Start Date');
    }

    if (!endDate) {
      errors.push('Target Completion / End Date');
    }

    if (technologies.length === 0) {
      errors.push('Technologies / Frameworks Stack');
    }

    if (!proofDocName.trim()) {
      errors.push('Supporting Document / Signed Synopsis Proof');
    }

    if (!agreed) {
      errors.push('Department Academic Integrity & Ethics Declaration Confirmation');
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();

    if (errors.length > 0) {
      setMissingErrors(errors);
      showToast('Please provide all required information before submitting', 'warning');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setMissingErrors([]);
    setIsSubmitting(true);

    setTimeout(() => {
      const finalTitle =
        activityType === 'INTERNSHIP' && !title.includes(organization)
          ? `${organization} — ${internshipRole}`
          : title;

      const newAct = addActivity({
        type: activityType,
        title: finalTitle,
        description,
        organization: organization || (activityType === 'PROJECT' ? 'CSE Research Lab' : eventName),
        eventName: activityType === 'HACKATHON' ? eventName || title : undefined,
        startDate,
        endDate,
        technologies,
        githubUrl: githubUrl || undefined,
        demoUrl: demoUrl || undefined,
        proofDocName,
        proofUrl: '/docs/sample-proof.pdf',
        additionalNotes: additionalNotes || undefined,
        teamMembers,
        guideName: activityType === 'PROJECT' ? guideName : undefined,
        category: activityType === 'PROJECT' ? category : undefined,
      });

      setIsSubmitting(false);
      showToast(`${activityType} Submitted for HOD Review!`, 'success');
      router.push(`/student/projects/${newAct.id}`);
    }, 600);
  };

  const techOptions = [
    { value: 'Python', label: 'Python' },
    { value: 'YOLOv8', label: 'YOLOv8 / Computer Vision' },
    { value: 'OpenCV', label: 'OpenCV' },
    { value: 'PyTorch', label: 'PyTorch / TensorFlow' },
    { value: 'FastAPI', label: 'FastAPI / REST API' },
    { value: 'React', label: 'React / Next.js' },
    { value: 'Node.js', label: 'Node.js / Express' },
    { value: 'PostgreSQL', label: 'PostgreSQL' },
    { value: 'ESP32', label: 'ESP32 / Embedded C' },
    { value: 'MQTT', label: 'MQTT Protocol' },
    { value: 'Solidity', label: 'Solidity / Web3' },
    { value: 'ROS2', label: 'ROS2 / Robotics' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <span className="text-xs text-slate-400">Back to Activities Dashboard</span>
      </div>

      <PageHeader
        title="Unified Activity Submission"
        description="Register capstone projects, national hackathons, or corporate internships for HOD evaluation and scheduling."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Activities', href: '/student/activities' },
          { label: 'New Submission', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Academic Year 2026-27</span>
          </span>
        }
      />

      {/* Real-Time Pre-Submission Validation Banner (Section 4) */}
      {missingErrors.length > 0 && (
        <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 shadow-sm animate-in fade-in duration-200 space-y-2.5">
          <div className="flex items-center gap-2 font-black text-sm text-red-800">
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
            <span>Missing required information:</span>
          </div>
          <p className="text-xs text-red-700">
            Incomplete requests cannot be submitted to the HOD. Please provide the following required fields:
          </p>
          <ul className="list-disc list-inside text-xs space-y-1 font-semibold text-red-900 pl-2">
            {missingErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Activity Type Switcher Tabs */}
      <div className="p-2 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActivityType('PROJECT')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activityType === 'PROJECT'
              ? 'bg-[#064e3b] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Capstone Project</span>
        </button>

        <button
          type="button"
          onClick={() => setActivityType('HACKATHON')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activityType === 'HACKATHON'
              ? 'bg-[#064e3b] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Hackathon Entry</span>
        </button>

        <button
          type="button"
          onClick={() => setActivityType('INTERNSHIP')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activityType === 'INTERNSHIP'
              ? 'bg-[#064e3b] text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <BriefcaseBusiness className="w-4 h-4" />
          <span>Corporate Internship</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Core Activity Identification (Adapts based on type) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              1. {activityType} Details
            </h3>
            <p className="text-xs text-slate-500">
              Specify the primary name, scope, and organizing entity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label={
                  activityType === 'PROJECT'
                    ? 'Project Title'
                    : activityType === 'HACKATHON'
                    ? 'Hackathon Project / Idea Title'
                    : 'Internship Title / Designation'
                }
                placeholder={
                  activityType === 'PROJECT'
                    ? 'e.g. AI-Based Examination Monitoring'
                    : activityType === 'HACKATHON'
                    ? 'e.g. HackSprint 2026 — AI Accessibility Assistant'
                    : 'e.g. Zoho Corporation — Software Engineering Intern'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                isRequired
              />
            </div>

            {activityType === 'HACKATHON' && (
              <>
                <Input
                  label="Event Name"
                  placeholder="e.g. HackSprint 2026 / Smart India Hackathon"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  isRequired
                />
                <Input
                  label="Organizing Body / University"
                  placeholder="e.g. IIT Madras / AICTE / SIET"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  isRequired
                />
              </>
            )}

            {activityType === 'INTERNSHIP' && (
              <>
                <Input
                  label="Company / Enterprise Name"
                  placeholder="e.g. Zoho Corporation / Bosch Global / TCS"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  isRequired
                />
                <Input
                  label="Role / Title"
                  placeholder="e.g. Full Stack Engineering Intern"
                  value={internshipRole}
                  onChange={(e) => setInternshipRole(e.target.value)}
                  isRequired
                />
              </>
            )}

            {activityType === 'PROJECT' && (
              <>
                <Select
                  label="Assigned / Endorsing Faculty Guide"
                  options={[
                    { value: 'Dr. Priya Kumar', label: 'Dr. Priya Kumar (Professor & Head)' },
                    { value: 'Dr. S. Kumar', label: 'Dr. S. Kumar (Associate Professor)' },
                    { value: 'Dr. P. Ananthi', label: 'Dr. P. Ananthi (Associate Professor)' },
                    { value: 'Dr. R. Mohan', label: 'Dr. R. Mohan (Assistant Professor)' },
                  ]}
                  value={guideName}
                  onChange={(e) => setGuideName(e.target.value)}
                  isRequired
                />

                <Select
                  label="Domain Category"
                  options={[
                    { value: 'Computer Vision & AI', label: 'Computer Vision & AI' },
                    { value: 'IoT & Embedded Systems', label: 'IoT & Embedded Systems' },
                    { value: 'Cybersecurity', label: 'Cybersecurity & Cloud' },
                    { value: 'Blockchain & Web3', label: 'Blockchain & Web3' },
                  ]}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  isRequired
                />
              </>
            )}

            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              isRequired
            />

            <DatePicker
              label="End Date / Target Defense"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              isRequired
            />
          </div>

          <Textarea
            label="Description & Scope"
            placeholder={
              activityType === 'PROJECT'
                ? 'Describe problem statement, objectives, and anticipated outcomes...'
                : activityType === 'HACKATHON'
                ? 'Describe problem statement chosen in hackathon and solution architecture...'
                : 'Describe internship project scope, deliverables, and industry team...'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            isRequired
          />

          <MultiSelect
            label="Technologies & Frameworks"
            options={techOptions}
            selectedValues={technologies}
            onChange={(vals) => setTechnologies(vals)}
            helperText="Select core toolkits and programming languages"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GitHub Repository Link"
              placeholder="https://github.com/meena-c/ai-exam-monitor"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />

            <Input
              label="Live Demo / Documentation Link (Optional)"
              placeholder="https://demo.siet.ac.in"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Team Members (Adapts for Project, Hackathon, Internship) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. Student / Team Members {activityType === 'INTERNSHIP' ? '(Individual)' : '(Max 4)'}
              </h3>
              <p className="text-xs text-slate-500">
                Designate team lead and collaborating students for departmental tracking.
              </p>
            </div>
            {activityType !== 'INTERNSHIP' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTeamMember}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Member
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {teamMembers.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col md:flex-row items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 w-full">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={m.name}
                    onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                    required
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Register Number"
                    value={m.regNo}
                    onChange={(e) => updateTeamMember(idx, 'regNo', e.target.value)}
                    required
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                  <input
                    type="email"
                    placeholder="College Email"
                    value={m.email}
                    onChange={(e) => updateTeamMember(idx, 'email', e.target.value)}
                    required
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Role (e.g. Lead, CV, API)"
                    value={m.role || ''}
                    onChange={(e) => updateTeamMember(idx, 'role', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900"
                  />
                </div>

                {teamMembers.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    onClick={() => removeTeamMember(idx)}
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Supporting Document / Proof */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              3. Supporting Document / Proof (Required)
            </h3>
            <p className="text-xs text-slate-500">
              {activityType === 'PROJECT'
                ? 'Upload Signed Project Synopsis (PDF).'
                : activityType === 'HACKATHON'
                ? 'Upload Selection Letter or Hackathon Registration Pass (PDF).'
                : 'Upload Official Corporate Internship Offer Letter / NOC Request (PDF).'}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <strong className="text-xs text-slate-900 block">{proofDocName}</strong>
                <span className="text-[11px] text-emerald-700">Ready for HOD verification • 1.4 MB PDF</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
              Attached
            </span>
          </div>

          <Textarea
            label="Additional Notes for HOD (Optional)"
            placeholder="Any specific lab requirements, equipment access, or faculty mentor remarks..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Section 4: Declaration & Submit */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <Checkbox
            label="Academic Integrity & Ethics Declaration"
            description="I certify that all details submitted above are accurate, adhere to SIET CSE autonomous curriculum standards, and are free of unauthorized plagiarism."
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/student/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Submit {activityType} for HOD Clearance
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
