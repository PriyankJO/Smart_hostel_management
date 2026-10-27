import { ROLES } from "../utils/roles.js";

export const staffAccounts = [
  { id: "STF-001", username: "admin", role: ROLES.ADMIN, name: "Admin Office", phone: "98765 00011", dob: "1985-01-15", email: "admin@hostel.com", shift: "Day Shift" },
  { id: "STF-002", username: "warden", role: ROLES.WARDEN, name: "Mr. Suresh Kumar", phone: "98765 12340", dob: "1978-04-12", email: "warden@hostel.com", shift: "Day Shift" },
  { id: "STF-003", username: "accountant", role: ROLES.ACCOUNTANT, name: "Mr. Ramesh Sharma", phone: "98765 12341", dob: "1980-05-15", email: "accountant@hostel.com", shift: "Day Shift" },
  { id: "STF-004", username: "canteen", role: ROLES.CANTEEN_MANAGER, name: "Mr. Prakash", phone: "98765 12342", dob: "1982-08-20", email: "canteen@hostel.com", shift: "Morning Shift" },
  { id: "STF-005", username: "staff", role: ROLES.STAFF, name: "Mr. Rajesh (Security)", phone: "98765 12343", dob: "1990-12-10", email: "rajesh@hostel.com", shift: "Night Shift" },
  { id: "STF-006", username: "plumber", role: ROLES.STAFF, name: "Raju (Plumber)", phone: "98765 12344", dob: "1988-03-22", email: "raju@hostel.com", shift: "On Call" },
  { id: "STF-007", username: "cleaner", role: ROLES.STAFF, name: "Sita (Cleaning)", phone: "98765 12345", dob: "1995-11-05", email: "sita@hostel.com", shift: "Morning Shift" },
  { id: "STF-008", username: "electrician", role: ROLES.STAFF, name: "Manoj (Electrician)", phone: "98765 12346", dob: "1985-06-18", email: "manoj@hostel.com", shift: "Day Shift" },
];

export const wardens = [
  { id: "WRD-001", name: "Mr. Suresh Kumar", phone: "98765 12340", dob: "1978-04-12", email: "warden@hostel.com" },
];

export const students = [
  { id: "STU-1043", name: "Rohit Sharma", room: "B-204", course: "B.Tech ECE, 2nd Yr", phone: "98765 11223", dob: "2006-07-22", feeStatus: "Due", attendance: 88, fatherName: "Manoj Sharma", address: "45, MG Road, Pune, Maharashtra", dateOfJoining: "2025-08-01", dateOfVacating: "" },
  { id: "STU-1044", name: "Priya Nair", room: "A-101", course: "B.Sc Physics, 1st Yr", phone: "98765 33445", dob: "2007-11-02", feeStatus: "Paid", attendance: 92, fatherName: "Ramesh Nair", address: "8, Marine Drive, Kochi, Kerala", dateOfJoining: "2025-08-01", dateOfVacating: "" },
  { id: "STU-1045", name: "Karthik Iyer", room: "A-101", course: "MBA, 1st Yr", phone: "98765 55667", dob: "2001-01-30", feeStatus: "Paid", attendance: 99, fatherName: "Venkatesh Iyer", address: "23, Anna Nagar, Chennai, Tamil Nadu", dateOfJoining: "2025-08-05", dateOfVacating: "" },
  { id: "STU-1046", name: "Sneha Patil", room: "C-310", course: "B.Tech Civil, 4th Yr", phone: "98765 77889", dob: "2004-05-18", feeStatus: "Overdue", attendance: 74, fatherName: "Vijay Patil", address: "56, FC Road, Pune, Maharashtra", dateOfJoining: "2024-07-20", dateOfVacating: "" },
  { id: "STU-1047", name: "Arjun Mehta", room: "C-310", course: "B.Tech Mech, 2nd Yr", phone: "98765 99001", dob: "2005-09-09", feeStatus: "Paid", attendance: 90, fatherName: "Deepak Mehta", address: "3, SG Highway, Ahmedabad, Gujarat", dateOfJoining: "2025-08-01", dateOfVacating: "" },
  { id: "STU-1048", name: "Neha Gupta", room: "B-205", course: "B.Com, 2nd Yr", phone: "98765 22110", dob: "2006-02-15", feeStatus: "Paid", attendance: 85, fatherName: "Rajesh Gupta", address: "101, Civil Lines, Jaipur, Rajasthan", dateOfJoining: "2025-08-10", dateOfVacating: "" },
  { id: "STU-1049", name: "Vikas Singh", room: "B-205", course: "MCA, 1st Yr", phone: "98765 44550", dob: "2002-12-05", feeStatus: "Due", attendance: 78, fatherName: "Ranjit Singh", address: "Plot 12, Sector 4, Noida, UP", dateOfJoining: "2025-08-10", dateOfVacating: "" },
  { id: "STU-1050", name: "Simran Kaur", room: "A-102", course: "B.Arch, 5th Yr", phone: "98765 88990", dob: "2003-08-25", feeStatus: "Paid", attendance: 94, fatherName: "Jasbir Singh", address: "Block C, Ranjit Avenue, Amritsar, Punjab", dateOfJoining: "2023-08-01", dateOfVacating: "" },
  { id: "STU-1051", name: "Deepak Verma", room: "C-311", course: "B.Tech CSE, 1st Yr", phone: "98765 66770", dob: "2007-04-10", feeStatus: "Overdue", attendance: 65, fatherName: "Sunil Verma", address: "15/2, MG Road, Bangalore, Karnataka", dateOfJoining: "2025-09-01", dateOfVacating: "" }
];

