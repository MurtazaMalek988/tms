# TAMS – Teacher Attendance Management System

A web system for schools to manage teacher attendance with GPS-based check-in at school premises.

## For end users (non-technical)

**Start here:** [USER_GUIDE.md](./USER_GUIDE.md)

Plain-language guide for principals and teachers — login, adding teachers, marking attendance, reports, and troubleshooting.

## For technical staff

**Server installation:** [DEPLOYMENT.md](./DEPLOYMENT.md)

**Teacher Excel import format:** [teacher_import_template.md](./teacher_import_template.md)

## Quick start (development)

```bash
cp .env.example .env
docker compose up -d --build
```

Open `http://localhost:3000`

| Role | Login URL |
|------|-----------|
| Admin | http://localhost:3000/admin/login |
| Teacher | http://localhost:3000/teacher/login |

Default admin (change after first login): `admin` / `admin123`
