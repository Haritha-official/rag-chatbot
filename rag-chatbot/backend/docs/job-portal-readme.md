# Job Portal Project

A full-stack job portal built with React, Node.js, Express, and PostgreSQL.

## Features

The app supports role-based accounts for job seekers and companies. Job seekers
can create profiles, upload resumes, and apply to jobs. Companies can post jobs,
view applicants, and manage their listings. Authentication uses password
hashing so credentials are never stored in plain text.

## API design

The backend exposes a REST API with scoped queries, meaning companies can only
ever see applicants who applied to their own job postings, not applicants from
other companies. This is enforced at the database query level, not just in the
frontend.

## Skill matching

When a job seeker applies, the system compares the skills listed on their
profile against the skills required by the job posting, and shows a match
percentage to both the applicant and the company reviewing them.

## Deployment

The frontend is deployed on Vercel, the backend on Railway, and the database
runs on Supabase. The setup required configuring SSL for the database
connection and setting up CORS so the frontend (on a different domain) could
call the backend API.