export const rooms = [
  { number: "A-101", block: "A", capacity: 2, occupied: 2, type: "Double Sharing" },
  { number: "A-102", block: "A", capacity: 2, occupied: 1, type: "Double Sharing" },
  { number: "B-204", block: "B", capacity: 2, occupied: 2, type: "Double Sharing" },
  { number: "B-205", block: "B", capacity: 3, occupied: 0, type: "Triple Sharing" },
  { number: "C-310", block: "C", capacity: 2, occupied: 2, type: "Double Sharing" },
  { number: "C-311", block: "C", capacity: 1, occupied: 0, type: "Single" },
];

export const fees = [
  // Ananya Rao History
  { id: "RCPT-8801", student: "Ananya Rao", studentId: "STU-1042", amount: 45000, date: "2026-03-02", status: "Paid" },
  { id: "RCPT-8820", student: "Ananya Rao", studentId: "STU-1042", amount: 45000, date: "2026-05-02", status: "Paid" },
  { id: "RCPT-8841", student: "Ananya Rao", studentId: "STU-1042", amount: 45000, date: "2026-06-02", status: "Paid" },
  
  // Rohit Sharma History
  { id: "RCPT-8802", student: "Rohit Sharma", studentId: "STU-1043", amount: 45000, date: "2026-03-05", status: "Paid" },
  { id: "RCPT-8821", student: "Rohit Sharma", studentId: "STU-1043", amount: 45000, date: "2026-05-10", status: "Paid" },
  { id: "RCPT-8845", student: "Rohit Sharma", studentId: "STU-1043", amount: 45000, date: "—", status: "Due" },

  // Priya Nair History
  { id: "RCPT-8803", student: "Priya Nair", studentId: "STU-1044", amount: 45000, date: "2026-03-10", status: "Paid" },
  { id: "RCPT-8822", student: "Priya Nair", studentId: "STU-1044", amount: 45000, date: "2026-05-05", status: "Paid" },
  { id: "RCPT-8842", student: "Priya Nair", studentId: "STU-1044", amount: 45000, date: "2026-06-05", status: "Paid" },

  // Karthik Iyer History
  { id: "RCPT-8804", student: "Karthik Iyer", studentId: "STU-1045", amount: 52000, date: "2026-03-12", status: "Paid" },
  { id: "RCPT-8843", student: "Karthik Iyer", studentId: "STU-1045", amount: 52000, date: "2026-06-06", status: "Paid" },

  // Sneha Patil History
  { id: "RCPT-8805", student: "Sneha Patil", studentId: "STU-1046", amount: 45000, date: "2026-03-20", status: "Paid" },
  { id: "RCPT-8825", student: "Sneha Patil", studentId: "STU-1046", amount: 45000, date: "—", status: "Overdue" },
  { id: "RCPT-8846", student: "Sneha Patil", studentId: "STU-1046", amount: 45000, date: "—", status: "Overdue" },

  // Arjun Mehta History
  { id: "RCPT-8844", student: "Arjun Mehta", studentId: "STU-1047", amount: 45000, date: "2026-06-10", status: "Paid" },

  // New Students
  { id: "RCPT-8850", student: "Neha Gupta", studentId: "STU-1048", amount: 45000, date: "2026-06-12", status: "Paid" },
  { id: "RCPT-8851", student: "Vikas Singh", studentId: "STU-1049", amount: 52000, date: "—", status: "Due" },
  { id: "RCPT-8852", student: "Simran Kaur", studentId: "STU-1050", amount: 45000, date: "2026-06-01", status: "Paid" },
  { id: "RCPT-8853", student: "Deepak Verma", studentId: "STU-1051", amount: 45000, date: "—", status: "Overdue" },
];

export const attendanceTrend = [
  { month: "Feb", pct: 91 },
  { month: "Mar", pct: 89 },
  { month: "Apr", pct: 93 },
  { month: "May", pct: 87 },
  { month: "Jun", pct: 94 },
  { month: "Jul", pct: 90 },
];

