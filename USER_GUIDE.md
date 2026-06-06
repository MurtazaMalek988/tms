# TAMS – User Guide (Non-Technical)

**Teacher Attendance Management System**

This guide explains how to use TAMS in simple steps. You do not need any technical knowledge to use the daily features (login, mark attendance, view reports).

---

## Table of Contents

1. [What is TAMS?](#1-what-is-tams)
2. [Who uses TAMS?](#2-who-uses-tams)
3. [How to open the system](#3-how-to-open-the-system)
4. [First login (Administrator)](#4-first-login-administrator)
5. [Administrator guide](#5-administrator-guide)
6. [Teacher guide](#6-teacher-guide)
7. [How attendance works](#7-how-attendance-works)
8. [School location (GPS) rules](#8-school-location-gps-rules)
9. [Common problems and fixes](#9-common-problems-and-fixes)
10. [Quick reference card](#10-quick-reference-card)

---

## 1. What is TAMS?

TAMS is a web-based system that helps a school:

- Track **teacher attendance** every day
- Know who is **Present**, **Absent**, **On Short Leave**, or **On Medical Leave**
- Make sure teachers mark attendance **only when they are at school** (using phone/laptop location)
- View **reports** and download them as Excel or PDF

You use it in a **web browser** (Chrome, Edge, Firefox, or Safari) — like opening a website. No app install is required.

---

## 2. Who uses TAMS?

| Role | Who | What they do |
|------|-----|----------------|
| **Administrator (Principal)** | School head / office staff | Add teachers, change settings, view all attendance, download reports |
| **Teacher** | Teaching staff | Check in when arriving, check out when leaving, apply medical leave |

Each role has a **separate login page**.

---

## 3. How to open the system

Ask your IT person or the person who installed TAMS for the **website address**. Examples:

- On the school computer: `http://localhost:3000`
- On the internet: `https://yourschool.com` (your actual domain)

### Home page

When you open the address, you will see two options:

| Button | For |
|--------|-----|
| **Admin Login** | Principal / administrator |
| **Teacher Login** | Teachers |

### Direct links (if using default setup on one computer)

| Page | Address |
|------|---------|
| Home | `http://localhost:3000/` |
| Admin login | `http://localhost:3000/admin/login` |
| Teacher login | `http://localhost:3000/teacher/login` |

> **Tip:** Bookmark the correct login page on your phone or computer so you can open it quickly every day.

---

## 4. First login (Administrator)

When TAMS is installed for the first time, default administrator accounts are created:

| Username | Default password | Note |
|----------|------------------|------|
| `admin` | `admin123` | Main administrator |
| `principal2` | `principal123` | Second administrator (optional) |

### Important — do this on day one

1. Log in at **Admin Login**
2. Go to **Settings** (left menu)
3. Scroll to **Change Password**
4. Enter your current password and choose a **new strong password**
5. Save it somewhere safe (password manager or secure note)

**Never share your admin password with teachers.**

---

## 5. Administrator guide

After logging in as admin, you will see a menu on the left:

- Dashboard  
- Teachers  
- Attendance  
- Reports  
- Settings  

---

### 5.1 Dashboard

**Purpose:** See today’s attendance summary at a glance.

**What you see:**

- Total number of teachers
- How many are **Present**, **Absent**, **Short Leave**, **Medical Leave**, or **Not Marked** today
- Recent check-in activity

**What to do:** Open this each morning to see who has arrived. Click **Refresh** to update the numbers.

---

### 5.2 Teachers

**Purpose:** Manage all teacher accounts.

#### Add one teacher manually

1. Go to **Teachers**
2. Click **Add Teacher**
3. Fill in:
   - **Name** (required)
   - **Mobile number** (optional)
   - **Username** (required — teacher will use this to log in)
   - **Password** (required — give this to the teacher securely)
4. Click **Save**

#### Add many teachers using Excel

1. Create an Excel file (`.xlsx`) with these **exact column names** in row 1:

   | Teacher Name | Mobile Number | Username | Password |
   |--------------|---------------|----------|----------|
   | Ali Hassan | 03001234567 | ali.hassan | pass1234 |
   | Sara Khan | 03111234567 | sara.khan | pass5678 |

2. Go to **Teachers** → **Import Excel**
3. Select your file and upload
4. Fix any errors shown and re-upload if needed

**Rules for Excel import:**

- Teacher Name — required  
- Username — required, unique, at least 3 characters  
- Password — required, at least 4 characters  
- Mobile Number — optional  

#### Edit a teacher

1. Find the teacher in the list
2. Click the **Edit** (pencil) icon
3. Change name, mobile, or username
4. Save

#### Reset a teacher’s password

If a teacher forgets their password:

1. Find the teacher in the list
2. Click the **Key** icon (Reset Password)
3. Enter a new password
4. Tell the teacher the new password privately

#### Delete a teacher

1. Click the **Delete** (trash) icon
2. Confirm deletion

> **Warning:** Deleting a teacher removes their account. Past attendance records may still exist in reports.

---

### 5.3 Attendance

**Purpose:** View and correct attendance records for any date.

**How to use:**

1. Go to **Attendance**
2. Pick a **date** (defaults to today)
3. Optionally filter by **status** or search by teacher name
4. Browse the list

**Edit a record (if needed):**

1. Click **Edit** on a row
2. Change status (Present / Absent / Short Leave / Medical Leave)
3. Add **remarks** (notes) if needed
4. Save

Use this when a teacher had a genuine issue (e.g. phone GPS failed) and you need to fix their record manually.

---

### 5.4 Reports

**Purpose:** View and download attendance reports.

**Report types:**

| Type | Shows |
|------|--------|
| **Daily** | One specific day |
| **Weekly** | A week of records |
| **Monthly** | A full month |

**How to use:**

1. Go to **Reports**
2. Choose **Daily**, **Weekly**, or **Monthly**
3. Pick the date or month
4. Click **Generate Report**
5. To download: click **Export Excel** or **Export PDF**

Share these files with management or keep them for records.

---

### 5.5 Settings

**Purpose:** Configure your school and attendance rules.

#### School information

- **School Name** — appears in the system (e.g. "City Public School")

#### Geofence (school location) — **very important**

This controls whether teachers can mark attendance **only when they are at school**.

1. Stand at the **main school building** (or the point you want as “school centre”)
2. Click **Use my current location as school**
   - Or enter **Latitude** and **Longitude** manually if you have them
3. Set **Allowed Radius** in metres (e.g. **100** = within 100 metres of the school point)
4. Click **Save Settings**

| Radius example | Meaning |
|----------------|---------|
| 50 m | Small building / strict |
| 100 m | Normal school building |
| 200–300 m | Larger campus |

**Teachers cannot check in/out until this is set correctly.**

#### Attendance time rules

| Setting | Meaning |
|---------|---------|
| **Short Leave Cutoff** | If a teacher checks out **before** this time, they are marked **Short Leave** instead of full day present |
| **Late Arrival Cutoff** | Check-in after this time can be treated as late (for records) |
| **Absence Processing Time** | Time when the system processes who did not mark attendance |

Adjust these to match your school policy, then **Save Settings**.

#### Change your admin password

1. Scroll to **Change Password**
2. Enter current password, new password, and confirm
3. Click **Update Password**

---

### 5.6 Logout

Click **Logout** at the bottom of the left menu when you are finished.

---

## 6. Teacher guide

Teachers use the **Teacher Login** page only.

---

### 6.1 Logging in

1. Open **Teacher Login** (`/teacher/login`)
2. Enter **username** and **password** (given by administrator)
3. Click **Sign In**

If login fails, contact the school office to reset your password.

---

### 6.2 Teacher dashboard

After login you see:

- **Today’s status** — Present, Absent, Not Marked, etc.
- **Check In** button
- **Check Out** button
- **Apply Medical Leave** button
- **Location status** — whether you are inside school premises

---

### 6.3 Check In (arriving at school)

**When:** When you arrive at school and are **inside the school area**.

**Steps:**

1. Allow **Location** when the browser asks (required)
2. Wait until the box shows **“Inside school premises”** (green)
3. Click **Check In**
4. You should see a success message and your check-in time

**If the button is disabled:** You are outside the allowed area. Move closer to the school building and wait for the green message, then try again.

---

### 6.4 Check Out (leaving school)

**When:** When you leave for the day (while still at or near school).

**Steps:**

1. Make sure location shows **inside school premises**
2. Click **Check Out**
3. Your check-out time is recorded

**Short Leave:** If you check out **before** the school’s “Short Leave Cutoff” time (set by admin), you may be marked as **Short Leave** for that day.

---

### 6.5 Medical Leave

**When:** You are sick or on medical leave and **cannot** come to school.

**Steps:**

1. Click **Apply Medical Leave** (only before you check in that day)
2. Optionally write a **reason**
3. Optionally upload a **medical certificate** (PDF or image)
4. Submit

You **cannot** apply medical leave after checking in the same day.

---

### 6.6 Location permission (teachers must allow this)

TAMS needs your **location** to verify you are at school.

**On phone (Chrome / Safari):**

- Tap **Allow** when asked for location
- If blocked: open browser settings → Site settings → Location → Allow

**On Windows laptop:**

- Settings → Privacy & security → Location → **On**
- In the browser: click the lock icon in the address bar → Location → **Allow**

**If location is slow:** Wait 10–20 seconds and tap **Retry**.

---

### 6.7 Logout

Click **Logout** in the left menu when finished.

---

## 7. How attendance works

### Daily statuses

| Status | Meaning |
|--------|---------|
| **Not Marked** | Teacher has not checked in yet today |
| **Present** | Teacher checked in (and has not left early as short leave) |
| **Absent** | Teacher did not mark attendance |
| **Short Leave** | Teacher left before the short-leave cutoff time |
| **Medical Leave** | Teacher applied medical leave for that day |

### Typical day

```
Morning  → Teacher arrives → Check In (at school)
Evening  → Teacher leaves  → Check Out (at school)
```

### What teachers cannot do

- Check in from home (if school location is configured)
- Check in twice on the same day
- Check out without checking in first
- Apply medical leave after checking in

---

## 8. School location (GPS) rules

### Why location is used

To prevent teachers from marking attendance when they are not at school, the system compares their phone/laptop GPS to the school’s saved location.

### For administrators

- Set school location **once** in Settings
- Test with a teacher account while standing at school
- Increase **radius** if teachers inside the building still show “outside”

### For teachers

- You must be **physically at school** (within the allowed distance)
- Location must be **turned on** in your device and browser
- Wi‑Fi or mobile data helps location work faster

### If GPS is wrong sometimes

- Stand near a window or open area
- Retry location
- If it keeps failing, tell the administrator — they can adjust radius or fix your attendance manually

---

## 9. Common problems and fixes

| Problem | What to try |
|---------|-------------|
| **Page does not open** | Check internet; confirm the correct website address with IT |
| **“Invalid username or password”** | Check caps lock; ask admin to reset password |
| **Redirected to login** | Session expired — log in again |
| **“Unable to get your location”** | Allow location in browser; turn on device location; click Retry |
| **“Outside school premises”** | Move closer to school; ask admin to check radius in Settings |
| **Check In button greyed out** | Wait for green “Inside school premises”; fix location first |
| **Teacher forgot password** | Admin: Teachers → Reset Password |
| **New teacher cannot log in** | Admin: confirm account was created and username is correct |
| **Reports empty** | Choose correct date; ensure teachers marked attendance that day |
| **School location not set** | Admin must save latitude/longitude in Settings |

---

## 10. Quick reference card

### Administrator — first week checklist

- [ ] Log in and **change default password**
- [ ] Set **school name** in Settings
- [ ] Set **school location** and **radius** in Settings
- [ ] Set **time rules** (short leave, late, absence time)
- [ ] **Add teachers** (manually or Excel import)
- [ ] Give each teacher their **username and password**
- [ ] Test **Check In** with one teacher at school
- [ ] Open **Dashboard** and **Reports** to confirm data appears

### Administrator daily routine

1. Open Dashboard → see who is present  
2. Check Attendance if any corrections needed  
3. Export reports when required (weekly/monthly)

### Teacher daily routine

1. Arrive at school  
2. Open Teacher Login on phone  
3. Allow location → wait for “Inside school premises”  
4. **Check In**  
5. Before leaving → **Check Out**

### Important URLs (default local setup)

| Page | URL |
|------|-----|
| Home | `http://localhost:3000/` |
| Admin login | `http://localhost:3000/admin/login` |
| Teacher login | `http://localhost:3000/teacher/login` |
| Admin dashboard | `http://localhost:3000/admin` |

*(Replace `localhost:3000` with your school’s real web address when deployed online.)*

### Default first-time admin login (change immediately)

| Username | Password |
|----------|----------|
| admin | admin123 |

---

## Need technical help?

If the **whole system is down**, servers need updating, or the website must be installed on a new computer — that requires a technical person. See **DEPLOYMENT.md** in the project folder for server installation steps.

For **daily use** (login, teachers, attendance, reports, settings), this guide covers everything you need.

---

*TAMS – Teacher Attendance Management System · University Project*
