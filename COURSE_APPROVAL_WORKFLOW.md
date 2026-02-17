# Course Approval Workflow Implementation

## Overview
Implemented a comprehensive course submission and approval system where:
- **Mentors** build courses and submit for review (lock editing/uploads)
- **Admins** review full curriculum with lessons, tasks, and test cases
- **Admins** approve (publish) or reject (with reason) courses
- Only **published** courses appear in marketplace

---

## 🗄️ Database Changes

### Course Entity Fields Added
- `submittedAt` (Date) — When mentor clicked "Submit for Review"
- `publishedAt` (Date) — When admin approved/published
- `publishedBy` (User) — Admin who published
- `publishedById` (String) — Admin ID reference
- `rejectReason` (String) — Reason for rejection (if rejected)

### Course Status Enum
```typescript
export enum CourseStatus {
    DRAFT = 'draft',              // Initial state
    UNDER_REVIEW = 'under_review', // After mentor submits
    PUBLISHED = 'published',      // Admin approves
    REJECTED = 'rejected',        // Admin rejects (can resubmit)
    ARCHIVED = 'archived',        // Deprecated/archived
}
```

**Removed:** `approved` state (no longer needed)

---

## 🔄 Workflow Steps

### Step 1: Mentor Builds Course
- Status: `DRAFT`
- Can edit modules, chapters, blocks, tasks
- Can upload/modify everything

### Step 2: Mentor Submits for Review
**Endpoint:** `POST /api/courses/:id/submit`
- **Method:** `submitForReview(user, courseId)`
- **Changes:**
  - `status` → `UNDER_REVIEW`
  - `submittedAt` → Current timestamp
- **Locks:**
  - ❌ Cannot add/edit modules (checked in `createModule`, `createChapter`, `createBlock`)
  - ❌ Cannot reorder items
  - ❌ Cannot upload files

### Step 3: Admin Reviews Course
**Endpoint:** `GET /api/courses/:id`
- Returns full course with:
  - All modules (ordered)
  - All chapters (ordered)
  - All lesson blocks (ordered by `orderIndex`)
  - All tasks (ordered by `orderIndex`)
  - Task options
  - Test cases
- Admin sees in dashboard: thumbnail, metadata, full curriculum preview

### Step 4a: Admin Approves (Publishes)
**Endpoint:** `POST /api/courses/:id/approve`
- **Method:** `approveCourse(user, courseId)`
- **Requirements:** User must be ADMIN, course must be `UNDER_REVIEW`
- **Changes:**
  - `status` → `PUBLISHED`
  - `publishedAt` → Current timestamp
  - `publishedBy` → Admin user object
  - `visibility` → `PUBLIC`
- **Result:** Course now visible in marketplace (student listing)

### Step 4b: Admin Rejects
**Endpoint:** `POST /api/courses/:id/reject`
- **Method:** `rejectCourse(user, courseId, reason)`
- **Requirements:** User must be ADMIN, course must be `UNDER_REVIEW`
- **Changes:**
  - `status` → `REJECTED`
  - `rejectReason` → Admin's feedback
- **Mentor Can:** Edit, fix, and resubmit (status can go back to `UNDER_REVIEW`)

---

## 🛡️ Access Control & Locks

### When Course is `UNDER_REVIEW`
✅ **Admin can:**
- View full curriculum (`GET /api/courses/:id`)
- View chapters with all blocks/tasks (`GET /api/chapters/:id`)
- Approve or reject

❌ **Mentor cannot:**
- Add/edit modules, chapters, blocks, tasks
- Reorder items
- Upload files

**Code Check:** All modification endpoints check:
```typescript
if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
    throw new ForbiddenException('Cannot modify course structure unless it is in draft or rejected status');
}
```

### When Course is `PUBLISHED`
✅ **Students can:**
- Enroll (if paid)
- Access free lessons
- Access lessons if enrolled (for paid courses)

✅ **Admin can:**
- View course (read-only)

❌ **Mentor cannot:**
- Edit published course

❌ **Students cannot:**
- Enroll in unpublished courses

**Code Check in `findAll()` and `enroll()`:
```typescript
where: { status: CourseStatus.PUBLISHED, visibility: CourseVisibility.PUBLIC }

if (course.status !== CourseStatus.PUBLISHED) {
    throw new BadRequestException('Course is not available for enrollment');
}
```

---

## 📝 Lesson Access Logic

**For Paid Courses:**
```typescript
if (course.accessType === 'free') {
    return chapter; // Always allow free courses
}

if (chapter.isFreePreview) {
    return chapter; // Allow free preview chapters
}

if (!userId) {
    throw new ForbiddenException('Identification required');
}

if (course.mentorId === userId) {
    return chapter; // Mentor can access own course
}

// Check enrollment
const isEnrolled = await enrollmentsRepository.findOne({
    where: { courseId: course.id, userId, status: 'active' }
});

if (!isEnrolled) {
    throw new ForbiddenException('You must be enrolled');
}
```