export const leaveRequests = [
  // Student Leaves
  { id: "LR-210", student: "Ananya Rao", studentId: "STU-1042", from: "2026-05-10", to: "2026-05-12", reason: "Fever and weakness", status: "Approved" },
  { id: "LR-221", student: "Ananya Rao", studentId: "STU-1042", from: "2026-07-28", to: "2026-07-30", reason: "Family function at home", status: "Pending" },
  
  { id: "LR-205", student: "Rohit Sharma", studentId: "STU-1043", from: "2026-04-15", to: "2026-04-16", reason: "Going hometown for festival", status: "Approved" },
  { id: "LR-222", student: "Rohit Sharma", studentId: "STU-1043", from: "2026-07-26", to: "2026-07-27", reason: "Medical checkup", status: "Approved" },
  
  { id: "LR-212", student: "Priya Nair", studentId: "STU-1044", from: "2026-06-01", to: "2026-06-05", reason: "Attending cousin's wedding in Kerala", status: "Approved" },
  
  { id: "LR-223", student: "Sneha Patil", studentId: "STU-1046", from: "2026-08-01", to: "2026-08-03", reason: "Sister's wedding", status: "Pending" },
  { id: "LR-218", student: "Sneha Patil", studentId: "STU-1046", from: "2026-05-20", to: "2026-05-21", reason: "Not feeling well", status: "Approved" },

  { id: "LR-224", student: "Arjun Mehta", studentId: "STU-1047", from: "2026-07-20", to: "2026-07-21", reason: "Personal work", status: "Rejected" },
  
  { id: "LR-228", student: "Vikas Singh", studentId: "STU-1049", from: "2026-08-10", to: "2026-08-12", reason: "Attending hackathon in Delhi", status: "Pending" },

  // Staff Leaves
  { id: "LR-225", student: "Mr. Rajesh (Security)", studentId: "Mr. Rajesh (Security)", from: "2026-07-15", to: "2026-07-16", reason: "Fever and cold", status: "Approved", isStaff: true },
  { id: "LR-226", student: "Manoj (Electrician)", studentId: "Manoj (Electrician)", from: "2026-08-05", to: "2026-08-06", reason: "Family emergency", status: "Pending", isStaff: true },
];

export const complaints = [
  { id: "CMP-490", student: "Ananya Rao", room: "B-204", category: "Cleaning", detail: "Room not cleaned for 3 days", status: "Resolved", date: "2026-06-15" },
  { id: "CMP-505", student: "Ananya Rao", room: "B-204", category: "Furniture", detail: "Study table chair is broken", status: "Open", date: "2026-07-26" },

  { id: "CMP-491", student: "Rohit Sharma", room: "B-204", category: "Electrical", detail: "Tubelight fused", status: "Resolved", date: "2026-05-10" },
  { id: "CMP-504", student: "Rohit Sharma", room: "B-204", category: "Internet", detail: "WiFi very slow in evenings", status: "Open", date: "2026-07-23" },

  { id: "CMP-503", student: "Priya Nair", room: "A-101", category: "Cleaning", detail: "Corridor not swept for 2 days", status: "Resolved", date: "2026-07-15" },
  { id: "CMP-506", student: "Priya Nair", room: "A-101", category: "Electrical", detail: "A/C remote not working", status: "In Progress", date: "2026-07-25" },

  { id: "CMP-501", student: "Karthik Iyer", room: "A-101", category: "Electrical", detail: "Ceiling fan making noise", status: "Open", date: "2026-07-22" },
  { id: "CMP-498", student: "Karthik Iyer", room: "A-101", category: "Internet", detail: "Unable to connect to WiFi", status: "Resolved", date: "2026-06-20" },

  { id: "CMP-502", student: "Sneha Patil", room: "C-310", category: "Plumbing", detail: "Leaking tap in washroom", status: "In Progress", date: "2026-07-20" },

  { id: "CMP-508", student: "Deepak Verma", room: "C-311", category: "Plumbing", detail: "Flush not working properly", status: "Open", date: "2026-07-28" },
];

export const visitors = [
  { id: "VIS-3301", name: "Mrs. Lakshmi Rao", toMeet: "Ananya Rao", purpose: "Parent visit", in: "2026-07-24 10:15", out: "2026-07-24 13:40" },
  { id: "VIS-3302", name: "Vikram Sharma", toMeet: "Rohit Sharma", purpose: "Friend visit", in: "2026-07-24 16:00", out: "—" },
  { id: "VIS-3303", name: "Courier – BlueDart", toMeet: "Karthik Iyer", purpose: "Parcel delivery", in: "2026-07-25 11:20", out: "2026-07-25 11:25" },
];

