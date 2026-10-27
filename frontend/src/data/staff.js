import { ROLES } from "../utils/roles";

export const staffAccounts = [
  { username: "admin", role: ROLES.ADMIN, name: "Admin Office", phone: "98765 00011", dob: "1985-01-15", email: "admin@hostel.com" },
  { username: "warden", role: ROLES.WARDEN, name: "Mr. Suresh Kumar", phone: "98765 12340", dob: "1978-04-12", email: "warden@hostel.com" },
  { username: "accountant", role: ROLES.ACCOUNTANT, name: "Mr. Ramesh Sharma", phone: "98765 12341", dob: "1980-05-15", email: "accountant@hostel.com" },
  { username: "canteen", role: ROLES.CANTEEN_MANAGER, name: "Mr. Prakash", phone: "98765 12342", dob: "1982-08-20", email: "canteen@hostel.com" },
  { username: "staff", role: ROLES.STAFF, name: "Mr. Rajesh (Security)", phone: "98765 12343", dob: "1990-12-10", email: "staff@hostel.com" },
];

export const wardens = [
  { id: "WRD-001", name: "Mr. Suresh Kumar", phone: "98765 12340", dob: "1978-04-12", email: "suresh.kumar@hosteller.edu" },
];
