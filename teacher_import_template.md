# Teacher Excel Import Template

Create an `.xlsx` file with these **exact column headers** in row 1:

| Teacher Name | Mobile Number | Username | Password |
|---|---|---|---|
| Ali Hassan | 03001234567 | ali.hassan | pass1234 |
| Sara Khan | 03111234567 | sara.khan | pass5678 |

**Rules:**
- `Teacher Name` – required
- `Mobile Number` – optional
- `Username` – required, must be unique, minimum 3 characters
- `Password` – required, minimum 4 characters (stored as hash, teachers given these credentials)

Save the file as `.xlsx` or `.xls` and upload via **Teachers → Import Excel** in the principal dashboard.