export const messMenu = {
  Monday: { breakfast: "Idli, Sambar, Chutney", lunch: "Rice, Dal, Mixed Veg, Curd", dinner: "Chapati, Paneer Curry, Rice" },
  Tuesday: { breakfast: "Poha, Tea", lunch: "Rice, Rasam, Beans Curry, Papad", dinner: "Chapati, Egg Curry, Rice" },
  Wednesday: { breakfast: "Upma, Banana", lunch: "Rice, Sambar, Cabbage Curry, Curd", dinner: "Fried Rice, Gobi Manchurian" },
  Thursday: { breakfast: "Dosa, Chutney", lunch: "Rice, Dal, Aloo Curry, Papad", dinner: "Chapati, Chicken Curry, Rice" },
  Friday: { breakfast: "Bread Omelette / Toast", lunch: "Veg Biryani, Raita", dinner: "Chapati, Mixed Veg, Rice" },
  Saturday: { breakfast: "Idli, Vada, Chutney", lunch: "Rice, Sambar, Potato Fry, Curd", dinner: "Chapati, Dal Makhani, Rice" },
  Sunday: { breakfast: "Puri, Bhaji", lunch: "Chicken Biryani / Veg Pulao, Raita", dinner: "Chapati, Paneer Butter Masala" },
};

export const notices = [
  { id: 1, title: "Hostel fee for August due by 5th Aug", date: "2026-07-23", tag: "Fees", content: "Dear students, please ensure that your hostel mess and accommodation fees for the month of August are paid on or before the 5th of August. Late payments will incur a penalty of ₹100 per day. Please contact the accounts office for any discrepancies." },
  { id: 2, title: "Water supply maintenance on 27th Jul, 10 AM–2 PM", date: "2026-07-22", tag: "Maintenance", content: "There will be a scheduled maintenance of the main water overhead tanks on the 27th of July. As a result, water supply will be disrupted across all blocks between 10:00 AM and 2:00 PM. Kindly store sufficient water for your use during this period." },
  { id: 3, title: "Annual hostel day cultural night — 2nd Aug", date: "2026-07-20", tag: "Event", content: "Get ready for the biggest event of the year! The Annual Hostel Day Cultural Night will be held on the 2nd of August in the main courtyard. Events include group dance, solo singing, and a special DJ night. Interested participants please register with the cultural secretary by the 28th of July." },
  { id: 4, title: "New WiFi router installed in Block C", date: "2026-07-18", tag: "Facility", content: "To address connectivity issues, a brand new high-speed WiFi router has been installed on the 3rd floor of Block C. The network name is 'Hostel-BlockC-5G'. The password remains the same as the previous network." },
];

export const canteenTransactions = [
  { id: "CNT-001", date: "2026-06-03", description: "Vegetables & groceries", category: "Groceries", type: "Expense", amount: 18500 },
  { id: "CNT-002", date: "2026-06-05", description: "LPG gas refill (4 cylinders)", category: "Utilities", type: "Expense", amount: 6200 },
  { id: "CNT-003", date: "2026-06-10", description: "Canteen staff wages — June", category: "Wages", type: "Expense", amount: 24000 },
  { id: "CNT-004", date: "2026-06-30", description: "Student meal coupon sales — June", category: "Meal Sales", type: "Income", amount: 68000 },
  { id: "CNT-005", date: "2026-07-02", description: "Rice & grains bulk purchase", category: "Groceries", type: "Expense", amount: 21400 },
  { id: "CNT-006", date: "2026-07-04", description: "Vegetables & dairy", category: "Groceries", type: "Expense", amount: 15800 },
  { id: "CNT-007", date: "2026-07-08", description: "LPG gas refill (3 cylinders)", category: "Utilities", type: "Expense", amount: 4650 },
  { id: "CNT-008", date: "2026-07-12", description: "Canteen equipment repair", category: "Maintenance", type: "Expense", amount: 3200 },
  { id: "CNT-009", date: "2026-07-15", description: "Canteen staff wages — July", category: "Wages", type: "Expense", amount: 24000 },
  { id: "CNT-010", date: "2026-07-20", description: "Guest / outsider meal sales", category: "Meal Sales", type: "Income", amount: 9200 },
  { id: "CNT-011", date: "2026-07-31", description: "Student meal coupon sales — July", category: "Meal Sales", type: "Income", amount: 71500 },
  { id: "CNT-012", date: "2026-08-05", description: "Vegetables, dairy & fresh produce", category: "Groceries", type: "Expense", amount: 19500 },
  { id: "CNT-013", date: "2026-08-10", description: "LPG gas refill (5 cylinders)", category: "Utilities", type: "Expense", amount: 7750 },
  { id: "CNT-014", date: "2026-08-15", description: "Canteen staff wages — August", category: "Wages", type: "Expense", amount: 24000 },
  { id: "CNT-015", date: "2026-08-31", description: "Student meal coupon sales — August", category: "Meal Sales", type: "Income", amount: 75200 },
  { id: "CNT-016", date: "2026-09-02", description: "Rice, grains & cooking oil bulk", category: "Groceries", type: "Expense", amount: 23100 },
  { id: "CNT-017", date: "2026-09-10", description: "Plumbing repair in kitchen", category: "Maintenance", type: "Expense", amount: 1850 },
  { id: "CNT-018", date: "2026-09-15", description: "Guest / outsider meal sales", category: "Meal Sales", type: "Income", amount: 12500 },
];

