export const students = [
  { id: "STU-1042", name: "Ananya Rao", room: "B-204", course: "B.Tech CSE, 3rd Yr", phone: "98765 43210", dob: "2005-03-14", feeStatus: "Paid", attendance: 96, fatherName: "Suresh Rao", address: "12, Gandhi Street, Chennai, Tamil Nadu" },
  { id: "STU-1043", name: "Rohit Sharma", room: "B-204", course: "B.Tech ECE, 2nd Yr", phone: "98765 11223", dob: "2006-07-22", feeStatus: "Due", attendance: 88, fatherName: "Manoj Sharma", address: "45, MG Road, Pune, Maharashtra" },
  { id: "STU-1044", name: "Priya Nair", room: "A-101", course: "B.Sc Physics, 1st Yr", phone: "98765 33445", dob: "2007-11-02", feeStatus: "Paid", attendance: 92, fatherName: "Ramesh Nair", address: "8, Marine Drive, Kochi, Kerala" },
  { id: "STU-1045", name: "Karthik Iyer", room: "A-101", course: "MBA, 1st Yr", phone: "98765 55667", dob: "2001-01-30", feeStatus: "Paid", attendance: 99, fatherName: "Venkatesh Iyer", address: "23, Anna Nagar, Chennai, Tamil Nadu" },
  { id: "STU-1046", name: "Sneha Patil", room: "C-310", course: "B.Tech Civil, 4th Yr", phone: "98765 77889", dob: "2004-05-18", feeStatus: "Overdue", attendance: 74, fatherName: "Vijay Patil", address: "56, FC Road, Pune, Maharashtra" },
  { id: "STU-1047", name: "Arjun Mehta", room: "C-310", course: "B.Tech Mech, 2nd Yr", phone: "98765 99001", dob: "2005-09-09", feeStatus: "Paid", attendance: 90, fatherName: "Deepak Mehta", address: "3, SG Highway, Ahmedabad, Gujarat" },
];

export const leaveRequests = [
  { id: "LR-221", student: "Ananya Rao", studentId: "STU-1042", from: "2026-07-28", to: "2026-07-30", reason: "Family function at home", status: "Pending" },
  { id: "LR-222", student: "Rohit Sharma", studentId: "STU-1043", from: "2026-07-26", to: "2026-07-27", reason: "Medical checkup", status: "Approved" },
  { id: "LR-223", student: "Sneha Patil", studentId: "STU-1046", from: "2026-08-01", to: "2026-08-03", reason: "Sister's wedding", status: "Pending" },
  { id: "LR-224", student: "Arjun Mehta", studentId: "STU-1047", from: "2026-07-20", to: "2026-07-21", reason: "Personal work", status: "Rejected" },
];

export const attendanceTrend = [
  { month: "Feb", pct: 91 },
  { month: "Mar", pct: 89 },
  { month: "Apr", pct: 93 },
  { month: "May", pct: 87 },
  { month: "Jun", pct: 94 },
  { month: "Jul", pct: 90 },
];