---

## 🎨 Frontend Changes

### Mentor Dashboard
**File:** `frontend/src/app/mentor/dashboard/courses/[courseId]/builder/page.tsx`
- ✅ Shows course status badge (draft, under_review, published, rejected, archived)
- ✅ Displays reject reason if status is `rejected`
- ✅ Shows "Submit for Review" button when status is `draft` or `rejected`
- ✅ Disables module/chapter/block additions when `under_review` or `published`

### Admin Dashboard - Course Reviews Tab
**File:** `frontend/src/app/admin/dashboard/page.tsx`
- ✅ New tab: "Course Reviews"
- Fetches courses with `status=under_review`
- Lists courses with: thumbnail, title, mentor name, level, category, price
- "Review Course" button → details page

### Admin Course Review Page
**File:** `frontend/src/app/admin/dashboard/courses/[courseId]/page.tsx`
- ✅ Shows course thumbnail, metadata
- ✅ Full curriculum preview (expandable modules → chapters → blocks → tasks)
- ✅ Task previews with points
- ✅ Test case count
- ✅ Two buttons: "Approve & Publish" / "Reject" (with reason modal)

---

## 🔌 Backend Endpoints Summary

### Course Submission & Approval
| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/api/courses/:id/submit` | POST | MENTOR | Submit for review |
| `/api/courses/:id/approve` | POST | ADMIN | Approve & publish |
| `/api/courses/:id/reject` | POST | ADMIN | Reject with reason |

### Course Fetching
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/courses` | GET | List published courses (marketplace) |
| `/api/courses/:id` | GET | Get full course details (mentor builder, admin review) |
| `/api/courses/admin/all?status=under_review` | GET | Admin dashboard — courses pending review |

### Enhanced Relations
**When fetching a course** (`GET /api/courses/:id`), now includes:
- `modules` + `chapters` (ordered by orderIndex)
- `chapters.blocks` (ordered by orderIndex)
- `chapters.tasks` + `chapters.tasks.options` + `chapters.tasks.testCases`

**Allows admin to see:** Full curriculum structure with all content blocks and tasks

---

## ✅ Implementation Checklist

- [x] Added DB fields: `submittedAt`, `publishedAt`, `publishedById`, `publishedBy`, `rejectReason`
- [x] Updated CourseStatus enum (added under_review, published, rejected)
- [x] Implemented `submitForReview()` — locks course editing
- [x] Implemented `approveCourse()` — sets published, visibility=PUBLIC
- [x] Implemented `rejectCourse()` — sets rejected, stores reason
- [x] Added access control — prevent editing when under_review/published
- [x] Enhanced course fetch — includes blocks, tasks, test cases
- [x] Updated admin chapter access — allow admins to view chapters
- [x] Frontend mentor builder — show submit button, lock UI when under_review
- [x] Frontend admin dashboard — course reviews tab with status filter
- [x] Frontend admin review page — full curriculum preview, approve/reject buttons
- [x] Marketplace logic — only published + public courses shown
- [x] Lesson access logic — respects isFreePreview, enrollment, mentor access

---

## 🚀 Testing Flow

### Mentor Testing
1. Create course (DRAFT)
2. Add modules, chapters, blocks, tasks
3. Click "Submit for Review" (becomes UNDER_REVIEW)
4. Try to add module → Should fail with "Cannot modify course structure..."
5. See rejection reason if admin rejects
6. Fix and resubmit

### Admin Testing
1. Open Admin Dashboard → Course Reviews tab
2. See courses with status=under_review
3. Click "Review Course"
4. See full curriculum with all blocks and tasks
5. Click "Approve & Publish" → Course published, visible to students
6. OR Click "Reject" → Enter reason → Course back to rejected status

### Student Testing
1. Browse marketplace (only published courses shown)
2. Enroll in paid course
3. Access free preview chapters without enrollment
4. Access enrolled chapters with enrollment

---

## 📌 Important Notes

- **Backwards Compatibility:** Existing courses need migration (set status=PUBLISHED if approved, DRAFT otherwise)
- **Admin Override:** Admins can view chapters of any course (not just their own)
- **Soft Delete:** Chapters support soft delete via `@DeleteDateColumn()`
- **Marketplace Filter:** `status=PUBLISHED` AND `visibility=PUBLIC` required
- **Edit Lock:** DRAFT and REJECTED statuses allow editing; UNDER_REVIEW, PUBLISHED, ARCHIVED do not