export const salaryRecords = [
  // Admin
  { id: "SAL-101", staffId: "STF-001", staffName: "Admin Office", role: "Admin", month: "2026-05", basic: 45000, allowances: 5000, deductions: 2000, netPay: 48000, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-102", staffId: "STF-001", staffName: "Admin Office", role: "Admin", month: "2026-06", basic: 45000, allowances: 5000, deductions: 2000, netPay: 48000, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-103", staffId: "STF-001", staffName: "Admin Office", role: "Admin", month: "2026-07", basic: 45000, allowances: 5000, deductions: 2000, netPay: 48000, status: "Paid", paidOn: "2026-07-31" },

  // Warden
  { id: "SAL-201", staffId: "STF-002", staffName: "Mr. Suresh Kumar", role: "Warden", month: "2026-05", basic: 28000, allowances: 3000, deductions: 1200, netPay: 29800, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-202", staffId: "STF-002", staffName: "Mr. Suresh Kumar", role: "Warden", month: "2026-06", basic: 28000, allowances: 3000, deductions: 1200, netPay: 29800, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-203", staffId: "STF-002", staffName: "Mr. Suresh Kumar", role: "Warden", month: "2026-07", basic: 28000, allowances: 3000, deductions: 1200, netPay: 29800, status: "Pending", paidOn: "" },

  // Accountant
  { id: "SAL-301", staffId: "STF-003", staffName: "Mr. Ramesh Sharma", role: "Accountant", month: "2026-05", basic: 32000, allowances: 4000, deductions: 1500, netPay: 34500, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-302", staffId: "STF-003", staffName: "Mr. Ramesh Sharma", role: "Accountant", month: "2026-06", basic: 32000, allowances: 4000, deductions: 1500, netPay: 34500, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-303", staffId: "STF-003", staffName: "Mr. Ramesh Sharma", role: "Accountant", month: "2026-07", basic: 32000, allowances: 4000, deductions: 1500, netPay: 34500, status: "Paid", paidOn: "2026-07-31" },

  // Rajesh (Security)
  { id: "SAL-401", staffId: "STF-005", staffName: "Mr. Rajesh (Security)", role: "Staff", month: "2026-03", basic: 18000, allowances: 1000, deductions: 0, netPay: 19000, status: "Paid", paidOn: "2026-03-31" },
  { id: "SAL-402", staffId: "STF-005", staffName: "Mr. Rajesh (Security)", role: "Staff", month: "2026-04", basic: 18000, allowances: 1000, deductions: 0, netPay: 19000, status: "Paid", paidOn: "2026-04-30" },
  { id: "SAL-403", staffId: "STF-005", staffName: "Mr. Rajesh (Security)", role: "Staff", month: "2026-05", basic: 18000, allowances: 1000, deductions: 0, netPay: 19000, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-404", staffId: "STF-005", staffName: "Mr. Rajesh (Security)", role: "Staff", month: "2026-06", basic: 18000, allowances: 1000, deductions: 0, netPay: 19000, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-405", staffId: "STF-005", staffName: "Mr. Rajesh (Security)", role: "Staff", month: "2026-07", basic: 18000, allowances: 1000, deductions: 500, netPay: 18500, status: "Paid", paidOn: "2026-07-31" },

  // Raju (Plumber)
  { id: "SAL-501", staffId: "STF-006", staffName: "Raju (Plumber)", role: "Staff", month: "2026-05", basic: 15000, allowances: 500, deductions: 0, netPay: 15500, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-502", staffId: "STF-006", staffName: "Raju (Plumber)", role: "Staff", month: "2026-06", basic: 15000, allowances: 500, deductions: 0, netPay: 15500, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-503", staffId: "STF-006", staffName: "Raju (Plumber)", role: "Staff", month: "2026-07", basic: 15000, allowances: 500, deductions: 0, netPay: 15500, status: "Paid", paidOn: "2026-07-31" },

  // Sita (Cleaning)
  { id: "SAL-601", staffId: "STF-007", staffName: "Sita (Cleaning)", role: "Staff", month: "2026-04", basic: 12000, allowances: 500, deductions: 0, netPay: 12500, status: "Paid", paidOn: "2026-04-30" },
  { id: "SAL-602", staffId: "STF-007", staffName: "Sita (Cleaning)", role: "Staff", month: "2026-05", basic: 12000, allowances: 500, deductions: 0, netPay: 12500, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-603", staffId: "STF-007", staffName: "Sita (Cleaning)", role: "Staff", month: "2026-06", basic: 12000, allowances: 500, deductions: 0, netPay: 12500, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-604", staffId: "STF-007", staffName: "Sita (Cleaning)", role: "Staff", month: "2026-07", basic: 12000, allowances: 500, deductions: 0, netPay: 12500, status: "Paid", paidOn: "2026-07-31" },

  // Manoj (Electrician)
  { id: "SAL-701", staffId: "STF-008", staffName: "Manoj (Electrician)", role: "Staff", month: "2026-05", basic: 16000, allowances: 800, deductions: 0, netPay: 16800, status: "Paid", paidOn: "2026-05-31" },
  { id: "SAL-702", staffId: "STF-008", staffName: "Manoj (Electrician)", role: "Staff", month: "2026-06", basic: 16000, allowances: 800, deductions: 0, netPay: 16800, status: "Paid", paidOn: "2026-06-30" },
  { id: "SAL-703", staffId: "STF-008", staffName: "Manoj (Electrician)", role: "Staff", month: "2026-07", basic: 16000, allowances: 800, deductions: 0, netPay: 16800, status: "Paid", paidOn: "2026-07-31" },
];

