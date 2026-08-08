import React, { useEffect, useState } from 'react';
import { ParsedData } from '@/lib/pdf-parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { normalizeImportDate, normalizeParsedCvData } from '@/lib/normalize-parsed-cv';
import { Briefcase, GraduationCap, Award, Trash2, Plus } from 'lucide-react';

interface CvImportReviewDialogProps {
  open: boolean;
  initialData: ParsedData | null;
  applying?: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (data: ParsedData) => void;
  onDiscard: () => void;
}

type WorkRow = ParsedData['workExperience'][number] & { location?: string };
type EduRow = ParsedData['education'][number] & { location?: string };

export const CvImportReviewDialog: React.FC<CvImportReviewDialogProps> = ({
  open,
  initialData,
  applying = false,
  onOpenChange,
  onApply,
  onDiscard,
}) => {
  const [draft, setDraft] = useState<ParsedData | null>(null);

  useEffect(() => {
    if (open && initialData) {
      setDraft(normalizeParsedCvData(initialData));
    }
  }, [open, initialData]);

  if (!draft) return null;

  const updateProfile = (field: keyof ParsedData['profile'], value: string) => {
    setDraft((prev) =>
      prev
        ? { ...prev, profile: { ...prev.profile, [field]: value } }
        : prev
    );
  };

  const updateWork = (index: number, patch: Partial<WorkRow>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const workExperience = [...prev.workExperience] as WorkRow[];
      workExperience[index] = { ...workExperience[index], ...patch };
      if (patch.still_work_here) {
        workExperience[index].end_date = null;
      }
      if (patch.start_date !== undefined) {
        workExperience[index].start_date = normalizeImportDate(patch.start_date);
      }
      if (patch.end_date !== undefined && patch.end_date) {
        workExperience[index].end_date = normalizeImportDate(patch.end_date);
      }
      return { ...prev, workExperience };
    });
  };

  const updateEducation = (index: number, patch: Partial<EduRow>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const education = [...prev.education] as EduRow[];
      education[index] = { ...education[index], ...patch };
      if (patch.still_studying) {
        education[index].end_date = null;
      }
      if (patch.start_date !== undefined) {
        education[index].start_date = normalizeImportDate(patch.start_date);
      }
      if (patch.end_date !== undefined && patch.end_date) {
        education[index].end_date = normalizeImportDate(patch.end_date);
      }
      return { ...prev, education };
    });
  };

  const updateCert = (index: number, patch: Partial<ParsedData['certifications'][number]>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const certifications = [...prev.certifications];
      certifications[index] = { ...certifications[index], ...patch };
      if (patch.date_attained !== undefined) {
        certifications[index].date_attained = normalizeImportDate(patch.date_attained);
      }
      return { ...prev, certifications };
    });
  };

  const removeWork = (index: number) => {
    setDraft((prev) =>
      prev
        ? { ...prev, workExperience: prev.workExperience.filter((_, i) => i !== index) }
        : prev
    );
  };

  const removeEducation = (index: number) => {
    setDraft((prev) =>
      prev ? { ...prev, education: prev.education.filter((_, i) => i !== index) } : prev
    );
  };

  const removeCert = (index: number) => {
    setDraft((prev) =>
      prev
        ? { ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }
        : prev
    );
  };

  const addWork = () => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            workExperience: [
              {
                job_title: '',
                company: '',
                start_date: '',
                end_date: null,
                still_work_here: false,
              },
              ...prev.workExperience,
            ],
          }
        : prev
    );
  };

  const handleApply = () => {
    const cleaned = normalizeParsedCvData(draft);
    onApply(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review imported CV data</DialogTitle>
          <DialogDescription>
            Fix misplaced titles, companies, or dates before applying to your profile.
            Nothing is written to your live profile until you click Apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input
                  value={draft.profile.firstName || ''}
                  onChange={(e) => updateProfile('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label>Surname</Label>
                <Input
                  value={draft.profile.surname || ''}
                  onChange={(e) => updateProfile('surname', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Headline</Label>
                <Input
                  value={draft.profile.headline || ''}
                  onChange={(e) => updateProfile('headline', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  value={draft.profile.bio || ''}
                  onChange={(e) => updateProfile('bio', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work experience ({draft.workExperience.length})
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addWork}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {draft.workExperience.length === 0 && (
              <p className="text-sm text-muted-foreground">No work experience extracted.</p>
            )}
            {draft.workExperience.map((exp, index) => (
              <div key={index} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Role {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeWork(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label>Job title</Label>
                    <Input
                      value={exp.job_title}
                      onChange={(e) => updateWork(index, { job_title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Company</Label>
                    <Input
                      value={exp.company}
                      onChange={(e) => updateWork(index, { company: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={(exp.start_date || '').slice(0, 10)}
                      onChange={(e) => updateWork(index, { start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input
                      type="date"
                      disabled={exp.still_work_here}
                      value={(exp.end_date || '').slice(0, 10)}
                      onChange={(e) => updateWork(index, { end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`still-work-${index}`}
                    checked={exp.still_work_here}
                    onCheckedChange={(checked) =>
                      updateWork(index, { still_work_here: checked === true })
                    }
                  />
                  <Label htmlFor={`still-work-${index}`}>Currently work here</Label>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Education ({draft.education.length})
            </h3>
            {draft.education.map((edu, index) => (
              <div key={index} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Education {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <Label>Institution</Label>
                    <Input
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, { institution: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Qualification</Label>
                    <Input
                      value={edu.qualification_type}
                      onChange={(e) => updateEducation(index, { qualification_type: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Subject</Label>
                    <Input
                      value={edu.subject}
                      onChange={(e) => updateEducation(index, { subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={(edu.start_date || '').slice(0, 10)}
                      onChange={(e) => updateEducation(index, { start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input
                      type="date"
                      disabled={edu.still_studying}
                      value={(edu.end_date || '').slice(0, 10)}
                      onChange={(e) => updateEducation(index, { end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`still-study-${index}`}
                    checked={edu.still_studying}
                    onCheckedChange={(checked) =>
                      updateEducation(index, { still_studying: checked === true })
                    }
                  />
                  <Label htmlFor={`still-study-${index}`}>Currently studying</Label>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certifications ({draft.certifications.length})
            </h3>
            {draft.certifications.map((cert, index) => (
              <div key={index} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Certification {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCert(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="sm:col-span-2">
                    <Label>Course name</Label>
                    <Input
                      value={cert.course_name}
                      onChange={(e) => updateCert(index, { course_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Input
                      value={cert.certification_type}
                      onChange={(e) => updateCert(index, { certification_type: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Date attained</Label>
                    <Input
                      type="date"
                      value={(cert.date_attained || '').slice(0, 10)}
                      onChange={(e) => updateCert(index, { date_attained: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {draft.skills.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Also extracted {draft.skills.length} skills
              {draft.skills_dimensions ? ' and a skills profile' : ''}.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={applying} onClick={onDiscard}>
            Discard
          </Button>
          <Button type="button" disabled={applying} onClick={handleApply}>
            {applying ? 'Applying…' : 'Apply to profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
