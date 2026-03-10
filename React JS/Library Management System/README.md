# Library Management

This app has:
- React frontend (`http://localhost:3000`)
- Node API (`http://localhost:8080/api`)

## Run Locally

1. Install dependencies:
   - `npm install`
2. Start API:
   - `npm run api`
3. In a second terminal, start frontend:
   - `npm start`

## Database Integration

These modules are wired end-to-end (`GET`, `POST`, `PUT`, `DELETE`):
- Frontend pages under `src/components/Pages/*` (Books, Authors, Members, Libraries, Librarians, Categories, Catalog Entries, Book Copies, Borrowing Records, Fines, Requests, Notifications)
- API client: `src/api/api.js`
- Backend route/storage: `server/server.js` + `server/data/database.json`

When API is running, create/edit/delete persists in `server/data/database.json`.

## Borrowing Troubleshooting

If book borrowing fails:
- Make sure backend is running (`npm run api`)
- Use a book title that exists in the Books page (exact title)
- Ensure the selected book has `availableCopies > 0`