export const staffAttendanceRecords = [
  // Rajesh (Security) STF-005
  { staffId: "STF-005", staffName: "Mr. Rajesh (Security)", date: "2026-07-28", status: "Present", timeIn: "08:00 AM", timeOut: "04:30 PM", source: "Biometric" },
  { staffId: "STF-005", staffName: "Mr. Rajesh (Security)", date: "2026-07-29", status: "Present", timeIn: "07:55 AM", timeOut: "04:15 PM", source: "Biometric" },
  { staffId: "STF-005", staffName: "Mr. Rajesh (Security)", date: "2026-07-30", status: "Present", timeIn: "08:10 AM", timeOut: "04:40 PM", source: "Biometric" },
  { staffId: "STF-005", staffName: "Mr. Rajesh (Security)", date: "2026-07-31", status: "Present", timeIn: "07:50 AM", timeOut: "04:05 PM", source: "Biometric" },
  { staffId: "STF-005", staffName: "Mr. Rajesh (Security)", date: "2026-08-01", status: "Present", timeIn: "08:05 AM", timeOut: "04:35 PM", source: "Biometric" },
  { staffId: "STF-005", staffName: "Mr. Rajesh (Security)", date: "2026-08-02", status: "Absent", timeIn: "—", timeOut: "—", source: "System" },

  // Raju (Plumber) STF-006
  { staffId: "STF-006", staffName: "Raju (Plumber)", date: "2026-07-28", status: "Present", timeIn: "09:00 AM", timeOut: "06:00 PM", source: "Biometric" },
  { staffId: "STF-006", staffName: "Raju (Plumber)", date: "2026-07-29", status: "Absent", timeIn: "—", timeOut: "—", source: "System" },
  { staffId: "STF-006", staffName: "Raju (Plumber)", date: "2026-07-30", status: "Present", timeIn: "08:50 AM", timeOut: "05:40 PM", source: "Biometric" },

  // Sita (Cleaning) STF-007
  { staffId: "STF-007", staffName: "Sita (Cleaning)", date: "2026-07-28", status: "Present", timeIn: "06:30 AM", timeOut: "02:30 PM", source: "Biometric" },
  { staffId: "STF-007", staffName: "Sita (Cleaning)", date: "2026-07-29", status: "Present", timeIn: "06:35 AM", timeOut: "02:45 PM", source: "Biometric" },
  { staffId: "STF-007", staffName: "Sita (Cleaning)", date: "2026-07-30", status: "Present", timeIn: "06:25 AM", timeOut: "02:20 PM", source: "Biometric" },
  
  // Manoj (Electrician) STF-008
  { staffId: "STF-008", staffName: "Manoj (Electrician)", date: "2026-07-28", status: "Present", timeIn: "08:15 AM", timeOut: "05:00 PM", source: "Biometric" },
  { staffId: "STF-008", staffName: "Manoj (Electrician)", date: "2026-07-29", status: "Present", timeIn: "08:20 AM", timeOut: "05:15 PM", source: "Biometric" },
];

