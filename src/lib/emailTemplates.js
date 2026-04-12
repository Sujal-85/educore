export const EMAIL_TEMPLATE_KEYS = {
  FEE_REMINDER: 'feeReminder',
  PERFORMANCE_REPORT: 'performanceReport',
  ATTENDANCE_WARNING: 'attendanceWarning',
  BEHAVIOR_ALERT: 'behaviorAlert',
  ASSIGNMENT_OVERDUE: 'assignmentOverdue',
  APPRECIATION_NOTE: 'appreciationNote',
  EXAM_SCHEDULE: 'examSchedule',
  LEAVE_REQUEST: 'leaveRequest',
  ASSIGNMENT_HELP: 'assignmentHelp',
  LIBRARY_RENEWAL: 'libraryRenewal',
  NOTICE_TO_PARENTS: 'noticeToParents'
};

const templates = {
  [EMAIL_TEMPLATE_KEYS.FEE_REMINDER]: ({ studentName, amountDue, dueDate }) => ({
    subject: `Fee Reminder - ${studentName}`,
    body: `Dear ${studentName},\n\nThis is a reminder that your pending fee amount is Rs. ${amountDue}.\nPlease complete the payment by ${dueDate}.\n\nRegards,\nClass Teacher\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.PERFORMANCE_REPORT]: ({ studentName, attendance, grade }) => ({
    subject: `Monthly Performance Report - ${studentName}`,
    body: `Dear Parent/Guardian,\n\nPlease find the latest academic update for ${studentName}.\nAttendance: ${attendance}%\nGrade: ${grade}\n\nFor detailed feedback, kindly contact the class teacher.\n\nRegards,\nClass Teacher\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.ATTENDANCE_WARNING]: ({ studentName, attendance }) => ({
    subject: `Attendance Alert - ${studentName}`,
    body: `Dear ${studentName},\n\nYour attendance is currently ${attendance}%, which is below the expected threshold.\nPlease maintain regular attendance to avoid academic impact.\n\nRegards,\nClass Teacher\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.BEHAVIOR_ALERT]: ({ studentName, incident }) => ({
    subject: `Behavior Notice - ${studentName}`,
    body: `Dear Parent/Guardian,\n\nA behavior incident was recorded for ${studentName}.\nDetails: ${incident}\n\nPlease discuss this with your ward and connect with school if needed.\n\nRegards,\nDiscipline Team\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.ASSIGNMENT_OVERDUE]: ({ studentName, assignmentTitle, dueDate }) => ({
    subject: `Overdue Assignment - ${assignmentTitle}`,
    body: `Dear ${studentName},\n\nYour assignment \"${assignmentTitle}\" is overdue (Due Date: ${dueDate}).\nPlease submit it at the earliest.\n\nRegards,\nSubject Teacher\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.APPRECIATION_NOTE]: ({ studentName, reason }) => ({
    subject: `Appreciation Note - ${studentName}`,
    body: `Dear ${studentName},\n\nGreat work! We appreciate your effort in: ${reason}.\nKeep up the excellent performance.\n\nRegards,\nTeacher\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.EXAM_SCHEDULE]: ({ studentName, examName, examDate }) => ({
    subject: `Exam Schedule Update - ${examName}`,
    body: `Dear ${studentName},\n\nThis is to inform you that ${examName} is scheduled on ${examDate}.\nPlease prepare accordingly.\n\nRegards,\nExamination Cell\nEduCore`
  }),
  [EMAIL_TEMPLATE_KEYS.LEAVE_REQUEST]: ({ teacherName, studentName, leaveDates, reason }) => ({
    subject: `Leave Request - ${studentName}`,
    body: `Dear ${teacherName},\n\nI am writing to request leave for ${leaveDates}.\nReason: ${reason}.\n\nKindly approve my leave request.\n\nRegards,\n${studentName}`
  }),
  [EMAIL_TEMPLATE_KEYS.ASSIGNMENT_HELP]: ({ teacherName, studentName, subjectName }) => ({
    subject: `Help Request - ${subjectName} Assignment`,
    body: `Dear ${teacherName},\n\nI need guidance on the ${subjectName} assignment.\nCould you please share additional help material or explain the difficult parts?\n\nRegards,\n${studentName}`
  }),
  [EMAIL_TEMPLATE_KEYS.LIBRARY_RENEWAL]: ({ teacherName, studentName, bookTitle, dueDate }) => ({
    subject: `Library Renewal Request - ${bookTitle}`,
    body: `Dear ${teacherName},\n\nI request renewal for the book "${bookTitle}" currently issued to me.\nCurrent due date: ${dueDate}.\n\nPlease approve if possible.\n\nRegards,\n${studentName}`
  }),
  [EMAIL_TEMPLATE_KEYS.NOTICE_TO_PARENTS]: ({ parentName, studentName, noticeTitle, noticeMessage, date }) => ({
    subject: `School Notice: ${noticeTitle}`,
    body: `Dear ${parentName},\n\nGreetings from FAMT Edu.\n\nA new notice has been issued regarding your ward ${studentName}:\n\nTitle: ${noticeTitle}\nDate: ${date}\n\nMessage:\n${noticeMessage}\n\nPlease take note of this information and contact the school if you have any questions.\n\nRegards,\nSchool Administration\nFAMT Edu`
  })
};

export const generateEmailFromTemplate = (templateKey, context = {}) => {
  const template = templates[templateKey];
  if (!template) {
    return {
      subject: 'EduCore Message',
      body: 'Hello,\n\nThis is a message from EduCore.\n\nRegards,\nEduCore Team'
    };
  }
  return template(context);
};

import { useAppStore } from '../store/useAppStore';

export const sendEmailDraft = ({ to, cc, templateKey, context = {} }) => {
  const recipient = (to || '').trim();
  if (!recipient) {
    throw new Error('Recipient email is missing.');
  }

  const { subject, body } = generateEmailFromTemplate(templateKey, context);
  
  // Use store to open in-app composer
  useAppStore.getState().setEmailDraft({
    to: recipient,
    cc,
    subject,
    body,
    templateKey,
    context
  });
};

export const EMAIL_TEMPLATE_CATALOG = [
  { id: 'T1', direction: 'Teacher -> Student/Parent', templateKey: EMAIL_TEMPLATE_KEYS.FEE_REMINDER, reason: 'Fee reminder' },
  { id: 'T2', direction: 'Teacher -> Student/Parent', templateKey: EMAIL_TEMPLATE_KEYS.PERFORMANCE_REPORT, reason: 'Performance report' },
  { id: 'T3', direction: 'Teacher -> Student', templateKey: EMAIL_TEMPLATE_KEYS.ATTENDANCE_WARNING, reason: 'Low attendance warning' },
  { id: 'T4', direction: 'Teacher -> Student/Parent', templateKey: EMAIL_TEMPLATE_KEYS.BEHAVIOR_ALERT, reason: 'Behavior incident alert' },
  { id: 'T5', direction: 'Teacher -> Student', templateKey: EMAIL_TEMPLATE_KEYS.ASSIGNMENT_OVERDUE, reason: 'Overdue assignment reminder' },
  { id: 'T6', direction: 'Teacher -> Student', templateKey: EMAIL_TEMPLATE_KEYS.APPRECIATION_NOTE, reason: 'Appreciation / positive feedback' },
  { id: 'T7', direction: 'Teacher -> Student', templateKey: EMAIL_TEMPLATE_KEYS.EXAM_SCHEDULE, reason: 'Exam schedule update' },
  { id: 'S1', direction: 'Student -> Teacher', templateKey: EMAIL_TEMPLATE_KEYS.LEAVE_REQUEST, reason: 'Leave request' },
  { id: 'S2', direction: 'Student -> Teacher', templateKey: EMAIL_TEMPLATE_KEYS.ASSIGNMENT_HELP, reason: 'Assignment help request' },
  { id: 'S3', direction: 'Student -> Teacher/Librarian', templateKey: EMAIL_TEMPLATE_KEYS.LIBRARY_RENEWAL, reason: 'Library renewal request' }
];
