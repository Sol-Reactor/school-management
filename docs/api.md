# API reference

Base path: `/api`. All endpoints except `auth/register`, `auth/login`, `auth/demo`,
`auth/logout` and `health` need a session cookie (or a `Bearer` token).

## Error format

Every error response has the same shape:

```json
{ "message": "Validation failed", "errors": [{ "path": "email", "message": "Enter a valid email address" }] }
```

`errors` appears only on validation failures (400).

| Status | Meaning |
| --- | --- |
| 400 | invalid input (zod) or malformed JSON |
| 401 | not signed in or session expired |
| 403 | signed in but not allowed, including writes from demo accounts |
| 404 | record or route not found |
| 409 | duplicate, or the record is still referenced |
| 429 | rate limited |

List endpoints take `page` (default 1) and `limit` (default 10, max 100). They return
`{ <items>, pagination: { page, limit, total, pages } }`.

## Endpoints

"Scoped" means results are filtered to what the caller may see. The rules are in
[security.md](security.md#authorization).

### Auth: `/api/auth`
| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| POST | `/register` | public | role `STUDENT` or `PARENT` only; optional `parentEmail` |
| POST | `/login` | public | sets the session cookie |
| POST | `/demo` | public | `{ role }`: signs in to the read-only demo account for that role |
| POST | `/logout` | any | clears the cookie |
| GET | `/profile` | signed in | |
| PUT | `/profile` | signed in | `fullName`, `avatar` |

### Users: `/api/users` (admin only)
`GET /` (filter: `role`, `search`) · `POST /` (creates any role) · `GET /:id` ·
`PUT /:id` (`fullName`) · `DELETE /:id` (removes dependent records; refuses teachers who
still have exams or timetable slots)

### Students: `/api/students`
| Method | Path | Who |
| --- | --- | --- |
| GET | `/` | teacher (their students), admin. Filters: `classId`, `search` |
| GET | `/:id` | admin, the student, their parent, a teacher of their class |
| PATCH | `/:id/class` | admin |
| PATCH | `/:id/parent` | admin |

### Classes: `/api/classes`
| Method | Path | Who |
| --- | --- | --- |
| GET | `/` | scoped |
| GET | `/:id` | members. Classmates' contact details only for the teacher or admin |
| POST | `/` | teacher (always for themselves), admin (`teacherEmail` optional) |
| PUT | `/:id` | class teacher, admin. Only admin changes `teacherId` |
| DELETE | `/:id` | admin. Refused if the class has exams or attendance |
| GET | `/:id/students` | class teacher, admin |
| GET | `/:id/subjects` | members |

### Attendance: `/api/attendance`
| Method | Path | Who |
| --- | --- | --- |
| GET | `/` | teacher (their classes), admin |
| GET | `/student/:studentId` | anyone who can view the student. Returns `{ attendance, summary }` |
| GET | `/class/:classId` | class teacher, admin |
| GET | `/:id` | anyone who can view the student |
| POST | `/` | class teacher, admin. One record per student per class per day |
| PUT | `/:id` | class teacher, admin |

### Exams: `/api/exams`
`GET /` (scoped) · `GET /class/:classId` (members) · `GET /:id` (grades filtered to the
caller's scope) · `POST /` (class teacher or admin) · `PUT /:id` and `DELETE /:id` (exam
teacher, class teacher or admin; delete also removes the exam's grades)

### Grades: `/api/grades`
`GET /` (teacher scoped, admin) · `GET /student/:studentId` (anyone who can view the
student) · `GET /exam/:examId` (exam teacher, admin) · `POST /` (exam teacher, admin;
`subjectId` is taken from the exam, and the student must be in the exam's class; `marks`
0–100) · `PUT /:id` and `DELETE /:id` (exam teacher, admin)

### Timetable: `/api/timetable`
`GET /` · `GET /class/:classId` (members, grouped by day) · `GET /teacher/:teacherId`
(the teacher themselves, admin) · `POST /`, `PUT /:id` and `DELETE /:id` (class teacher,
admin). Times are `HH:MM`. Slots that overlap for the same class **or** the same teacher
are rejected with 409.

### Subjects: `/api/subjects`
`GET /` · `GET /:id` (student grades included for admins only) · `POST /` and `PUT /:id`
(teacher or admin; teachers can attach a subject only to their own classes) ·
`DELETE /:id` (admin; refused if the subject has exams or grades) ·
`PATCH /:id/assign-class` (class teacher, admin)

### Teachers, parents and relationships
- `GET /api/teachers` (admin) · `GET /api/teachers/:id[/classes|/students]` (the teacher themselves, admin)
- `GET /api/parents` (admin) · `GET /api/parents/:id[/children]` (the parent themselves, admin)
- `POST /api/relationships/students/:studentId/parents` (the student themselves, admin)
- `DELETE /api/relationships/students/:studentId/parents/:parentId` (the student, the linked parent, admin)

### Enrollments: `/api/enrollments`
`GET /` (teacher scoped, admin) · `POST /` (admin) · `POST /assign` with
`{ studentEmail, classId }` (class teacher, admin) · `DELETE /:id` (admin)

### Notifications: `/api/notifications` (own notifications only)
`GET /?unreadOnly=true` · `PUT /read-all` · `PUT /:id/read` · `DELETE /:id`

### Health
`GET /health` and `GET /api/health` → `{ status, database }`