export const canteenMenuItems = [
  {
    id: "ITEM-001",
    name: "Masala Dosa",
    category: "South Indian",
    price: 50,
    isVeg: true,
    status: "Available",
    mealTiming: "Breakfast",
    description: "Crispy golden rice crepe filled with spiced potato masala, served with sambar and coconut chutney."
  },
  {
    id: "ITEM-002",
    name: "Idli Sambar (2 pcs)",
    category: "South Indian",
    price: 35,
    isVeg: true,
    status: "Available",
    mealTiming: "Breakfast",
    description: "Steamed fluffy rice cakes served with hot vegetable sambar and freshly ground coconut chutney."
  },
  {
    id: "ITEM-003",
    name: "Medu Vada (2 pcs)",
    category: "South Indian",
    price: 40,
    isVeg: true,
    status: "Available",
    mealTiming: "Breakfast",
    description: "Crispy deep-fried lentil doughnuts seasoned with whole black pepper and curry leaves."
  },
  {
    id: "ITEM-004",
    name: "Crispy Samosa (2 pcs)",
    category: "Snacks & Fast Food",
    price: 30,
    isVeg: true,
    status: "Available",
    mealTiming: "Evening Snacks",
    description: "Flaky pastry pockets stuffed with spiced potatoes and peas, served with mint & tamarind chutney."
  },
  {
    id: "ITEM-005",
    name: "Veg Cheese Grilled Sandwich",
    category: "Snacks & Fast Food",
    price: 60,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Grilled jumbo bread layered with sliced veggies, mint spread and melted mozzarella cheese."
  },
  {
    id: "ITEM-006",
    name: "Paneer Kathi Roll",
    category: "Snacks & Fast Food",
    price: 75,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Crispy paratha wrap stuffed with tandoori spiced paneer cubes, onions and mint mayonnaise."
  },
  {
    id: "ITEM-007",
    name: "Classic Masala Maggi",
    category: "Snacks & Fast Food",
    price: 40,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Steaming hot Maggi noodles tossed with green peas, onions, tomatoes and signature spices."
  },
  {
    id: "ITEM-008",
    name: "Cheese Egg Maggi",
    category: "Snacks & Fast Food",
    price: 65,
    isVeg: false,
    status: "Available",
    mealTiming: "All Day",
    description: "Hostel special spicy Maggi loaded with scrambled egg and rich cheddar cheese."
  },
  {
    id: "ITEM-009",
    name: "Veg Fried Rice with Manchurian",
    category: "Meals & Combos",
    price: 90,
    isVeg: true,
    status: "Available",
    mealTiming: "Lunch",
    description: "Wok-fried aromatic rice with crunchy vegetables paired with piping hot veg Manchurian balls in sauce."
  },
  {
    id: "ITEM-010",
    name: "Special Veg Thali",
    category: "Meals & Combos",
    price: 110,
    isVeg: true,
    status: "Available",
    mealTiming: "Lunch",
    description: "Complete meal with 2 Chapatis, Shahi Paneer, Dal Fry, Jeera Rice, Curd, Papad, Pickle & Gulab Jamun."
  },
  {
    id: "ITEM-011",
    name: "Chicken Dum Biryani",
    category: "Meals & Combos",
    price: 140,
    isVeg: false,
    status: "Available",
    mealTiming: "Dinner",
    description: "Fragrant basmati rice layered with slow-cooked marinated chicken, served with raita & gravy."
  },
  {
    id: "ITEM-012",
    name: "South Indian Filter Coffee",
    category: "Beverages & Drinks",
    price: 20,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Traditional Kumbakonam style decoction coffee frothed to perfection with boiling fresh milk."
  },
  {
    id: "ITEM-013",
    name: "Special Ginger Masala Chai",
    category: "Beverages & Drinks",
    price: 15,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Kadak Assam milk tea boiled with crushed fresh ginger, green cardamom and cloves."
  },
  {
    id: "ITEM-014",
    name: "Cold Coffee with Vanilla Float",
    category: "Beverages & Drinks",
    price: 55,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Thick chilled blended coffee topped with dark chocolate drizzle and a scoop of vanilla ice cream."
  },
  {
    id: "ITEM-015",
    name: "Fresh Mosambi / Orange Juice",
    category: "Beverages & Drinks",
    price: 45,
    isVeg: true,
    status: "Available",
    mealTiming: "All Day",
    description: "Cold-pressed fresh sweet lime juice lightly seasoned with black salt."
  },
  {
    id: "ITEM-016",
    name: "Hot Gulab Jamun (2 pcs)",
    category: "Desserts",
    price: 35,
    isVeg: true,
    status: "Available",
    mealTiming: "Dinner",
    description: "Golden brown mawa dumplings steeped in cardamom-scented warm saffron sugar syrup."
  },
  {
    id: "ITEM-017",
    name: "Sizzling Chocolate Brownie",
    category: "Desserts",
    price: 60,
    isVeg: true,
    status: "Out of Stock",
    mealTiming: "All Day",
    description: "Rich dark chocolate walnut brownie served warm with a splash of hot chocolate ganache."
  }
];

export const financeTransactions = [
  {
    id: "TXN-801",
    date: "2026-07-28",
    title: "Monthly Electricity Bill - Blocks A & B",
    category: "Utilities & Bills",
    type: "Expense",
    amount: 34500,
    paymentMethod: "Bank Transfer / NEFT",
    payerPayee: "BESCOM Power Supply Ltd",
    reference: "BES-JUL-9921",
    status: "Paid",
    notes: "Main power meter reading bill cleared for hostel campus."
  },
  {
    id: "TXN-802",
    date: "2026-07-26",
    title: "Hostel New Admission Registrations (Batch B)",
    category: "Admission & Registration",
    type: "Income",
    amount: 75000,
    paymentMethod: "UPI / QR",
    payerPayee: "Admissions Desk",
    reference: "UPI-AD-77401",
    status: "Paid",
    notes: "Registration fees for 15 newly joining second-year transfer students."
  },
  {
    id: "TXN-803",
    date: "2026-07-25",
    title: "Water Tanker Refill (4 Tankers)",
    category: "Utilities & Bills",
    type: "Expense",
    amount: 6800,
    paymentMethod: "Cash",
    payerPayee: "Cauvery Water Supplies",
    reference: "CS-TNK-441",
    status: "Paid",
    notes: "Additional water replenishment for underground sump."
  },
  {
    id: "TXN-804",
    date: "2026-07-23",
    title: "Mess Provisions & Grain Bulk Purchase",
    category: "Mess & Groceries",
    type: "Expense",
    amount: 28400,
    paymentMethod: "Bank Transfer / NEFT",
    payerPayee: "APMC Market Wholesale Traders",
    reference: "APMC-INV-1102",
    status: "Paid",
    notes: "Basmati rice, wheat flour, cooking oils and lentils consignment."
  },
  {
    id: "TXN-805",
    date: "2026-07-22",
    title: "Late Room Fee Penalty Collections",
    category: "Fines & Penalties",
    type: "Income",
    amount: 4500,
    paymentMethod: "Cash",
    payerPayee: "Student Accounts Counter",
    reference: "FINE-JUL-22",
    status: "Paid",
    notes: "Fine collected from overdue student room fee defaults."
  },
  {
    id: "TXN-806",
    date: "2026-07-20",
    title: "Campus Optical Fiber Internet Lease",
    category: "Internet & Wi-Fi",
    type: "Expense",
    amount: 12000,
    paymentMethod: "Bank Transfer / NEFT",
    payerPayee: "Airtel Enterprise Broadband",
    reference: "AIR-BB-88912",
    status: "Paid",
    notes: "1 Gbps dedicated leased line renewal for academic hostel network."
  },
  {
    id: "TXN-807",
    date: "2026-07-18",
    title: "Hostel Canteen Monthly Revenue Remittance",
    category: "Canteen Revenue",
    type: "Income",
    amount: 68000,
    paymentMethod: "Bank Transfer / NEFT",
    payerPayee: "Hostel Canteen Desk",
    reference: "CNT-REM-0726",
    status: "Paid",
    notes: "Net profit share remitted to hostel general fund."
  },
  {
    id: "TXN-808",
    date: "2026-07-15",
    title: "Campus Pest Control & Deep Fumigation",
    category: "Facility Maintenance",
    type: "Expense",
    amount: 8500,
    paymentMethod: "Cheque",
    payerPayee: "PestShield Cleaners",
    reference: "CHQ-882190",
    status: "Paid",
    notes: "Quarterly anti-termite and sanitization drive across all hostels."
  },
  {
    id: "TXN-809",
    date: "2026-07-10",
    title: "Guest Room Booking Charges (Parent Visits)",
    category: "Guest Room Rent",
    type: "Income",
    amount: 9200,
    paymentMethod: "UPI / QR",
    payerPayee: "Guest House Front Office",
    reference: "UPI-GH-10992",
    status: "Paid",
    notes: "Accommodations charges for visiting parents."
  },
  {
    id: "TXN-810",
    date: "2026-07-05",
    title: "Fire Extinguisher Safety Inspection & Refill",
    category: "Facility Maintenance",
    type: "Expense",
    amount: 5400,
    paymentMethod: "Bank Transfer / NEFT",
    payerPayee: "SafeGuard Fire Equipment Co",
    reference: "SGF-7712",
    status: "Paid",
    notes: "Annual safety certificate inspection."
  }
];


